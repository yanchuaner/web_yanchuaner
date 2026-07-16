import assert from "node:assert/strict";
import test from "node:test";
import {
  hashAccessCode,
  publicRegistrationPolicy,
  verifyRegistrationAccessCode,
} from "../src/lib/registration-policy";

test("registration access codes are case-sensitive and stored as hashes", async () => {
  const accessCodeHash = await hashAccessCode("YANZHONG-2026");
  const policy = {
    accessCodeEnabled: true,
    accessCodeHash,
    accessCodeHint: "Ask an organizer",
  };

  assert.notEqual(accessCodeHash, "YANZHONG-2026");
  assert.equal(
    await verifyRegistrationAccessCode("YANZHONG-2026", policy),
    true,
  );
  assert.equal(
    await verifyRegistrationAccessCode("yanzhong-2026", policy),
    false,
  );
});

test("missing, short, or disabled codes fall back to manual review", async () => {
  const accessCodeHash = await hashAccessCode("YANZHONG-2026");
  const policy = {
    accessCodeEnabled: false,
    accessCodeHash,
    accessCodeHint: "",
  };

  assert.equal(await verifyRegistrationAccessCode("YANZHONG-2026", policy), false);
  assert.equal(await verifyRegistrationAccessCode("short", { ...policy, accessCodeEnabled: true }), false);
  assert.equal(await verifyRegistrationAccessCode("", null), false);
});

test("the public policy never exposes the code hash", async () => {
  const result = publicRegistrationPolicy({
    accessCodeEnabled: true,
    accessCodeHash: await hashAccessCode("YANZHONG-2026"),
    accessCodeHint: "Provided by an organizer",
  });

  assert.deepEqual(result, {
    accessCodeEnabled: true,
    accessCodeHint: "Provided by an organizer",
  });
  assert.equal("accessCodeHash" in result, false);
});
