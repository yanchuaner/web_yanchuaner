import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { readJsonBody } from "@/lib/auth-utils";
import {
  isAllowedMpDevMockUser,
  isMpDevMockLoginEnabled,
  issueMpAccessToken,
  toMpSessionUser,
} from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { getClientIp, authLimiter } from "@/lib/rate-limit";

type DevLoginBody = { userId?: unknown };

export async function POST(req: NextRequest) {
  if (!isMpDevMockLoginEnabled()) {
    return mpError(
      MP_ERROR_CODES.DEV_LOGIN_DISABLED,
      "开发模拟登录未启用",
      404,
    );
  }

  const limiterResult = await authLimiter.limit(
    `mp:dev-login:${getClientIp(req)}`,
  );
  if (!limiterResult.success) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "尝试过于频繁，请稍后再试",
      429,
      { headers: { "Retry-After": String(limiterResult.retryAfter) } },
    );
  }

  try {
    const body = await readJsonBody<DevLoginBody>(req, 4096);
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId || userId.length > 128) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        "userId 不能为空",
        400,
      );
    }
    if (!isAllowedMpDevMockUser(userId)) {
      return mpError(
        MP_ERROR_CODES.DEV_USER_NOT_ALLOWED,
        "该模拟用户未加入开发白名单",
        403,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        verificationStatus: true,
        identityType: true,
        accountStatus: true,
        sessionVersion: true,
      },
    });
    if (!user || user.accountStatus !== "ACTIVE") {
      return mpError(
        MP_ERROR_CODES.USER_UNAVAILABLE,
        "模拟用户不存在或不可用",
        404,
      );
    }

    return mpSuccess({
      ...issueMpAccessToken(user),
      user: toMpSessionUser(user),
    });
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
      "模拟登录失败，请稍后再试",
      500,
    );
  }
}
