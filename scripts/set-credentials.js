#!/usr/bin/env node

console.error(
  [
    "共享口令和环境变量管理员已下线。",
    "请配置 SESSION_SECRET、APP_URL 和 Resend 环境变量，",
    "然后运行 npm run create-admin 创建数据库管理员账号。",
  ].join("\n"),
);
process.exitCode = 1;
