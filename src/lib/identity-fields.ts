export const USERNAME_PATTERN = /^[\p{Script=Han}a-z0-9_-]{1,32}$/u;
export const USERNAME_INPUT_PATTERN = "[\\u4E00-\\u9FFFA-Za-z0-9_-]{1,32}";
export const GRADUATION_CLASS_PATTERN = /^20\d{2}$/;
export const CLASS_NAME_PATTERN = /^[1-9]\d?$/;

export function normalizeUsername(value: unknown) {
  return typeof value === "string"
    ? value.trim().normalize("NFC").toLowerCase()
    : "";
}

export function normalizeGraduationClass(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().normalize("NFC");
  const match = normalized.match(/^(20\d{2})届?$/);
  return match ? match[1] : normalized;
}

export function normalizeClassName(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().normalize("NFC");
  const match = normalized.match(/^(\d{1,2})(?:班)?$/);
  return match ? match[1] : normalized;
}

export function validGraduationClass(value: string) {
  if (!GRADUATION_CLASS_PATTERN.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2025;
}

export function validClassName(value: string) {
  return CLASS_NAME_PATTERN.test(value);
}

export function formatGraduationClass(value: unknown) {
  const normalized = normalizeGraduationClass(value);
  return validGraduationClass(normalized) ? `${normalized}届` : normalized;
}

export function formatClassName(value: unknown) {
  const normalized = normalizeClassName(value);
  return validClassName(normalized) ? `${normalized}班` : normalized;
}
