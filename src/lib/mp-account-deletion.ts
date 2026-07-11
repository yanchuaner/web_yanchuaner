export type MpAccountDeletionParseResult =
  | { ok: true }
  | { ok: false; message: string };

export function parseMpAccountDeletionConfirmation(
  input: unknown,
): MpAccountDeletionParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "注销确认格式无效" };
  }
  const body = input as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || body.confirm !== true) {
    return { ok: false, message: "请明确确认注销账号" };
  }
  return { ok: true };
}

export function buildDeletedUserData() {
  return {
    username: null,
    passwordHash: null,
    email: null,
    emailVerified: null,
    emailVerifyTokenHash: null,
    emailVerifyExpiresAt: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    name: null,
    contact: null,
    identityCode: null,
    graduationClass: null,
    className: null,
    city: null,
    university: null,
    major: null,
    industry: null,
    verificationStatus: "NOT_SUBMITTED" as const,
    identityType: null,
    teacherPosition: null,
    contactVisibility: "PRIVATE" as const,
    role: "GUEST",
    status: "DELETED",
    accountStatus: "DELETED",
    sessionVersion: { increment: 1 },
    claimedAt: null,
    mergedIntoUserId: null,
  };
}

export function buildDeletedRegistrationData() {
  return {
    userId: null,
    name: "已注销用户",
    contact: null,
    message: null,
  };
}
