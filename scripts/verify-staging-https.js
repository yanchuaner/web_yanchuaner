const { readFileSync } = require("node:fs");
const { lookup } = require("node:dns/promises");
const tls = require("node:tls");
const { resolve } = require("node:path");
const { parse } = require("dotenv");

const envPath = resolve(process.cwd(), process.argv[2] || ".env.staging");
const env = parse(readFileSync(envPath, "utf8"));
const checks = [];

function check(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`PASS ${message}`);
}

async function inspectCertificate(hostname, port) {
  return new Promise((resolveCertificate, reject) => {
    const socket = tls.connect({ hostname, port, servername: hostname, rejectUnauthorized: true });
    socket.setTimeout(10_000);
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      socket.end();
      resolveCertificate(certificate);
    });
    socket.once("timeout", () => socket.destroy(new Error("TLS connection timed out")));
    socket.once("error", reject);
  });
}

async function main() {
  let baseUrl;
  try {
    baseUrl = new URL(env.SITE_URL || "");
  } catch {
    throw new Error("SITE_URL must be a valid URL");
  }

  check(baseUrl.protocol === "https:", "staging origin uses HTTPS");
  check(!["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname), "staging uses a non-loopback hostname");

  const addresses = await lookup(baseUrl.hostname, { all: true });
  check(addresses.length > 0, "staging hostname resolves through DNS");

  const certificate = await inspectCertificate(baseUrl.hostname, Number(baseUrl.port || 443));
  const remainingDays = (new Date(certificate.valid_to).getTime() - Date.now()) / 86_400_000;
  check(remainingDays >= 14, "TLS certificate remains valid for at least 14 days");

  const healthResponse = await fetch(new URL("/api/health", baseUrl), { redirect: "error" });
  const health = await healthResponse.json().catch(() => null);
  check(healthResponse.ok, "HTTPS health endpoint responds successfully");
  check(health?.status === "healthy", "application health is healthy");
  check(health?.checks?.database === "connected", "staging database is connected");
  check(health?.checks?.redis === "connected", "staging Redis is connected");

  const pageResponse = await fetch(baseUrl, { redirect: "error" });
  check(pageResponse.ok, "staging homepage responds successfully");
  check(Boolean(pageResponse.headers.get("strict-transport-security")), "HSTS is enabled");
  check(pageResponse.headers.get("x-content-type-options")?.toLowerCase() === "nosniff", "MIME sniffing is disabled");
  check(["deny", "sameorigin"].includes(pageResponse.headers.get("x-frame-options")?.toLowerCase()), "framing is restricted");
  check(Boolean(pageResponse.headers.get("referrer-policy")), "referrer policy is present");
  check(Boolean(pageResponse.headers.get("content-security-policy") || pageResponse.headers.get("content-security-policy-report-only")), "content security policy is present");

  console.log(`HTTPS staging verification completed: ${checks.length} checks passed`);
}

main().catch((error) => {
  console.error(`HTTPS staging verification failed: ${error.message}`);
  process.exitCode = 1;
});
