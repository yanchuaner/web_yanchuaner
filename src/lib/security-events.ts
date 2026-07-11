import { createHash } from "node:crypto";

export function logRateLimitDenied(input: {
  key: string;
  retryAfter: number;
  backend: "redis" | "memory";
}) {
  const category = input.key.split(":", 1)[0] || "unknown";
  const keyHash = createHash("sha256")
    .update(input.key)
    .digest("hex")
    .slice(0, 16);
  console.warn(
    "[security] rate_limit_denied",
    JSON.stringify({
      category,
      keyHash,
      retryAfter: input.retryAfter,
      backend: input.backend,
      timestamp: new Date().toISOString(),
    }),
  );
}
