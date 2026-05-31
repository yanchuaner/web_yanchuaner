#!/usr/bin/env node
/* eslint-disable */
/**
 * 一键修改三项凭证：访问口令 / 管理员账号 / 管理员密码。
 *
 * 用法（任选一种）：
 *   1) 配置文件模式（推荐）：
 *        cp credentials.example.json credentials.local.json
 *        编辑 credentials.local.json 填入新值，然后：
 *        node scripts/set-credentials.js
 *   2) CLI 参数模式：
 *        node scripts/set-credentials.js \
 *          --access "新访问口令" \
 *          --admin-user "yanchuaner" \
 *          --admin-password "新管理员密码"
 *      所有参数均为可选；未提供的字段保持原值。
 *
 * 行为约定：
 *   - 三项凭证均不写入仓库；密码以 SHA-256 hash 存入 .env
 *   - 原子写入：先写 .env.tmp 再 rename；失败回滚
 *   - 自动备份：操作前生成 .env.bak.<timestamp>，可用于回滚
 *   - 不打印任何明文密码值
 *
 * 修改后请重启 next 服务（开发：重新 npm run dev；生产：重启 standalone）
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ENV = path.join(ROOT, ".env");
const TMP = path.join(ROOT, ".env.tmp");
const CONFIG = path.join(ROOT, "credentials.local.json");

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--access") out.accessPassword = argv[++i];
    else if (a === "--admin-user") out.adminUsername = argv[++i];
    else if (a === "--admin-password") out.adminPassword = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(2, 25).join("\n"));
      process.exit(0);
    }
  }
  return out;
}

function readConfigFile() {
  if (!fs.existsSync(CONFIG)) return null;
  try {
    const raw = fs.readFileSync(CONFIG, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("[set-credentials] credentials.local.json 解析失败:", e.message);
    process.exit(2);
  }
}

function readEnvLines() {
  if (!fs.existsSync(ENV)) {
    console.error("[set-credentials] .env 不存在。请先复制 .env.example 为 .env 并填入 SESSION_SECRET 等基础项。");
    process.exit(2);
  }
  return fs.readFileSync(ENV, "utf8").split(/\r?\n/);
}

function setOrAppendVar(lines, key, value) {
  const re = new RegExp(`^\\s*${key}\\s*=`);
  const newLine = `${key}="${value}"`;
  let replaced = false;
  const out = lines.map((line) => {
    if (re.test(line)) {
      replaced = true;
      return newLine;
    }
    return line;
  });
  if (!replaced) out.push(newLine);
  return out;
}

function removeVar(lines, key) {
  const re = new RegExp(`^\\s*${key}\\s*=`);
  return lines.filter((line) => !re.test(line));
}

function main() {
  const cliArgs = parseArgs(process.argv);
  const cfg = readConfigFile();
  const merged = {
    accessPassword: cliArgs.accessPassword ?? cfg?.accessPassword,
    adminUsername: cliArgs.adminUsername ?? cfg?.adminUsername,
    adminPassword: cliArgs.adminPassword ?? cfg?.adminPassword,
  };

  const updates = Object.entries(merged).filter(([, v]) => typeof v === "string" && v.length > 0);
  if (updates.length === 0) {
    console.error(
      "[set-credentials] 未提供任何凭证。请通过 credentials.local.json 或 --access/--admin-user/--admin-password 指定。"
    );
    process.exit(2);
  }

  // Validate basic constraints
  if (merged.adminUsername && /[\s"]/.test(merged.adminUsername)) {
    console.error("[set-credentials] adminUsername 不可包含空格或双引号。");
    process.exit(2);
  }
  if (merged.accessPassword && merged.accessPassword.length < 6) {
    console.error("[set-credentials] accessPassword 至少 6 位。");
    process.exit(2);
  }
  if (merged.adminPassword && merged.adminPassword.length < 6) {
    console.error("[set-credentials] adminPassword 至少 6 位。");
    process.exit(2);
  }

  // Backup original
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(ROOT, `.env.bak.${ts}`);
  fs.copyFileSync(ENV, backup);

  let lines = readEnvLines();
  const changed = [];

  if (merged.accessPassword) {
    lines = setOrAppendVar(lines, "ACCESS_PASSWORD_HASH", sha256(merged.accessPassword));
    lines = removeVar(lines, "ACCESS_PASSWORD"); // never keep plaintext
    changed.push("ACCESS_PASSWORD_HASH");
  }
  if (merged.adminUsername) {
    lines = setOrAppendVar(lines, "ADMIN_USERNAME", merged.adminUsername);
    changed.push("ADMIN_USERNAME");
  }
  if (merged.adminPassword) {
    lines = setOrAppendVar(lines, "ADMIN_PASSWORD_HASH", sha256(merged.adminPassword));
    lines = removeVar(lines, "ADMIN_PASSWORD"); // never keep plaintext
    changed.push("ADMIN_PASSWORD_HASH");
  }

  // Atomic write: write tmp first, then rename
  const newContent = lines.join("\n").replace(/\n+$/, "") + "\n";
  try {
    fs.writeFileSync(TMP, newContent, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(TMP, ENV);
  } catch (e) {
    console.error("[set-credentials] 写入失败，已保留备份。错误:", e.message);
    try { fs.unlinkSync(TMP); } catch {}
    process.exit(3);
  }

  console.log("[set-credentials] 已更新字段:", changed.join(", "));
  console.log(`[set-credentials] 备份: ${path.relative(ROOT, backup)}`);
  console.log("[set-credentials] 回滚命令:");
  console.log(`    cp "${path.relative(ROOT, backup)}" .env`);
  console.log("[set-credentials] 重启提示:");
  console.log("    开发模式：重新执行 npm run dev");
  console.log("    生产模式：重启 .next/standalone/server.js（kill 旧进程后再启动）");
  // Never echo any plaintext credential.
}

main();
