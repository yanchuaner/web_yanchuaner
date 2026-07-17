import { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import {
  buildDeletedRegistrationData,
  buildDeletedUserData,
  parseMpAccountDeletionConfirmation,
} from "@/lib/mp-account-deletion";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  const [userLimit, ipLimit] = await Promise.all([
    rateLimit(
      `mp:account-deletion:user:${auth.auth.user.id}`,
      5,
      60 * 60 * 1000,
    ),
    rateLimit(
      `mp:account-deletion:ip:${getClientIp(req)}`,
      20,
      60 * 60 * 1000,
    ),
  ]);
  if (!userLimit.ok || !ipLimit.ok) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "注销请求过于频繁，请稍后再试",
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
    const body = await readJsonBody<unknown>(req, 1024);
    const parsed = parseMpAccountDeletionConfirmation(body);
    if (!parsed.ok) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        parsed.message,
        400,
      );
    }
    if (auth.auth.user.role === "ADMIN") {
      return mpError(
        MP_ERROR_CODES.FORBIDDEN,
        "管理员账号不能自助注销，请先移交管理员权限",
        403,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: auth.auth.user.id },
        select: { id: true, role: true, accountStatus: true },
      });
      if (!current || current.accountStatus !== "ACTIVE") {
        throw new Error("ACCOUNT_UNAVAILABLE");
      }
      if (current.role === "ADMIN") throw new Error("ADMIN_DELETION_FORBIDDEN");

      const deletedUser = await tx.user.updateMany({
        where: {
          id: current.id,
          accountStatus: "ACTIVE",
          role: { not: "ADMIN" },
        },
        data: buildDeletedUserData(),
      });
      if (deletedUser.count !== 1) throw new Error("ACCOUNT_UNAVAILABLE");

      const [wechatIdentities, verificationRequests, registrations] =
        await Promise.all([
          tx.wechatIdentity.deleteMany({ where: { userId: current.id } }),
          tx.identityVerificationRequest.deleteMany({
            where: { userId: current.id },
          }),
          tx.eventRegistration.updateMany({
            where: { userId: current.id },
            data: buildDeletedRegistrationData(),
          }),
        ]);
      const mergedUsers = await tx.user.updateMany({
        where: { mergedIntoUserId: current.id },
        data: { mergedIntoUserId: null },
      });

      await tx.auditLog.create({
        data: {
          action: "mp-account-deletion",
          targetType: "User",
          targetId: current.id,
          adminId: current.id,
          before: JSON.stringify({ accountStatus: "ACTIVE" }),
          after: JSON.stringify({
            accountStatus: "DELETED",
            anonymized: true,
            removedWechatIdentities: wechatIdentities.count,
            removedVerificationRequests: verificationRequests.count,
            anonymizedRegistrations: registrations.count,
            unlinkedMergedUsers: mergedUsers.count,
          }),
        },
      });

      return { deleted: true as const };
    });

    return mpSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return mpError(MP_ERROR_CODES.PAYLOAD_TOO_LARGE, "请求体过大", 413);
    }
    if (error instanceof SyntaxError) {
      return mpError(MP_ERROR_CODES.INVALID_JSON, "JSON 格式无效", 400);
    }
    if (
      error instanceof Error &&
      error.message === "ADMIN_DELETION_FORBIDDEN"
    ) {
      return mpError(
        MP_ERROR_CODES.FORBIDDEN,
        "管理员账号不能自助注销，请先移交管理员权限",
        403,
      );
    }
    if (error instanceof Error && error.message === "ACCOUNT_UNAVAILABLE") {
      return mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "账号状态已变更，请重新登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      );
    }
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "账号注销失败，请稍后再试",
      500,
    );
  }
}
