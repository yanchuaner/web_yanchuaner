#!/usr/bin/env node

/**
 * 新账号体系冒烟测试。
 *
 * 可选环境变量：
 *   SMOKE_BASE_URL=http://127.0.0.1:3000
 *   SMOKE_USERNAME=数据库管理员用户名
 *   SMOKE_PASSWORD=数据库管理员密码
 */

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const username = process.env.SMOKE_USERNAME || "";
const password = process.env.SMOKE_PASSWORD || "";
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
}

function sameOriginHeaders(extra = {}) {
  return {
    Origin: baseUrl,
    ...extra,
  };
}

async function main() {
  const health = await request("/api/health");
  const healthText = await health.text().catch(() => "");
  record("health_is_public", health.ok, `${health.status} ${healthText}`);

  const privatePage = await request("/news");
  record(
    "guest_private_page_redirects",
    [302, 307, 308].includes(privatePage.status) &&
      (privatePage.headers.get("location") || "").includes("/login"),
    `${privatePage.status} ${privatePage.headers.get("location") || ""}`,
  );

  const privateApi = await request("/api/news");
  record(
    "guest_private_api_rejected",
    privateApi.status === 401,
    String(privateApi.status),
  );

  const oldVerify = await request("/api/auth/verify", {
    method: "POST",
    headers: sameOriginHeaders(),
  });
  record(
    "shared_password_login_removed",
    oldVerify.status === 401 || oldVerify.status === 410,
    String(oldVerify.status),
  );

  const oldJoin = await request("/api/join", {
    method: "POST",
    headers: sameOriginHeaders(),
  });
  record(
    "legacy_join_write_removed",
    oldJoin.status === 401 || oldJoin.status === 410,
    String(oldJoin.status),
  );

  const sitemap = await (await request("/sitemap.xml")).text();
  record(
    "sitemap_only_has_public_content",
    !/\/(?:news|events|students|teachers|alumni|admin|me)(?:\/|<)/.test(
      sitemap,
    ),
  );

  if (username && password) {
    const login = await request("/api/auth/login", {
      method: "POST",
      headers: sameOriginHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ username, password }),
    });
    const cookie = login.headers.get("set-cookie") || "";
    record(
      "database_admin_login",
      login.ok && /yc_access_token=/.test(cookie),
      String(login.status),
    );
    if (login.ok && cookie) {
      const authCookie = cookie.split(";")[0];
      const admin = await request("/api/admin/stats", {
        headers: { Cookie: authCookie },
      });
      record("admin_api_authorized", admin.ok, String(admin.status));
      const logout = await request("/api/auth/logout", {
        method: "POST",
        headers: sameOriginHeaders({ Cookie: authCookie }),
      });
      record(
        "logout_clears_cookie",
        logout.ok &&
          /Max-Age=0/i.test(logout.headers.get("set-cookie") || ""),
      );
    }
  } else {
    console.log(
      "SKIP database_admin_login: set SMOKE_USERNAME and SMOKE_PASSWORD",
    );
  }

  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
