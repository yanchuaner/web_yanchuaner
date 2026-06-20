import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = 3;
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export type TokenRole = "user" | "admin";

export type TokenPayload = {
  v: 3;
  role: TokenRole;
  userId: string;
  sessionVersion: number;
  exp: number;
};

function secret() {
  const value = process.env.SESSION_SECRET || "";
  if (!value) throw new Error("SESSION_SECRET not configured");
  return value;
}

export function signToken(input: {
  role: TokenRole;
  userId: string;
  sessionVersion: number;
  exp?: number;
}): string {
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    role: input.role,
    userId: input.userId,
    sessionVersion: input.sessionVersion,
    exp: input.exp ?? Date.now() + TOKEN_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    const expected = createHmac("sha256", secret())
      .update(encoded)
      .digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<TokenPayload>;
    if (
      payload.v !== TOKEN_VERSION ||
      (payload.role !== "user" && payload.role !== "admin") ||
      typeof payload.userId !== "string" ||
      !payload.userId ||
      !Number.isInteger(payload.sessionVersion) ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
