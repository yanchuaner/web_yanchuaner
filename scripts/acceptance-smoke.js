#!/usr/bin/env node

const baseUrl = (process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3101").replace(/\/+$/, "");
const allowedHosts = new Set(["127.0.0.1", "localhost"]);
const target = new URL(baseUrl);
if (!allowedHosts.has(target.hostname) && process.env.ACCEPTANCE_ALLOW_REMOTE !== "true") {
  throw new Error("Acceptance smoke only targets localhost unless ACCEPTANCE_ALLOW_REMOTE=true");
}

const ids = {
  verified: "acceptance-verified",
  candidate: "acceptance-candidate",
  deletion: "acceptance-deletion",
  news: "acceptance-news",
  event: "acceptance-event",
};

let passed = 0;
function check(condition, message, detail = "") {
  if (!condition) throw new Error(`${message}${detail ? `: ${detail}` : ""}`);
  passed += 1;
  console.log(`PASS ${message}`);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
}

async function jsonRequest(path, options = {}) {
  const response = await request(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function devLogin(userId) {
  const { response, body } = await jsonRequest("/api/mp/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  check(response.ok && body?.ok, `dev login ${userId}`, `${response.status}`);
  check(response.headers.get("x-mp-api-version") === "1", "API version header");
  return body.data.accessToken;
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function main() {
  const health = await request("/api/health");
  check(health.ok, "health endpoint", `${health.status}`);

  const guestNews = await request("/news");
  check([302, 307, 308].includes(guestNews.status), "guest page redirects to login");

  const adminLogin = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { Origin: baseUrl },
    body: JSON.stringify({ username: "acceptance-admin", password: "AcceptancePass!2026" }),
  });
  const adminCookie = adminLogin.response.headers.get("set-cookie")?.split(";", 1)[0] || "";
  check(adminLogin.response.ok && adminCookie.includes("yc_access_token="), "website admin login");
  const adminStats = await request("/api/admin/stats", { headers: { Cookie: adminCookie } });
  check(adminStats.ok, "website admin authorization", `${adminStats.status}`);

  const alumniLogin = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { Origin: baseUrl },
    body: JSON.stringify({ username: "acceptance-alumni", password: "AcceptancePass!2026" }),
  });
  const alumniCookie = alumniLogin.response.headers.get("set-cookie")?.split(";", 1)[0] || "";
  check(alumniLogin.response.ok && alumniCookie.includes("yc_access_token="), "website alumni login");
  const alumniPage = await request("/me", { headers: { Cookie: alumniCookie } });
  check(alumniPage.ok, "website alumni protected page", `${alumniPage.status}`);
  const webProfile = await request("/api/me/profile", { headers: { Cookie: alumniCookie } });
  check(webProfile.ok, "website alumni profile", `${webProfile.status}`);
  const story = await jsonRequest("/api/stories", {
    method: "POST",
    headers: { Origin: baseUrl, Cookie: alumniCookie },
    body: JSON.stringify({
      title: "验收投稿",
      author: "验收校友",
      tags: ["验收"],
      body: "这是一条隔离环境中的自动化验收投稿。",
      date: "2026-07-11",
    }),
  });
  check(story.response.status === 201 && story.body?.story?.status === "PENDING", "website story submission");

  const verifiedToken = await devLogin(ids.verified);
  const me = await jsonRequest("/api/mp/auth/me", { headers: bearer(verifiedToken) });
  check(me.body?.data?.user?.accountState === "VERIFIED", "verified session state");

  const profile = await jsonRequest("/api/mp/profile", { headers: bearer(verifiedToken) });
  check(profile.response.ok && profile.body?.data?.user?.id === ids.verified, "profile read");
  const profileUpdate = await jsonRequest("/api/mp/profile", {
    method: "PATCH",
    headers: bearer(verifiedToken),
    body: JSON.stringify({ city: "深圳", contactVisibility: "PRIVATE" }),
  });
  check(profileUpdate.body?.data?.user?.city === "深圳", "profile update");

  const news = await jsonRequest("/api/mp/news?page=1&pageSize=50", { headers: bearer(verifiedToken) });
  check(news.body?.data?.items?.some((item) => item.id === ids.news), "news list");
  const newsDetail = await jsonRequest(`/api/mp/news/${ids.news}`, { headers: bearer(verifiedToken) });
  check(newsDetail.body?.data?.news?.id === ids.news, "news detail");

  const events = await jsonRequest("/api/mp/events?page=1&pageSize=50", { headers: bearer(verifiedToken) });
  check(events.body?.data?.items?.some((item) => item.id === ids.event), "event list");
  const eventDetail = await jsonRequest(`/api/mp/events/${ids.event}`, { headers: bearer(verifiedToken) });
  check(eventDetail.body?.data?.event?.id === ids.event, "event detail");

  const registration = await jsonRequest(`/api/mp/events/${ids.event}/registration`, {
    method: "POST",
    headers: bearer(verifiedToken),
    body: JSON.stringify({ contact: null, message: "验收报名" }),
  });
  check(registration.response.status === 201 && registration.body?.ok, "event registration");
  const registrations = await jsonRequest("/api/mp/registrations", { headers: bearer(verifiedToken) });
  check(registrations.body?.data?.items?.some((item) => item.event.id === ids.event), "registration list");
  const cancellation = await jsonRequest(`/api/mp/events/${ids.event}/registration`, {
    method: "DELETE",
    headers: bearer(verifiedToken),
  });
  check(cancellation.body?.data?.registrationStatus === "CANCELLED", "event cancellation");

  const candidateToken = await devLogin(ids.candidate);
  const verification = await jsonRequest("/api/mp/verification", {
    method: "POST",
    headers: bearer(candidateToken),
    body: JSON.stringify({
      identityType: "ALUMNI",
      name: "待认证校友",
      graduationClass: "2025",
      className: "1",
      teacherPosition: null,
    }),
  });
  check(verification.response.status === 201 && verification.body?.data?.verificationStatus === "PENDING", "verification submission");
  const verificationState = await jsonRequest("/api/mp/verification", { headers: bearer(candidateToken) });
  check(verificationState.body?.data?.request?.status === "PENDING", "verification pending state");

  const deletionToken = await devLogin(ids.deletion);
  const deletion = await jsonRequest("/api/mp/account/deletion", {
    method: "POST",
    headers: bearer(deletionToken),
    body: JSON.stringify({ confirm: true }),
  });
  check(deletion.body?.data?.deleted === true, "account deletion");
  const deletedSession = await jsonRequest("/api/mp/auth/me", { headers: bearer(deletionToken) });
  check(deletedSession.response.status === 401 && deletedSession.body?.error?.code === "MP_TOKEN_INVALID", "deleted token invalidation");

  console.log(`Acceptance flow completed: ${passed} checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
