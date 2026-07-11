export type WebAccountState =
  | "ACTIVE"
  | "EMAIL_NOT_VERIFIED"
  | "REVIEW_PENDING"
  | "REVIEW_REJECTED"
  | "ACCOUNT_DISABLED";

type AccountStateUser = {
  accountStatus: string;
  emailVerified: Date | string | null;
  role: string;
  status: string;
  verificationStatus: string;
};

export function resolveWebAccountState(user: AccountStateUser): WebAccountState {
  if (user.accountStatus !== "ACTIVE") return "ACCOUNT_DISABLED";
  if (!user.emailVerified) return "EMAIL_NOT_VERIFIED";
  if (user.role === "ADMIN") return "ACTIVE";

  if (user.status === "REJECTED" || user.verificationStatus === "REJECTED") {
    return "REVIEW_REJECTED";
  }

  if (
    user.role !== "ALUMNI" ||
    user.status !== "VERIFIED" ||
    user.verificationStatus !== "VERIFIED"
  ) {
    return "REVIEW_PENDING";
  }

  return "ACTIVE";
}
