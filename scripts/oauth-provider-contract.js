#!/usr/bin/env node

const {
  createHash,
  createHmac,
  createPublicKey,
  randomBytes,
  verify,
} = require("node:crypto");

const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const allowRemote = process.env.YANCHUANER_OAUTH_CONTRACT_ALLOW_REMOTE === "true";
const allowTest = process.env.YANCHUANER_OAUTH_CONTRACT_ALLOW_TEST === "true";
const baseUrl = normalizeUrl(
  process.env.YANCHUANER_OAUTH_CONTRACT_BASE_URL || "http://127.0.0.1:3191",
  "YANCHUANER_OAUTH_CONTRACT_BASE_URL",
);
const clientId = requiredEnv("YANCHUANER_OAUTH_CLIENT_ID");
const clientSecret = requiredEnv("YANCHUANER_OAUTH_CLIENT_SECRET");
const redirectUri = requiredEnv("YANCHUANER_OAUTH_REDIRECT_URI");
const sessionSecret = requiredEnv("SESSION_SECRET");

let passed = 0;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeUrl(value, name) {
  const url = new URL(value);
  if (!allowRemote && !allowedHosts.has(url.hostname)) {
    throw new Error(`${name} only targets localhost unless YANCHUANER_OAUTH_CONTRACT_ALLOW_REMOTE=true`);
  }
  return url.toString().replace(/\/$/, "");
}

function check(condition, message, detail = "") {
  if (!condition) throw new Error(`${message}${detail ? `: ${detail}` : ""}`);
  passed += 1;
  console.log(`PASS ${message}`);
}

function contractUrl(pathname, params) {
  const url = new URL(pathname, `${baseUrl}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }
  return url;
}

async function request(pathname, options = {}) {
  return fetch(contractUrl(pathname), { redirect: "manual", ...options });
}

async function json(response) {
  return response.json().catch(() => null);
}

function cookieFromResponse(response) {
  return response.headers.get("set-cookie")?.split(";", 1)[0] || "";
}

function sessionCookie(userId) {
  const encoded = Buffer.from(JSON.stringify({
    v: 3,
    role: "user",
    userId,
    sessionVersion: 0,
    exp: Date.now() + 60_000,
  })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret)
    .update(encoded)
    .digest("base64url");
  return `yc_access_token=${encoded}.${signature}`;
}

function pkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  return {
    verifier,
    challenge: createHash("sha256").update(verifier, "ascii").digest("base64url"),
  };
}

function parseAuthorizationCallback(response, expectedState) {
  const location = response.headers.get("location");
  check(response.status === 307, "authorization redirects to the registered callback", `${response.status}`);
  check(Boolean(location), "authorization callback has a location");
  const callback = new URL(location);
  check(callback.origin + callback.pathname === new URL(redirectUri).origin + new URL(redirectUri).pathname, "authorization callback target is exact");
  check(callback.searchParams.get("state") === expectedState, "authorization callback preserves state");
  const code = callback.searchParams.get("code");
  check(Boolean(code), "authorization callback contains a code");
  return code;
}

async function requestAuthorization(cookie, state, pair) {
  const url = contractUrl("/api/oauth/authorize", {
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
    nonce: "oauth-contract-nonce",
    code_challenge: pair.challenge,
    code_challenge_method: "S256",
  });
  return fetch(url, { headers: { Cookie: cookie }, redirect: "manual" });
}

async function exchange(code, verifier) {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: verifier,
  });
  return fetch(contractUrl("/api/oauth/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
}

async function main() {
  if (!allowTest || process.env.NODE_ENV === "production") {
    throw new Error("OAuth contract testing requires YANCHUANER_OAUTH_CONTRACT_ALLOW_TEST=true outside production");
  }

  const discoveryResponse = await request("/api/oauth/.well-known/openid-configuration");
  const discovery = await json(discoveryResponse);
  check(discoveryResponse.ok, "OIDC discovery is available", `${discoveryResponse.status}`);
  check(discovery?.issuer === baseUrl, "OIDC issuer matches the public test origin");
  check(discovery?.authorization_endpoint === `${baseUrl}/api/oauth/authorize`, "OIDC authorization endpoint is public");
  check(discovery?.token_endpoint === `${baseUrl}/api/oauth/token`, "OIDC token endpoint is reachable in the local contract");
  check(discovery?.userinfo_endpoint === `${baseUrl}/api/oauth/userinfo`, "OIDC UserInfo endpoint is reachable in the local contract");
  check(Array.isArray(discovery?.id_token_signing_alg_values_supported) && discovery.id_token_signing_alg_values_supported.length === 1 && discovery.id_token_signing_alg_values_supported[0] === "RS256", "OIDC discovery only advertises RS256 support");

  const anonymous = await requestAuthorization("", "anonymous-state", pkcePair());
  check(anonymous.status === 307, "anonymous authorization redirects to main-site login", `${anonymous.status}`);
  const anonymousLocation = anonymous.headers.get("location");
  check(Boolean(anonymousLocation), "anonymous authorization has a login location");
  check(new URL(anonymousLocation).pathname === "/login", "anonymous redirect targets main-site login");

  const invalidRedirectUrl = contractUrl("/api/oauth/authorize", {
    response_type: "code",
    client_id: clientId,
    redirect_uri: "http://127.0.0.1:3999/not-registered",
    state: "invalid-redirect",
  });
  const invalidRedirectResponse = await fetch(invalidRedirectUrl, { redirect: "manual" });
  check(invalidRedirectResponse.status === 400, "unregistered redirect URI is rejected", `${invalidRedirectResponse.status}`);

  const invalidClientForm = new URLSearchParams({
    grant_type: "authorization_code",
    code: "invalid-contract-code",
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: `${clientSecret}-wrong`,
  });
  const invalidClientResponse = await fetch(contractUrl("/api/oauth/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: invalidClientForm,
  });
  check(invalidClientResponse.status === 401 && (await json(invalidClientResponse))?.error === "invalid_client", "invalid client secret is rejected");

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({
      username: "acceptance-alumni",
      password: "AcceptancePass!2026",
    }),
  });
  const alumniCookie = cookieFromResponse(login);
  check(login.ok && alumniCookie.startsWith("yc_access_token="), "verified alumni can create a main-site session", `${login.status}`);

  const ineligible = await requestAuthorization(
    sessionCookie("acceptance-pending-web"),
    "pending-state",
    pkcePair(),
  );
  const ineligibleLocation = new URL(ineligible.headers.get("location"));
  check(ineligible.status === 307, "ineligible authenticated account reaches the callback", `${ineligible.status}`);
  check(ineligibleLocation.searchParams.get("state") === "pending-state", "ineligible callback preserves state");
  check(ineligibleLocation.searchParams.get("error") === "access_denied", "ineligible account receives access_denied");
  check(!ineligibleLocation.searchParams.get("code"), "ineligible account never receives an authorization code");

  const pair = pkcePair();
  const authorization = await requestAuthorization(alumniCookie, "verified-state", pair);
  const code = parseAuthorizationCallback(authorization, "verified-state");
  const tokenResponse = await exchange(code, pair.verifier);
  const token = await json(tokenResponse);
  check(tokenResponse.ok, "PKCE authorization code exchanges once", `${tokenResponse.status}`);
  check(tokenResponse.headers.get("cache-control")?.includes("no-store"), "token response is not cacheable");
  check(typeof token?.access_token === "string" && token.access_token.length >= 32, "token response contains an opaque access token");
  check(typeof token?.id_token === "string" && token.id_token.split(".").length === 3, "token response contains an ID token");

  const jwksResponse = await request("/api/oauth/jwks");
  const jwks = await json(jwksResponse);
  check(jwksResponse.ok && Array.isArray(jwks?.keys), "JWKS is available", `${jwksResponse.status}`);
  const [encodedHeader, encodedPayload, encodedSignature] = token.id_token.split(".");
  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  const jwk = jwks.keys.find((candidate) => candidate.kid === header.kid);
  check(header.alg === "RS256" && typeof header.kid === "string", "ID token is tagged as RS256 with a key ID");
  check(Boolean(jwk), "ID token key ID is published by JWKS");
  check(!["d", "p", "q", "dp", "dq", "qi", "oth"].some((field) => Object.hasOwn(jwk, field)), "JWKS does not publish private key material");
  check(verify("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedPayload}`), createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(encodedSignature, "base64url")), "ID token signature verifies against JWKS");
  check(payload.iss === baseUrl && payload.aud === clientId, "ID token issuer and audience are bound");
  check(payload.nonce === "oauth-contract-nonce", "ID token preserves the authorization nonce");
  check(payload.sub === "acceptance-verified" && payload.role === "alumni", "ID token contains the verified alumni identity");

  const userInfoResponse = await request("/api/oauth/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const userInfo = await json(userInfoResponse);
  check(userInfoResponse.ok, "access token resolves at UserInfo", `${userInfoResponse.status}`);
  check(userInfoResponse.headers.get("cache-control")?.includes("no-store"), "UserInfo response is not cacheable");
  check(userInfo?.sub === "acceptance-verified" && userInfo?.role === "alumni", "UserInfo returns the same authorized identity");

  const invalidToken = await request("/api/oauth/userinfo", {
    headers: { Authorization: "Bearer invalid-token" },
  });
  check(invalidToken.status === 401, "invalid access token is rejected", `${invalidToken.status}`);

  const replay = await exchange(code, pair.verifier);
  check(replay.status === 400 && (await json(replay))?.error === "invalid_grant", "authorization code replay is rejected");

  const failedPair = pkcePair();
  const failedAuthorization = await requestAuthorization(alumniCookie, "failed-pkce", failedPair);
  const failedCode = parseAuthorizationCallback(failedAuthorization, "failed-pkce");
  const invalidVerifier = await exchange(failedCode, `${failedPair.verifier.slice(0, -1)}x`);
  check(invalidVerifier.status === 400 && (await json(invalidVerifier))?.error === "invalid_grant", "invalid PKCE verifier is rejected");
  const consumedAfterInvalidVerifier = await exchange(failedCode, failedPair.verifier);
  check(consumedAfterInvalidVerifier.status === 400 && (await json(consumedAfterInvalidVerifier))?.error === "invalid_grant", "invalid PKCE verifier consumes the code");

  console.log(`OAuth provider contract completed: ${passed} checks passed`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
