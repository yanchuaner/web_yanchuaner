import type { NextRequest } from "next/server";
import {
  type AuthenticatedUser,
  resolveAuthenticatedUser,
} from "@/lib/admin-auth";
import {
  extractBearerToken,
  MP_TOKEN_TTL_SECONDS,
} from "@/lib/mp-auth-contract";
import { MP_ERROR_CODES, mpError } from "@/lib/mp-api";
import {
  signToken,
  type TokenPayload,
  verifyToken,
} from "@/lib/verify-token";

export {
  extractBearerToken,
  isAllowedMpDevMockUser,
  isMpDevMockLoginEnabled,
  MP_TOKEN_TTL_SECONDS,
  toMpSessionUser,
} from "@/lib/mp-auth-contract";
export type {
  BearerTokenResult,
  MpAccessRole,
  MpAccountState,
  MpIdentityType,
  MpSessionUser,
} from "@/lib/mp-auth-contract";

export type MpAuthenticatedRequest = {
  user: AuthenticatedUser;
  payload: TokenPayload;
};

export function issueMpAccessToken(
  user: Pick<AuthenticatedUser, "id" | "role" | "sessionVersion">,
) {
  const expiresAt = Date.now() + MP_TOKEN_TTL_SECONDS * 1000;
  return {
    accessToken: signToken({
      role: user.role === "ADMIN" ? "admin" : "user",
      userId: user.id,
      sessionVersion: user.sessionVersion,
      exp: expiresAt,
    }),
    tokenType: "Bearer" as const,
    expiresIn: MP_TOKEN_TTL_SECONDS,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function authenticateMpRequest(
  req: NextRequest,
): Promise<
  | { ok: true; auth: MpAuthenticatedRequest }
  | { ok: false; response: Response }
> {
  const bearer = extractBearerToken(req);
  if (!bearer.ok) {
    const malformed = bearer.reason === "MALFORMED";
    return {
      ok: false,
      response: mpError(
        malformed
          ? MP_ERROR_CODES.AUTH_HEADER_INVALID
          : MP_ERROR_CODES.AUTH_REQUIRED,
        malformed ? "Authorization 请求头格式无效" : "需要登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      ),
    };
  }

  const payload = verifyToken(bearer.token);
  if (!payload) {
    return {
      ok: false,
      response: mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "登录状态已失效，请重新登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      ),
    };
  }

  const user = await resolveAuthenticatedUser(payload, {
    requireVerifiedEmail: false,
  });
  if (!user) {
    return {
      ok: false,
      response: mpError(
        MP_ERROR_CODES.TOKEN_INVALID,
        "登录状态已失效，请重新登录",
        401,
        { headers: { "WWW-Authenticate": "Bearer" } },
      ),
    };
  }

  return { ok: true, auth: { user, payload } };
}
