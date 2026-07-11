import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import {
  classifyMpVerificationMatch,
  parseMpVerificationSubmission,
} from "@/lib/mp-verification";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const requestSelect = {
  id: true,
  identityType: true,
  name: true,
  graduationClass: true,
  className: true,
  teacherPosition: true,
  status: true,
  adminNote: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
} as const;

function requestDto(request: {
  id: string;
  identityType: string;
  name: string;
  graduationClass: string | null;
  className: string | null;
  teacherPosition: string | null;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
}) {
  return {
    id: request.id,
    identityType: request.identityType,
    name: request.name,
    graduationClass: request.graduationClass,
    className: request.className,
    teacherPosition: request.teacherPosition,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const request = await prisma.identityVerificationRequest.findFirst({
      where: { userId: auth.auth.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: requestSelect,
    });
    return mpSuccess({
      verificationStatus: auth.auth.user.verificationStatus,
      request: request ? requestDto(request) : null,
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "认证状态加载失败，请稍后再试",
      500,
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  const ip = getClientIp(req);
  const [userLimit, ipLimit] = await Promise.all([
    rateLimit(`mp:verification:user:${auth.auth.user.id}`, 5, 60 * 60 * 1000),
    rateLimit(`mp:verification:ip:${ip}`, 20, 60 * 60 * 1000),
  ]);
  if (!userLimit.ok || !ipLimit.ok) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "认证申请提交过于频繁，请稍后再试",
      429,
      {
        headers: {
          "Retry-After": String(
            Math.max(userLimit.retryAfter, ipLimit.retryAfter),
          ),
        },
      },
    );
  }

  try {
    const body = await readJsonBody<unknown>(req, 4096);
    const parsed = parseMpVerificationSubmission(body);
    if (!parsed.ok) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        parsed.message,
        400,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: auth.auth.user.id },
        select: {
          accountStatus: true,
          verificationStatus: true,
        },
      });
      if (!currentUser || currentUser.accountStatus !== "ACTIVE") {
        return { kind: "UNAVAILABLE" as const };
      }
      if (currentUser.verificationStatus === "VERIFIED") {
        return { kind: "VERIFIED" as const };
      }
      if (currentUser.verificationStatus === "PENDING") {
        return { kind: "PENDING" as const };
      }

      const existing = await tx.identityVerificationRequest.findFirst({
        where: { userId: auth.auth.user.id, status: "PENDING" },
        select: { id: true },
      });
      if (existing) return { kind: "PENDING" as const };

      let matches: Array<{ id: string }> = [];
      if (parsed.value.identityType !== "TEACHER") {
        matches = await tx.whitelistRoster.findMany({
          where: {
            name: parsed.value.name,
            graduationClass: parsed.value.graduationClass,
          },
          orderBy: { id: "asc" },
          take: 2,
          select: { id: true },
        });
      }
      const { matchResult, matchedRosterId } =
        classifyMpVerificationMatch(parsed.value.identityType, matches);

      const created = await tx.identityVerificationRequest.create({
        data: {
          userId: auth.auth.user.id,
          ...parsed.value,
          matchResult,
          matchedRosterId,
          status: "PENDING",
        },
        select: requestSelect,
      });
      await tx.user.update({
        where: { id: auth.auth.user.id },
        data: {
          verificationStatus: "PENDING",
          identityType: parsed.value.identityType,
          name: parsed.value.name,
          graduationClass: parsed.value.graduationClass,
          className: parsed.value.className,
          teacherPosition: parsed.value.teacherPosition,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "mp-verification-submit",
          targetType: "IdentityVerificationRequest",
          targetId: created.id,
          adminId: auth.auth.user.id,
          before: null,
          after: JSON.stringify({
            requestId: created.id,
            identityType: parsed.value.identityType,
            status: "PENDING",
            matchResult,
          }),
        },
      });
      return { kind: "CREATED" as const, request: created };
    });

    if (result.kind === "UNAVAILABLE") {
      return mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "登录状态已失效，请重新登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      );
    }
    if (result.kind === "VERIFIED") {
      return mpError(
        MP_ERROR_CODES.ALREADY_VERIFIED,
        "当前账号已完成认证",
        409,
      );
    }
    if (result.kind === "PENDING") {
      return mpError(
        MP_ERROR_CODES.VERIFICATION_PENDING,
        "已有待审核的认证申请",
        409,
      );
    }

    return mpSuccess(
      {
        verificationStatus: "PENDING" as const,
        request: requestDto(result.request),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return mpError(
        MP_ERROR_CODES.PAYLOAD_TOO_LARGE,
        "请求体过大",
        413,
      );
    }
    if (error instanceof SyntaxError) {
      return mpError(MP_ERROR_CODES.INVALID_JSON, "JSON 格式无效", 400);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return mpError(
        MP_ERROR_CODES.VERIFICATION_PENDING,
        "已有待审核的认证申请",
        409,
      );
    }
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "认证申请提交失败，请稍后再试",
      500,
    );
  }
}
