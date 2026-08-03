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
    /^\/uploads\/[\p{L}\p{N}._-]+\.(?:avif|gif|jpe?g|png|webp)$/iu.test(value)
  );
}

export function isSafeInternalHref(value: string) {
  if (!value) return true;
  if (value.length > 254 || CONTROL_CHARS.test(value)) return false;
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes("..");
}

export function isSafeArticleSourceUrl(value: string) {
  if (!value) return true;
  if (value.length > 500 || CONTROL_CHARS.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "mp.weixin.qq.com" && url.pathname.startsWith("/s/");
  } catch {
    return false;
  }
}

