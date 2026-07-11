import { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { parseMpProfilePatch } from "@/lib/mp-profile";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const profileSelect = {
  id: true,
  name: true,
  identityType: true,
  verificationStatus: true,
  graduationClass: true,
  className: true,
  teacherPosition: true,
  contact: true,
  city: true,
  university: true,
  major: true,
  industry: true,
  contactVisibility: true,
} as const;

export async function GET(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.auth.user.id },
      select: profileSelect,
    });
    if (!user) {
      return mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "登录状态已失效，请重新登录",
        401,
      );
    }
    return mpSuccess({ user });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "个人资料加载失败，请稍后再试",
      500,
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  const limit = await rateLimit(
    `mp:profile:${auth.auth.user.id}:${getClientIp(req)}`,
    30,
    60 * 1000,
  );
  if (!limit.ok) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "资料更新过于频繁，请稍后再试",
      429,
      { headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = await readJsonBody<unknown>(req, 16_384);
    const parsed = parseMpProfilePatch(body);
    if (!parsed.ok) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        parsed.message,
        400,
      );
    }

    const changedFields = Object.keys(parsed.value).sort();
    const user = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: auth.auth.user.id },
        select: { contactVisibility: true },
      });
      if (!current) return null;

      const updated = await tx.user.update({
        where: { id: auth.auth.user.id },
        data: parsed.value,
        select: profileSelect,
      });
      await tx.auditLog.create({
        data: {
          action: "mp-profile-update",
          targetType: "User",
          targetId: auth.auth.user.id,
          adminId: auth.auth.user.id,
          before: JSON.stringify({
            changedFields,
            contactVisibility: current.contactVisibility,
          }),
          after: JSON.stringify({
            changedFields,
            contactVisibility: updated.contactVisibility,
          }),
        },
      });
      return updated;
    });
    if (!user) {
      return mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "登录状态已失效，请重新登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      );
    }
    return mpSuccess({ user });
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
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "个人资料更新失败，请稍后再试",
      500,
    );
  }
}
