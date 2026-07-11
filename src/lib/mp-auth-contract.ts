import type { AuthenticatedUser } from "@/lib/admin-auth";

type MpSessionUserSource = Pick<
  AuthenticatedUser,
  "id" | "name" | "role" | "verificationStatus" | "identityType"
>;

export const MP_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export type MpAccountState =
  | "LOGGED_IN"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type MpAccessRole = "USER" | "ADMIN";

export type MpIdentityType = "ALUMNI" | "STUDENT" | "TEACHER";

export type MpSessionUser = {
  id: string;
  name: string | null;
  accountState: MpAccountState;
  accessRole: MpAccessRole;
  identityType: MpIdentityType | null;
};

export type BearerTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: "MISSING" | "MALFORMED" };

type MpAuthEnvironment = {
  NODE_ENV?: string;
  MP_DEV_MOCK_LOGIN_ENABLED?: string;
  MP_DEV_MOCK_USER_IDS?: string;
};

const BEARER_TOKEN_PATTERN = /^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;
const MAX_AUTHORIZATION_HEADER_LENGTH = 1024;

export function extractBearerToken(req: Request): BearerTokenResult {
  const authorization = req.headers.get("authorization");
  if (!authorization) return { ok: false, reason: "MISSING" };
  if (authorization.length > MAX_AUTHORIZATION_HEADER_LENGTH) {
    return { ok: false, reason: "MALFORMED" };
  }
  const match = BEARER_TOKEN_PATTERN.exec(authorization.trim());
  if (!match) return { ok: false, reason: "MALFORMED" };
  return { ok: true, token: match[1] };
}

export function isMpDevMockLoginEnabled(
  env: MpAuthEnvironment = process.env,
) {
  return (
    env.NODE_ENV !== "production" &&
    env.MP_DEV_MOCK_LOGIN_ENABLED === "true"
  );
}

export function isAllowedMpDevMockUser(
  userId: string,
  env: MpAuthEnvironment = process.env,
) {
  const allowedIds = (env.MP_DEV_MOCK_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowedIds.includes(userId);
}

export function toMpSessionUser(user: MpSessionUserSource): MpSessionUser {
  let accountState: MpAccountState = "LOGGED_IN";
  if (user.verificationStatus === "VERIFIED") {
    accountState = "VERIFIED";
  } else if (user.verificationStatus === "PENDING") {
    accountState = "PENDING";
  } else if (user.verificationStatus === "REJECTED") {
    accountState = "REJECTED";
  }

  return {
    id: user.id,
    name: user.name,
    accountState,
    accessRole: user.role === "ADMIN" ? "ADMIN" : "USER",
    identityType:
      user.identityType === "ALUMNI" ||
      user.identityType === "STUDENT" ||
      user.identityType === "TEACHER"
        ? user.identityType
        : null,
  };
}
