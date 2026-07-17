import { compare, hash } from "bcryptjs";
import { BCRYPT_COST } from "@/lib/auth-utils";

export const REGISTRATION_POLICY_ID = "default";
export const ACCESS_CODE_MIN_LENGTH = 8;
export const ACCESS_CODE_MAX_LENGTH = 64;
export const ACCESS_CODE_HINT_MAX_LENGTH = 120;

export type RegistrationPolicyState = {
  accessCodeEnabled: boolean;
  accessCodeHash: string | null;
  accessCodeHint: string;
};

export function normalizeAccessCode(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validAccessCode(value: string) {
  return (
    value.length >= ACCESS_CODE_MIN_LENGTH &&
    value.length <= ACCESS_CODE_MAX_LENGTH
  );
}

export async function hashAccessCode(value: string) {
  if (!validAccessCode(value)) throw new Error("INVALID_ACCESS_CODE");
  return hash(value, BCRYPT_COST);
}

export async function verifyRegistrationAccessCode(
  value: unknown,
  policy: RegistrationPolicyState | null,
) {
  const accessCode = normalizeAccessCode(value);
  if (
    !policy?.accessCodeEnabled ||
    !policy.accessCodeHash ||
    !validAccessCode(accessCode)
  ) {
    return false;
  }
  return compare(accessCode, policy.accessCodeHash);
}

export function publicRegistrationPolicy(
  policy: RegistrationPolicyState | null,
) {
  return {
    accessCodeEnabled: Boolean(
      policy?.accessCodeEnabled && policy.accessCodeHash,
    ),
    accessCodeHint: policy?.accessCodeHint || "",
  };
}
