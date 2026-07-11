import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  MP_API_VERSION,
  MP_ERROR_CODES,
  mpError,
  mpSuccess,
} from "../src/lib/mp-api";
import { MP_API_ENDPOINTS } from "../src/lib/mp-contract";

test("mini program endpoint registry matches route handlers", () => {
  for (const endpoint of MP_API_ENDPOINTS) {
    const routePath = path.join(
      process.cwd(),
      "src/app",
      endpoint.path.replace(/^\//, ""),
      "route.ts",
    );
    assert.equal(fs.existsSync(routePath), true, `${endpoint.path} route missing`);
    const source = fs.readFileSync(routePath, "utf8");
    assert.match(
      source,
      new RegExp(`export\\s+async\\s+function\\s+${endpoint.method}\\b`),
      `${endpoint.method} ${endpoint.path} handler missing`,
    );
  }
});

test("mini program responses expose stable version and cache policy", async () => {
  const response = mpSuccess({ value: 1 });
  assert.equal(response.headers.get("x-mp-api-version"), MP_API_VERSION);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, data: { value: 1 } });
});

test("mini program errors correlate body and response request ids", async () => {
  const response = mpError(MP_ERROR_CODES.VALIDATION_ERROR, "invalid", 400);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("x-mp-api-version"), MP_API_VERSION);
  assert.equal(response.headers.get("x-request-id"), body.error.requestId);
  assert.equal(body.error.code, MP_ERROR_CODES.VALIDATION_ERROR);
});

test("mini program error codes remain unique", () => {
  const codes = Object.values(MP_ERROR_CODES);
  assert.equal(new Set(codes).size, codes.length);
});
