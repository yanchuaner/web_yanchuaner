import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { parseEventRegistrationInput } from "../src/lib/event-registration";
import {
  buildDeletedRegistrationData,
  buildDeletedUserData,
  parseMpAccountDeletionConfirmation,
} from "../src/lib/mp-account-deletion";
import {
  type AuthenticatedUser,
  tokenMatchesUser,
} from "../src/lib/admin-auth";
import {
  extractBearerToken,
  isAllowedMpDevMockUser,
  isMpDevMockLoginEnabled,
  toMpSessionUser,
} from "../src/lib/mp-auth-contract";
import { parseMpProfilePatch } from "../src/lib/mp-profile";
import {
  parseMpPagination,
  toMpPagination,
} from "../src/lib/mp-pagination";
import {
  classifyMpVerificationMatch,
  parseMpVerificationSubmission,
} from "../src/lib/mp-verification";
import { signToken } from "../src/lib/verify-token";
import {
  getWechatMiniProgramConfig,
  parseWechatCode2SessionResponse,
  parseWechatLoginCode,
} from "../src/lib/wechat-login";

process.env.SESSION_SECRET = "mp-auth-contract-test-secret";

test("extractBearerToken accepts a single case-insensitive Bearer token", () => {
  const req = new Request("https://example.test/api/mp/auth/me", {
    headers: { authorization: "bearer abc.def" },
  });
  assert.deepEqual(extractBearerToken(req), { ok: true, token: "abc.def" });
});

test("extractBearerToken rejects missing and malformed credentials", () => {
  assert.deepEqual(
    extractBearerToken(new Request("https://example.test/api/mp/auth/me")),
    { ok: false, reason: "MISSING" },
  );
  const basic = new Request("https://example.test/api/mp/auth/me", {
    headers: { authorization: "Basic abc.def" },
  });
  assert.deepEqual(extractBearerToken(basic), {
    ok: false,
    reason: "MALFORMED",
  });
  const oversized = new Request("https://example.test/api/mp/auth/me", {
    headers: { authorization: `Bearer ${"a".repeat(1024)}.signature` },
  });
  assert.deepEqual(extractBearerToken(oversized), {
    ok: false,
    reason: "MALFORMED",
  });
});

test("production always disables mock login", () => {
  assert.equal(
    isMpDevMockLoginEnabled({
      NODE_ENV: "production",
      MP_DEV_MOCK_LOGIN_ENABLED: "true",
    }),
    false,
  );
  assert.equal(
    isMpDevMockLoginEnabled({
      NODE_ENV: "development",
      MP_DEV_MOCK_LOGIN_ENABLED: "true",
    }),
    true,
  );
});

test("mock users must be explicitly allowlisted", () => {
  const env = { MP_DEV_MOCK_USER_IDS: "user-a, user-b" };
  assert.equal(isAllowedMpDevMockUser("user-b", env), true);
  assert.equal(isAllowedMpDevMockUser("user-c", env), false);
});

test("wechat login configuration and upstream response are strictly parsed", () => {
  assert.equal(getWechatMiniProgramConfig({}), null);
  assert.deepEqual(
    getWechatMiniProgramConfig({
      WECHAT_MINIPROGRAM_APP_ID: " app-id ",
      WECHAT_MINIPROGRAM_APP_SECRET: " secret ",
    }),
    { appId: "app-id", appSecret: "secret" },
  );
  assert.equal(parseWechatLoginCode(" valid_code-1 "), "valid_code-1");
  assert.equal(parseWechatLoginCode("invalid code"), null);
  assert.deepEqual(
    parseWechatCode2SessionResponse({
      openid: "openid-test",
      unionid: "unionid-test",
      session_key: "must-not-be-returned",
    }),
    { ok: true, openid: "openid-test", unionid: "unionid-test" },
  );
  assert.deepEqual(
    parseWechatCode2SessionResponse({ errcode: 40029, errmsg: "invalid" }),
    { ok: false, reason: "REJECTED" },
  );
});

test("session DTO keeps verification state separate from admin access", () => {
  assert.deepEqual(
    toMpSessionUser({
      id: "admin-id",
      name: "Test Admin",
      role: "ADMIN",
      verificationStatus: "VERIFIED",
      identityType: "ALUMNI",
    }),
    {
      id: "admin-id",
      name: "Test Admin",
      accountState: "VERIFIED",
      accessRole: "ADMIN",
      identityType: "ALUMNI",
    },
  );
  assert.equal(
    toMpSessionUser({
      id: "user-id",
      name: null,
      role: "GUEST",
      verificationStatus: "REJECTED",
      identityType: null,
    }).accountState,
    "REJECTED",
  );
});

test("database session rules reject stale, disabled, and role-changed tokens", () => {
  const user: AuthenticatedUser = {
    id: "user-id",
    username: "test-user",
    email: "test@example.test",
    emailVerified: null,
    name: "Test User",
    graduationClass: "2025",
    className: "1",
    verificationStatus: "VERIFIED",
    identityType: "ALUMNI",
    role: "ALUMNI",
    status: "VERIFIED",
    accountStatus: "ACTIVE",
    sessionVersion: 3,
  };
  const payload = {
    v: 3 as const,
    role: "user" as const,
    userId: user.id,
    sessionVersion: 3,
    exp: Date.now() + 60_000,
  };

  assert.equal(tokenMatchesUser(user, payload, false), true);
  assert.equal(tokenMatchesUser(user, payload, true), false);
  assert.equal(
    tokenMatchesUser(user, { ...payload, sessionVersion: 2 }, false),
    false,
  );
  assert.equal(
    tokenMatchesUser({ ...user, accountStatus: "DISABLED" }, payload, false),
    false,
  );
  assert.equal(
    tokenMatchesUser(
      { ...user, role: "ADMIN" },
      payload,
      false,
    ),
    false,
  );
});

test("verification input normalizes roster identity fields and rejects role mixing", () => {
  assert.deepEqual(
    parseMpVerificationSubmission({
      identityType: "ALUMNI",
      name: "  张三  ",
      graduationClass: "2025届",
      className: "1班",
    }),
    {
      ok: true,
      value: {
        identityType: "ALUMNI",
        name: "张三",
        graduationClass: "2025",
        className: "1",
        teacherPosition: null,
      },
    },
  );
  assert.equal(
    parseMpVerificationSubmission({
      identityType: "TEACHER",
      name: "李老师",
      teacherPosition: "教师",
      graduationClass: "2025",
    }).ok,
    false,
  );
});

test("roster matching remains an auxiliary four-state result", () => {
  assert.deepEqual(classifyMpVerificationMatch("ALUMNI", []), {
    matchResult: "NOT_FOUND",
    matchedRosterId: null,
  });
  assert.deepEqual(classifyMpVerificationMatch("ALUMNI", [{ id: "one" }]), {
    matchResult: "MATCHED",
    matchedRosterId: "one",
  });
  assert.deepEqual(
    classifyMpVerificationMatch("STUDENT", [{ id: "one" }, { id: "two" }]),
    { matchResult: "CONFLICT", matchedRosterId: null },
  );
  assert.deepEqual(classifyMpVerificationMatch("TEACHER", [{ id: "one" }]), {
    matchResult: "NOT_APPLICABLE",
    matchedRosterId: null,
  });
});

test("profile patch accepts only editable fields", () => {
  assert.deepEqual(
    parseMpProfilePatch({
      city: " 深圳 ",
      contact: "",
      contactVisibility: "VERIFIED_USERS",
    }),
    {
      ok: true,
      value: {
        contact: null,
        city: "深圳",
        contactVisibility: "VERIFIED_USERS",
      },
    },
  );
  assert.equal(parseMpProfilePatch({ name: "不可修改" }).ok, false);
  assert.equal(parseMpProfilePatch({}).ok, false);
});

test("content pagination uses pageSize and caps oversized requests", () => {
  assert.deepEqual(
    parseMpPagination(new URLSearchParams("page=2&pageSize=500")),
    { page: 2, pageSize: 50, skip: 50 },
  );
  assert.deepEqual(
    parseMpPagination(new URLSearchParams("page=bad&pageSize=0")),
    { page: 1, pageSize: 10, skip: 0 },
  );
  assert.deepEqual(toMpPagination(2, 10, 21), {
    page: 2,
    pageSize: 10,
    total: 21,
    totalPages: 3,
  });
});

test("mp registration accepts only optional contact and message", () => {
  assert.deepEqual(
    parseEventRegistrationInput({ contact: "  wx-test  ", message: "" }),
    { ok: true, value: { contact: "wx-test", message: null } },
  );
  assert.equal(
    parseEventRegistrationInput({
      name: "客户端不能指定姓名",
      contact: null,
      message: null,
    }).ok,
    false,
  );
  assert.equal(
    parseEventRegistrationInput(
      { name: "旧 Web 字段会被忽略", contact: null, message: null },
      { allowLegacyName: true },
    ).ok,
    true,
  );
});

test("middleware requires Bearer auth only for protected mp APIs", async () => {
  const { middleware } = await import("../src/middleware");

  const missing = await middleware(
    new NextRequest("https://example.test/api/mp/auth/me"),
  );
  assert.equal(missing.status, 401);
  const missingBody = await missing.json();
  assert.equal(missingBody.error.code, "MP_AUTH_REQUIRED");
  assert.equal(typeof missingBody.error.requestId, "string");
  assert.equal(missing.headers.get("cache-control"), "no-store");

  const malformed = await middleware(
    new NextRequest("https://example.test/api/mp/auth/me", {
      headers: { authorization: "Basic invalid" },
    }),
  );
  assert.equal(malformed.status, 401);
  assert.equal(
    (await malformed.json()).error.code,
    "MP_AUTH_HEADER_INVALID",
  );

  const token = signToken({
    role: "user",
    userId: "test-user",
    sessionVersion: 2,
  });
  const accepted = await middleware(
    new NextRequest("https://example.test/api/mp/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    }),
  );
  assert.equal(accepted.headers.get("x-middleware-next"), "1");

  const expired = signToken({
    role: "user",
    userId: "test-user",
    sessionVersion: 2,
    exp: Date.now() - 1,
  });
  const rejected = await middleware(
    new NextRequest("https://example.test/api/mp/auth/me", {
      headers: { authorization: `Bearer ${expired}` },
    }),
  );
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).error.code, "MP_TOKEN_INVALID");
});

test("middleware preserves the existing web Cookie branch", async () => {
  const { middleware } = await import("../src/middleware");
  const token = signToken({
    role: "user",
    userId: "web-user",
    sessionVersion: 1,
  });
  const req = new NextRequest("https://example.test/api/auth/me");
  req.cookies.set("yc_access_token", token);

  const response = await middleware(req);
  assert.equal(response.headers.get("x-middleware-next"), "1");
});

test("account deletion requires an exact explicit confirmation", () => {
  assert.deepEqual(parseMpAccountDeletionConfirmation({ confirm: true }), {
    ok: true,
  });
  assert.equal(parseMpAccountDeletionConfirmation({ confirm: false }).ok, false);
  assert.equal(parseMpAccountDeletionConfirmation({}).ok, false);
  assert.equal(
    parseMpAccountDeletionConfirmation({ confirm: true, userId: "other" }).ok,
    false,
  );
  assert.equal(parseMpAccountDeletionConfirmation(null).ok, false);
});

test("account deletion builders remove identity and registration PII", () => {
  assert.deepEqual(buildDeletedUserData(), {
    username: null,
    passwordHash: null,
    email: null,
    emailVerified: null,
    emailVerifyTokenHash: null,
    emailVerifyExpiresAt: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    name: null,
    contact: null,
    identityCode: null,
    graduationClass: null,
    className: null,
    city: null,
    university: null,
    major: null,
    industry: null,
    verificationStatus: "NOT_SUBMITTED",
    identityType: null,
    teacherPosition: null,
    contactVisibility: "PRIVATE",
    role: "GUEST",
    status: "DELETED",
    accountStatus: "DELETED",
    sessionVersion: { increment: 1 },
    claimedAt: null,
    mergedIntoUserId: null,
  });
  assert.deepEqual(buildDeletedRegistrationData(), {
    userId: null,
    name: "已注销用户",
    contact: null,
    message: null,
  });
});
