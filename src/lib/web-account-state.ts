export type WebAccountState =
  | "ACTIVE"
  | "EMAIL_NOT_VERIFIED"
  | "REVIEW_PENDING"
  | "REVIEW_REJECTED"
  | "ACCOUNT_DISABLED";

type AccountStateUser = {
  accountStatus: string;
  emailVerified: Date | string | null;
  identityType?: string | null;
  role: string;
  status: string;
  verificationStatus: string;
};

const SUPPORTED_IDENTITY_TYPES = new Set(["ALUMNI", "STUDENT", "TEACHER"]);

export function resolveWebAccountState(user: AccountStateUser): WebAccountState {
  if (user.accountStatus !== "ACTIVE") return "ACCOUNT_DISABLED";
  if (!user.emailVerified) return "EMAIL_NOT_VERIFIED";
  if (user.role === "ADMIN") return "ACTIVE";

  if (user.status === "REJECTED" || user.verificationStatus === "REJECTED") {
    return "REVIEW_REJECTED";
  }

  if (
    user.status !== "VERIFIED" ||
    user.verificationStatus !== "VERIFIED" ||
    !SUPPORTED_IDENTITY_TYPES.has(user.identityType ?? "")
  ) {
    return "REVIEW_PENDING";
  }

  return "ACTIVE";
}
