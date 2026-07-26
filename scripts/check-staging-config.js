const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { parse } = require("dotenv");

const envPath = resolve(process.cwd(), process.argv[2] || ".env.staging");
const env = parse(readFileSync(envPath, "utf8"));
const errors = [];
const pending = [];
const requireExternal = process.argv.includes("--require-external") || env.STAGING_REQUIRE_EXTERNAL === "true";

function value(name) {
  return env[name]?.trim() || "";
}

function looksPlaceholder(input) {
  return /(?:replace|change-me|example\.(?:com|test)|<.+>)/i.test(input);
}

function requireSecret(name, minimumLength = 32) {
  const current = value(name);
  if (current.length < minimumLength || looksPlaceholder(current)) {
    errors.push(`${name} 必须使用至少 ${minimumLength} 位的非示例随机值`);
  }
}

if (value("NODE_ENV") !== "production") {
  errors.push("NODE_ENV 必须为 production");
}
requireSecret("SESSION_SECRET");
requireSecret("STAGING_REDIS_PASSWORD");

const siteUrl = value("SITE_URL");
const appUrl = value("APP_URL");
if (!siteUrl || siteUrl !== appUrl) {
  errors.push("SITE_URL 与 APP_URL 必须存在且完全一致");
}

try {
  const parsedSiteUrl = new URL(siteUrl);
  const loopback = ["localhost", "127.0.0.1"].includes(parsedSiteUrl.hostname);
  if (requireExternal && loopback) {
    errors.push("真实 staging 必须使用可公开解析的独立 HTTPS 域名");
  }
  if (!loopback && parsedSiteUrl.protocol !== "https:") {
    errors.push("非本机 staging 必须使用 HTTPS");
  }
  if (!loopback && value("AUTH_COOKIE_SECURE") !== "true") {
    errors.push("HTTPS staging 必须启用 AUTH_COOKIE_SECURE");
  }
} catch {
  errors.push("SITE_URL 不是有效 URL");
}

try {
  const redisUrl = new URL(value("REDIS_URL"));
  if (redisUrl.protocol !== "redis:" || redisUrl.hostname !== "redis") {
    errors.push("Compose staging 的 REDIS_URL 必须指向 redis 服务");
  }
  if (decodeURIComponent(redisUrl.password) !== value("STAGING_REDIS_PASSWORD")) {
    errors.push("REDIS_URL 与 STAGING_REDIS_PASSWORD 不一致");
  }
} catch {
  errors.push("REDIS_URL 不是有效 Redis URL");
}

if (!value("RESEND_API_KEY")) {
  const message = "邮件服务：等待 Resend API Key 与已验证发件域名";
  if (requireExternal) errors.push(message);
  else pending.push(message);
} else if (looksPlaceholder(value("RESEND_FROM_EMAIL"))) {
  errors.push("配置 RESEND_API_KEY 后必须使用真实且已验证的发件地址");
}

const oauthFields = [
  "YANCHUANER_OAUTH_CLIENT_ID",
  "YANCHUANER_OAUTH_CLIENT_SECRET",
  "YANCHUANER_OAUTH_REDIRECT_URI",
  "YANCHUANER_OAUTH_ISSUER",
  "YANCHUANER_OAUTH_INTERNAL_URL",
  "YANCHUANER_OAUTH_SIGNING_KEY",
  "YANCHUANER_AI_OAUTH_CLIENT_ID",
  "YANCHUANER_AI_OAUTH_CLIENT_SECRET",
  "YANCHUANER_AI_OAUTH_REDIRECT_URI",
  "YANCHUANER_AI_WEB_OAUTH_CLIENT_ID",
  "YANCHUANER_AI_WEB_OAUTH_CLIENT_SECRET",
  "YANCHUANER_AI_WEB_OAUTH_REDIRECT_URI",
];
const configuredOauthFields = oauthFields.filter((name) => value(name));
if (configuredOauthFields.length === 0) {
  const message = "生态 OAuth：等待 HTTPS 域名与 API/AI 客户端配置";
  if (requireExternal) errors.push(message);
  else pending.push(message);
} else {
  const missingOauthFields = oauthFields.filter((name) => !value(name));
  if (missingOauthFields.length > 0) {
    errors.push(`OAuth 配置不完整：${missingOauthFields.join(", ")}`);
  }
  for (const name of oauthFields.filter((item) => item.endsWith("_SECRET"))) {
    if (value(name).length < 32 || looksPlaceholder(value(name))) {
      errors.push(`${name} 必须使用至少 32 位的非示例随机值`);
    }
  }
  const clientIds = [
    value("YANCHUANER_OAUTH_CLIENT_ID"),
    value("YANCHUANER_AI_OAUTH_CLIENT_ID"),
    value("YANCHUANER_AI_WEB_OAUTH_CLIENT_ID"),
  ].filter(Boolean);
  if (new Set(clientIds).size !== clientIds.length) {
    errors.push("API、Open WebUI 与自主 AI Web 必须使用不同的 OAuth client ID");
  }
  const clientSecrets = [
    value("YANCHUANER_OAUTH_CLIENT_SECRET"),
    value("YANCHUANER_AI_OAUTH_CLIENT_SECRET"),
    value("YANCHUANER_AI_WEB_OAUTH_CLIENT_SECRET"),
  ].filter(Boolean);
  if (new Set(clientSecrets).size !== clientSecrets.length) {
    errors.push("三个 OAuth 消费端不得复用 client secret");
  }
  if (value("YANCHUANER_OAUTH_SIGNING_KEY").length < 256 || looksPlaceholder(value("YANCHUANER_OAUTH_SIGNING_KEY"))) {
    errors.push("YANCHUANER_OAUTH_SIGNING_KEY 必须是持久化的 RSA 私钥");
  }
  if (value("YANCHUANER_OAUTH_ISSUER") && value("YANCHUANER_OAUTH_ISSUER") !== siteUrl) {
    errors.push("YANCHUANER_OAUTH_ISSUER 必须与 SITE_URL 完全一致");
  }
  if (requireExternal) {
    for (const name of oauthFields.filter((item) => item.endsWith("_REDIRECT_URI") || item.endsWith("_INTERNAL_URL"))) {
      try {
        if (new URL(value(name)).protocol !== "https:") errors.push(`${name} 必须使用 HTTPS`);
      } catch {
        errors.push(`${name} 不是有效 URL`);
      }
    }
  }
}

console.log(`Staging config: ${envPath}`);
console.log(errors.length === 0 ? "Core + Redis: ready" : "Core + Redis: invalid");
console.log(`External release gate: ${requireExternal ? "required" : "advisory"}`);
for (const item of pending) console.log(`Pending external dependency: ${item}`);
for (const item of errors) console.error(`Config error: ${item}`);

if (errors.length > 0) process.exitCode = 1;
