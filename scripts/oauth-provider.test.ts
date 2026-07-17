import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import type { AuthenticatedUser } from "../src/lib/admin-auth";
import {
  constantTimeSecretEqual,
  issueOAuthIdToken,
  isOAuthEligibleUser,
  validateAuthorizationRequest,
  type OAuthProviderConfig,
} from "../src/lib/oauth-provider";

const config: OAuthProviderConfig = {
  clientId: "api-yanchuaner",
  clientSecret: "test-secret",
  redirectUri: "https://api.yanchuaner.cn/oauth/yanchuaner",
};

process.env.YANCHUANER_OAUTH_ISSUER = "https://yanchuaner.cn";
process.env.YANCHUANER_OAUTH_SIGNING_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
}).privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");

const user: AuthenticatedUser = {
  id: "user-1",
  username: "alumni",
  email: "alumni@example.com",
  emailVerified: new Date(),
  name: "Alumni",
  graduationClass: null,
  className: null,
  verificationStatus: "VERIFIED",
  identityType: "ALUMNI",
  role: "ALUMNI",
  status: "VERIFIED",
  accountStatus: "ACTIVE",
  sessionVersion: 0,
};

test("authorization request requires exact client, redirect, response type and state", () => {
  const valid = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: "state-1",
  });
  assert.deepEqual(validateAuthorizationRequest(valid, config), {
    state: "state-1",
  });

  const withNonce = new URLSearchParams(valid);
  withNonce.set("scope", "openid profile email");
  withNonce.set("nonce", "nonce-1");
  assert.deepEqual(validateAuthorizationRequest(withNonce, config), {
    state: "state-1",
    nonce: "nonce-1",
  });

  for (const field of ["response_type", "client_id", "redirect_uri"]) {
    const invalid = new URLSearchParams(valid);
    invalid.set(field, "wrong");
    assert.equal(validateAuthorizationRequest(invalid, config), null);
  }

  const missingState = new URLSearchParams(valid);
  missingState.delete("state");
  assert.equal(validateAuthorizationRequest(missingState, config), null);

  const oversizedState = new URLSearchParams(valid);
  oversizedState.set("state", "x".repeat(513));
  assert.equal(validateAuthorizationRequest(oversizedState, config), null);
});

test("OIDC ID token is audience-bound and carries the authorization nonce", () => {
  const identity = {
    sub: "user-1",
    preferred_username: "alumni",
    name: "Alumni",
    email: "alumni@example.com",
    email_verified: true as const,
    role: "alumni" as const,
  };
  const token = issueOAuthIdToken(identity, config, "nonce-1");
  const [encodedHeader, encodedPayload] = token.split(".");
  const header = JSON.parse(
    Buffer.from(encodedHeader, "base64url").toString("utf8"),
  );
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  );
  assert.equal(payload.iss, "https://yanchuaner.cn");
  assert.equal(header.alg, "RS256");
  assert.ok(header.kid);
  assert.equal(payload.aud, config.clientId);
  assert.equal(payload.nonce, "nonce-1");
  assert.equal(payload.sub, identity.sub);
});

test("only verified school members and administrators are OAuth eligible", () => {
  assert.equal(isOAuthEligibleUser(user), true);
  assert.equal(isOAuthEligibleUser({ ...user, role: "ADMIN" }), true);
  assert.equal(
    isOAuthEligibleUser({ ...user, role: "GUEST", identityType: "STUDENT" }),
    true,
  );
  assert.equal(
    isOAuthEligibleUser({ ...user, role: "GUEST", identityType: "TEACHER" }),
    true,
  );
  assert.equal(isOAuthEligibleUser({ ...user, status: "PENDING" }), false);
  assert.equal(
    isOAuthEligibleUser({ ...user, role: "GUEST", identityType: null }),
    false,
  );
});

test("client secrets are compared by value without length-dependent branching", () => {
  assert.equal(constantTimeSecretEqual("same", "same"), true);
  assert.equal(constantTimeSecretEqual("short", "a-different-value"), false);
});
