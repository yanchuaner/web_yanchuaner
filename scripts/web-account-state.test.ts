import assert from "node:assert/strict";
import test from "node:test";
import { resolveWebAccountState } from "../src/lib/web-account-state";

const verifiedUser = {
  accountStatus: "ACTIVE",
  emailVerified: new Date(),
  role: "ALUMNI",
  status: "VERIFIED",
  verificationStatus: "VERIFIED",
};

test("disabled accounts take precedence over every other state", () => {
  assert.equal(
    resolveWebAccountState({ ...verifiedUser, accountStatus: "DISABLED" }),
    "ACCOUNT_DISABLED",
  );
});

test("unverified email is distinguished from alumni review", () => {
  assert.equal(
    resolveWebAccountState({ ...verifiedUser, emailVerified: null }),
    "EMAIL_NOT_VERIFIED",
  );
});

test("admins can sign in without alumni review", () => {
  assert.equal(
    resolveWebAccountState({
      ...verifiedUser,
      role: "ADMIN",
      status: "PENDING",
      verificationStatus: "PENDING",
    }),
    "ACTIVE",
  );
});

test("pending and rejected alumni reviews remain distinct", () => {
  assert.equal(
    resolveWebAccountState({
      ...verifiedUser,
      role: "GUEST",
      status: "PENDING",
      verificationStatus: "PENDING",
    }),
    "REVIEW_PENDING",
  );
  assert.equal(
    resolveWebAccountState({ ...verifiedUser, status: "REJECTED" }),
    "REVIEW_REJECTED",
  );
});

test("only fully verified alumni accounts become active", () => {
  assert.equal(resolveWebAccountState(verifiedUser), "ACTIVE");
  assert.equal(
    resolveWebAccountState({ ...verifiedUser, verificationStatus: "PENDING" }),
    "REVIEW_PENDING",
  );
});
