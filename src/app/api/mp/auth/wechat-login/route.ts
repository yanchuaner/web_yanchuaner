import { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/auth-utils";
import { issueMpAccessToken, toMpSessionUser } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { getClientIp, authLimiter } from "@/lib/rate-limit";
import {
  exchangeWechatLoginCode,
  getWechatMiniProgramConfig,
  parseWechatLoginCode,
  resolveWechatLoginUser,
} from "@/lib/wechat-login";

type WechatLoginBody = { code?: unknown };

export async function POST(req: NextRequest) {
  const limiterResult = await authLimiter.limit(
    `mp:wechat-login:${getClientIp(req)}`,
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
    const body = await readJsonBody<WechatLoginBody>(req, 4096);
    const code = parseWechatLoginCode(body.code);
    if (!code) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        "微信登录 code 格式无效",
        400,
      );
    }

    const config = getWechatMiniProgramConfig();
    if (!config) {
      return mpError(
        MP_ERROR_CODES.WECHAT_NOT_CONFIGURED,
        "微信登录暂不可用",
        503,
      );
    }

    const session = await exchangeWechatLoginCode(code, config);
    if (!session.ok) {
      if (session.reason === "REJECTED") {
        return mpError(
          MP_ERROR_CODES.WECHAT_LOGIN_FAILED,
          "微信登录凭证无效或已使用",
          401,
        );
      }
      return mpError(
        MP_ERROR_CODES.WECHAT_UPSTREAM_ERROR,
        "微信登录服务暂不可用，请稍后再试",
        502,
      );
    }

    const user = await resolveWechatLoginUser({
      appId: config.appId,
      openid: session.openid,
      unionid: session.unionid,
    });
    if (user.accountStatus !== "ACTIVE") {
      return mpError(
        MP_ERROR_CODES.USER_UNAVAILABLE,
        "账号已停用或注销",
        403,
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
      "微信登录失败，请稍后再试",
      500,
    );
  }
}
