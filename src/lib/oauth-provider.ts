import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign as signWithPrivateKey,
  timingSafeEqual,
} from "crypto";
import type { AuthenticatedUser } from "@/lib/admin-auth";
import getRedisClient from "@/lib/redis";

const AUTHORIZATION_CODE_TTL_SECONDS = 60;
const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
const MAX_OAUTH_FORM_BYTES = 8 * 1024;

export type OAuthProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type OAuthIdentity = {
  sub: string;
  preferred_username: string;
  name: string;
  email: string;
  email_verified: true;
  role: "admin" | "alumni" | "student" | "teacher";
};

type AuthorizationCodeRecord = {
  clientId: string;
  redirectUri: string;
  nonce?: string;
  codeChallenge?: string;
  identity: OAuthIdentity;
};

type OAuthAuthorizationRequest = {
  state: string;
  nonce?: string;
  codeChallenge?: string;
};

export type OAuthProviderMetadata = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  jwksUri: string;
};

export type OAuthPublicJwk = {
  kty: string;
  n: string;
  e: string;
  use: "sig";
  alg: "RS256";
  kid: string;
};

export class OAuthProviderUnavailableError extends Error {}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new OAuthProviderUnavailableError(`${name} is not configured`);
  return value;
}

function validateProviderConfig(config: OAuthProviderConfig): OAuthProviderConfig {
  const redirectUri = new URL(config.redirectUri);
  if (process.env.NODE_ENV === "production" && redirectUri.protocol !== "https:") {
    throw new OAuthProviderUnavailableError(
      "OAuth redirect URIs must use HTTPS in production",
    );
  }
  return config;
}

export function getOAuthProviderConfigs(): OAuthProviderConfig[] {
  const configs = [validateProviderConfig({
    clientId: requiredEnv("YANCHUANER_OAUTH_CLIENT_ID"),
    clientSecret: requiredEnv("YANCHUANER_OAUTH_CLIENT_SECRET"),
    redirectUri: requiredEnv("YANCHUANER_OAUTH_REDIRECT_URI"),
  })];
  const optionalClients = [
    {
      name: "YANCHUANER_AI_OAUTH",
      values: [
        process.env.YANCHUANER_AI_OAUTH_CLIENT_ID?.trim(),
        process.env.YANCHUANER_AI_OAUTH_CLIENT_SECRET?.trim(),
        process.env.YANCHUANER_AI_OAUTH_REDIRECT_URI?.trim(),
      ],
    },
    {
      name: "YANCHUANER_AI_WEB_OAUTH",
      values: [
        process.env.YANCHUANER_AI_WEB_OAUTH_CLIENT_ID?.trim(),
        process.env.YANCHUANER_AI_WEB_OAUTH_CLIENT_SECRET?.trim(),
        process.env.YANCHUANER_AI_WEB_OAUTH_REDIRECT_URI?.trim(),
      ],
    },
  ];
  for (const client of optionalClients) {
    if (!client.values.some(Boolean)) continue;
    if (!client.values.every(Boolean)) {
      throw new OAuthProviderUnavailableError(
        `${client.name} client configuration is incomplete`,
      );
    }
    configs.push(validateProviderConfig({
      clientId: client.values[0]!,
      clientSecret: client.values[1]!,
      redirectUri: client.values[2]!,
    }));
  }
  if (new Set(configs.map((config) => config.clientId)).size !== configs.length) {
    throw new OAuthProviderUnavailableError("OAuth client IDs must be unique");
  }
  if (new Set(configs.map((config) => config.clientSecret)).size !== configs.length) {
    throw new OAuthProviderUnavailableError("OAuth client secrets must be unique");
  }
  return configs;
}

export function getOAuthProviderConfig(clientId?: string): OAuthProviderConfig {
  const configs = getOAuthProviderConfigs();
  if (!clientId) return configs[0];
  const config = configs.find((candidate) => candidate.clientId === clientId);
  if (!config) throw new OAuthProviderUnavailableError("Unknown OAuth client");
  return config;
}

export function findOAuthProviderConfig(
  clientId: string,
): OAuthProviderConfig | null {
  return (
    getOAuthProviderConfigs().find((config) => config.clientId === clientId) ??
    null
  );
}

function normalizedBaseUrl(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new OAuthProviderUnavailableError(`${name} is not configured`);
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new OAuthProviderUnavailableError(`${name} must use HTTPS in production`);
  }
  return value.replace(/\/$/, "");
}

export function getOAuthProviderMetadata(): OAuthProviderMetadata {
  const issuer = normalizedBaseUrl("YANCHUANER_OAUTH_ISSUER");
  const internalBaseUrl = normalizedBaseUrl(
    "YANCHUANER_OAUTH_INTERNAL_URL",
    issuer,
  );
  return {
    issuer,
    authorizationEndpoint: `${issuer}/api/oauth/authorize`,
    tokenEndpoint: `${internalBaseUrl}/api/oauth/token`,
    userInfoEndpoint: `${internalBaseUrl}/api/oauth/userinfo`,
    jwksUri: `${internalBaseUrl}/api/oauth/jwks`,
  };
}

function hashOpaqueValue(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

function getOAuthSigningPrivateKey() {
  try {
    return createPrivateKey({
      key: Buffer.from(requiredEnv("YANCHUANER_OAUTH_SIGNING_KEY"), "base64"),
      format: "der",
      type: "pkcs8",
    });
  } catch {
    throw new OAuthProviderUnavailableError(
      "YANCHUANER_OAUTH_SIGNING_KEY is invalid",
    );
  }
}

export function getOAuthPublicJwk(): OAuthPublicJwk {
  const jwk = createPublicKey(getOAuthSigningPrivateKey()).export({
    format: "jwk",
  });
  if (!jwk.kty || !jwk.n || !jwk.e) {
    throw new OAuthProviderUnavailableError("OAuth signing public key is invalid");
  }
  const kid = createHash("sha256")
    .update(`${jwk.n}.${jwk.e}`)
    .digest("base64url")
    .slice(0, 16);
  return {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    use: "sig",
    alg: "RS256",
    kid,
  };
}

export function constantTimeSecretEqual(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function validateAuthorizationRequest(
  params: URLSearchParams,
  config: OAuthProviderConfig,
): OAuthAuthorizationRequest | null {
  const state = params.get("state") ?? "";
  const nonce = params.get("nonce") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const codeChallengeMethod = params.get("code_challenge_method") ?? "";
  const requestedScopes = (params.get("scope") ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (
    params.get("response_type") !== "code" ||
    params.get("client_id") !== config.clientId ||
    params.get("redirect_uri") !== config.redirectUri ||
    !state ||
    state.length > 512 ||
    nonce.length > 512 ||
    (codeChallenge !== "" &&
      (codeChallengeMethod !== "S256" ||
        !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge))) ||
    (codeChallenge === "" && codeChallengeMethod !== "") ||
    requestedScopes.some(
      (scope) => !["openid", "profile", "email"].includes(scope),
    )
  ) {
    return null;
  }
  return {
    state,
    ...(nonce ? { nonce } : {}),
    ...(codeChallenge ? { codeChallenge } : {}),
  };
}

export function validatePkceCodeVerifier(
  codeChallenge: string | undefined,
  codeVerifier: string,
): boolean {
  if (!codeChallenge) return true;
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) return false;
  const actualChallenge = createHash("sha256")
    .update(codeVerifier, "ascii")
    .digest("base64url");
  return constantTimeSecretEqual(actualChallenge, codeChallenge);
}

export function isOAuthEligibleUser(user: AuthenticatedUser): boolean {
  const supportedIdentity =
    user.identityType === "ALUMNI" ||
    user.identityType === "STUDENT" ||
    user.identityType === "TEACHER";
  return (
    user.role === "ADMIN" ||
    (supportedIdentity &&
      user.accountStatus === "ACTIVE" &&
      Boolean(user.emailVerified) &&
      user.status === "VERIFIED" &&
      user.verificationStatus === "VERIFIED")
  );
}

function oauthRoleForUser(user: AuthenticatedUser): OAuthIdentity["role"] {
  if (user.role === "ADMIN") return "admin";
  if (user.identityType === "STUDENT") return "student";
  if (user.identityType === "TEACHER") return "teacher";
  return "alumni";
}

function toOAuthIdentity(user: AuthenticatedUser): OAuthIdentity {
  if (!user.email || !user.emailVerified) {
    throw new OAuthProviderUnavailableError("Verified email is required");
  }
  const username =
    user.username || user.email.split("@")[0] || `alumni-${user.id.slice(0, 8)}`;
  return {
    sub: user.id,
    preferred_username: username,
    name: user.name || username,
    email: user.email,
    email_verified: true,
    role: oauthRoleForUser(user),
  };
}

function redisOrThrow() {
  const redis = getRedisClient();
  if (!redis) {
    throw new OAuthProviderUnavailableError(
      "REDIS_URL is required for OAuth authorization codes",
    );
  }
  return redis;
}

export async function issueAuthorizationCode(
  user: AuthenticatedUser,
  config: OAuthProviderConfig,
  nonce?: string,
  codeChallenge?: string,
): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  const record: AuthorizationCodeRecord = {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    nonce,
    codeChallenge,
    identity: toOAuthIdentity(user),
  };
  const stored = await redisOrThrow().set(
    `oauth:code:${hashOpaqueValue(code)}`,
    JSON.stringify(record),
    "EX",
    AUTHORIZATION_CODE_TTL_SECONDS,
    "NX",
  );
  if (stored !== "OK") {
    throw new OAuthProviderUnavailableError("Unable to issue authorization code");
  }
  return code;
}

export async function consumeAuthorizationCode(
  code: string,
): Promise<AuthorizationCodeRecord | null> {
  if (!code || code.length > 256) return null;
  const value = await redisOrThrow().getdel(
    `oauth:code:${hashOpaqueValue(code)}`,
  );
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthorizationCodeRecord;
  } catch {
    return null;
  }
}

export async function issueOAuthAccessToken(
  identity: OAuthIdentity,
): Promise<{ accessToken: string; expiresIn: number }> {
  const accessToken = randomBytes(32).toString("base64url");
  const stored = await redisOrThrow().set(
    `oauth:access:${hashOpaqueValue(accessToken)}`,
    JSON.stringify(identity),
    "EX",
    ACCESS_TOKEN_TTL_SECONDS,
    "NX",
  );
  if (stored !== "OK") {
    throw new OAuthProviderUnavailableError("Unable to issue access token");
  }
  return { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export function issueOAuthIdToken(
  identity: OAuthIdentity,
  config: OAuthProviderConfig,
  nonce?: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const metadata = getOAuthProviderMetadata();
  const signingKey = getOAuthSigningPrivateKey();
  const publicJwk = getOAuthPublicJwk();
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: publicJwk.kid }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: metadata.issuer,
      aud: config.clientId,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
      ...(nonce ? { nonce } : {}),
      ...identity,
    }),
  ).toString("base64url");
  const signature = signWithPrivateKey(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    signingKey,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

export async function resolveOAuthAccessToken(
  accessToken: string,
): Promise<OAuthIdentity | null> {
  if (!accessToken || accessToken.length > 256) return null;
  const value = await redisOrThrow().get(
    `oauth:access:${hashOpaqueValue(accessToken)}`,
  );
  if (!value) return null;
  try {
    return JSON.parse(value) as OAuthIdentity;
  } catch {
    return null;
  }
}

export async function readOAuthForm(req: Request): Promise<URLSearchParams> {
  const contentType = req.headers.get("content-type")?.split(";", 1)[0];
  if (contentType !== "application/x-www-form-urlencoded") {
    throw new TypeError("Unsupported content type");
  }
  const reader = req.body?.getReader();
  if (!reader) return new URLSearchParams();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    byteLength += result.value.byteLength;
    if (byteLength > MAX_OAUTH_FORM_BYTES) {
      await reader.cancel();
      throw new RangeError("OAuth form is too large");
    }
    chunks.push(result.value);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return new URLSearchParams(body);
}

export function readOAuthClientCredentials(
  req: Request,
  form: URLSearchParams,
): { clientId: string; clientSecret: string } {
  const authorization = req.headers.get("authorization") ?? "";
  if (authorization.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authorization.slice(6), "base64").toString(
        "utf8",
      );
      const separator = decoded.indexOf(":");
      if (separator >= 0) {
        return {
          clientId: decoded.slice(0, separator),
          clientSecret: decoded.slice(separator + 1),
        };
      }
    } catch {
      return { clientId: "", clientSecret: "" };
    }
  }
  return {
    clientId: form.get("client_id") ?? "",
    clientSecret: form.get("client_secret") ?? "",
  };
}
