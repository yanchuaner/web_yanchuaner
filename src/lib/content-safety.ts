const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function normalizeOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isSafeLocalImagePath(value: string) {
  if (!value) return true;
  if (value.length > 254 || CONTROL_CHARS.test(value)) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("..")) return false;
  return (
    value === "/card.jpg" ||
    /^\/uploads\/[A-Za-z0-9._-]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(value)
  );
}

