import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";

const originalAppUrl = process.env.APP_URL;
const originalSiteUrl = process.env.SITE_URL;

test.afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
  if (originalSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalSiteUrl;
});

test("unauthenticated redirects use the configured external origin", async () => {
  process.env.APP_URL = "https://yanchuaner.cn";
  const request = new NextRequest("http://localhost:3000/news", {
    headers: {
      host: "localhost:3000",
      "x-forwarded-host": "untrusted.example",
      "x-forwarded-proto": "https",
    },
  });

  const response = await middleware(request);

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "https://yanchuaner.cn/login?redirect=%2Fnews",
  );
});

test("proxy headers provide the external origin when no URL is configured", async () => {
  delete process.env.APP_URL;
  delete process.env.SITE_URL;
  const request = new NextRequest("http://localhost:3000/admin/login", {
    headers: {
      host: "localhost:3000",
      "x-forwarded-host": "yanchuaner.cn",
      "x-forwarded-proto": "https",
    },
  });

  const response = await middleware(request);

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "https://yanchuaner.cn/login?redirect=%2Fadmin",
  );
});

test("loopback APP_URL follows the browser base in local acceptance", async () => {
  process.env.APP_URL = "http://localhost:3000";
  const request = new NextRequest("http://127.0.0.1:3000/news", {
    headers: {
      host: "127.0.0.1:3000",
      "x-forwarded-host": "127.0.0.1:3000",
      "x-forwarded-proto": "http",
    },
  });

  const response = await middleware(request);

  assert.equal(
    response.headers.get("location"),
    "http://127.0.0.1:3000/login?redirect=%2Fnews",
  );
});
