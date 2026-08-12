import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIdentityEventPayload,
  getIdentityEventConfig,
  identityEventNameForAction,
  identityEventSignature,
} from "../src/lib/identity-events";

test("identity event payload contains the expected signed fields", () => {
  const payload = buildIdentityEventPayload(
    {
      userId: "user-1",
      event: "account.disabled",
      role: "alumni",
      accountStatus: "DISABLED",
      status: "VERIFIED",
    },
    "event-1",
    1_752_000_000,
  );
  const parsed = JSON.parse(payload) as Record<string, unknown>;
  assert.equal(parsed.event_id, "event-1");
  assert.equal(parsed.subject, "user-1");
  assert.equal(parsed.event, "account.disabled");
  assert.equal(parsed.role, "alumni");
  assert.equal(parsed.account_status, "DISABLED");
  assert.equal(parsed.status, "VERIFIED");
  assert.equal(parsed.occurred_at, 1_752_000_000);
  assert.doesNotMatch(payload, /[\r\n]/);
});

test("identity event signature changes with payload or secret", () => {
  const secret = "01234567890123456789012345678901";
  const payload = buildIdentityEventPayload(
    { userId: "user-1", event: "sessions.revoked" },
    "event-2",
    1_752_000_000,
  );
  const first = identityEventSignature(secret, payload);
  const second = identityEventSignature(secret, payload);
  const changedPayload = identityEventSignature(secret, payload.replace("sessions.revoked", "role.changed"));
  const changedSecret = identityEventSignature("11111111111111111111111111111111", payload);
  assert.equal(first, second);
  assert.notEqual(first, changedPayload);
  assert.notEqual(first, changedSecret);
  assert.match(first, /^sha256=[0-9a-f]{64}$/);
});

test("identity event names map only identity-affecting admin actions", () => {
  assert.equal(identityEventNameForAction("disable-account"), "account.disabled");
  assert.equal(identityEventNameForAction("enable-account"), "account.enabled");
  assert.equal(identityEventNameForAction("logout-all-sessions"), "sessions.revoked");
  assert.equal(identityEventNameForAction("grant-admin"), "role.changed");
  assert.equal(identityEventNameForAction("revoke-admin"), "role.changed");
  assert.equal(identityEventNameForAction("approve-alumni"), "account.verified");
  assert.equal(identityEventNameForAction("reject-alumni"), "account.rejected");
  assert.equal(identityEventNameForAction("send-reset-password"), null);
  assert.equal(identityEventNameForAction("resend-verification"), null);
});

test("identity event config requires URLs and a long secret", (t) => {
  const previousUrls = process.env.IDENTITY_EVENT_WEBHOOK_URLS;
  const previousSecret = process.env.IDENTITY_EVENT_WEBHOOK_SECRET;
  t.after(() => {
    if (previousUrls === undefined) delete process.env.IDENTITY_EVENT_WEBHOOK_URLS;
    else process.env.IDENTITY_EVENT_WEBHOOK_URLS = previousUrls;
    if (previousSecret === undefined) delete process.env.IDENTITY_EVENT_WEBHOOK_SECRET;
    else process.env.IDENTITY_EVENT_WEBHOOK_SECRET = previousSecret;
  });
  process.env.IDENTITY_EVENT_WEBHOOK_URLS = "https://api.example.test/api/yancore/identity-events";
  process.env.IDENTITY_EVENT_WEBHOOK_SECRET = "short";
  assert.equal(getIdentityEventConfig(), null);
  process.env.IDENTITY_EVENT_WEBHOOK_SECRET = "01234567890123456789012345678901";
  const config = getIdentityEventConfig();
  assert.ok(config);
  assert.equal(config.webhookUrls.length, 1);
  assert.equal(config.webhookUrls[0].href, "https://api.example.test/api/yancore/identity-events");
});
