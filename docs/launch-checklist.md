# 上线检查清单

本清单用于每次较大改动后的上线前后核对。项目包含真实校友数据，任何构建、部署和数据库操作都先以“可回滚、可验证、不泄露”为原则。

## 1. 本地开发完成前

- [ ] 确认当前分支正确，`git status --short` 中没有意外文件。
- [ ] 不提交 `.env`、数据库、上传文件、备份包、日志、`AGENTS.md`、`.agents/`、`.claude/`。
- [ ] 如改动较大，先停止本地开发服务，清理 `.next` 后重新启动：

```bash
# Windows PowerShell 示例：先确认没有重要 Node 进程，再结束本项目开发服务
Get-Process node -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

- [ ] 本地开发服务统一使用 `http://localhost:3000`，避免 3001/3002 等端口残留造成静态资源错配。
- [ ] 移动端优先检查首页、登录/注册、个人中心、校友地图、故事投稿、修正申请、后台主要表单。

## 2. 本地验证

```bash
npx tsc --noEmit
npm run lint
npm run audit:prod
```

如本地服务已在 3000 端口运行：

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

配置了管理员测试账号时，补充：

```bash
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_USERNAME="<管理员用户名>" \
SMOKE_PASSWORD="<管理员密码>" \
npm run smoke
```

## 3. 数据安全

- [ ] 本地 `prisma/dev.db` 可能是真实数据，测试脚本不要打印完整姓名、邮箱、手机号、token 或密码哈希。
- [ ] 触碰 schema、数据清洗、导入、批量更新前先备份数据库。
- [ ] 生产发布前备份 `/var/www/alumni-site/data/prod.db` 和 `/var/www/alumni-site/uploads`。
- [ ] `public/uploads/` 是运行时目录，不提交；目录缺失时上传接口会自动创建。

## 4. WSL/Linux 构建

- [ ] 从 Windows 项目复制到 WSL 原生文件系统，例如 `~/web_yanchuaner`。
- [ ] 删除 Windows 的 `node_modules`，用 Linux 重新安装依赖。
- [ ] 确认 `.env` 指向一次性构建数据库（推荐 `file:./.tmp/build.db`），不指向生产数据库。
- [ ] 执行：

```bash
npm ci
npx tsc --noEmit
npm run lint
npm run audit:prod
mkdir -p .tmp
npm run db:migrate:deploy
npm run build
```

- [ ] 确认 `npm run build` 未隐式执行 migration、`db:push` 或 seed；上面的 `db:migrate:deploy` 只作用于一次性构建库。

- [ ] 打包 `.next/standalone`、`.next/static`、`public`、`prisma`、`prisma.config.ts`、`scripts`。

## 5. 服务器发布

- [ ] 停服务前已完成数据库和上传目录备份。
- [ ] 新版本部署到 `/var/www/alumni-site/app`，旧版本保留为 `/var/www/alumni-site/app.old`。
- [ ] `/var/www/alumni-site/app/.env` 软链接到 `/var/www/alumni-site/.env`。
- [ ] `/var/www/alumni-site/app/public/uploads` 指向 `/var/www/alumni-site/uploads`。
- [ ] 既有生产库首次纳管 migration 时，已在生产副本核对 schema diff，且差异只有预期增量。
- [ ] 首次纳管时只将 `20260710000000_baseline` resolve 为 applied；未手工 resolve 任何增量 migration。
- [ ] 常规发布显式执行 `DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma migrate deploy`，并用 `migrate status` 确认完成；生产禁止 `db push`。
- [ ] 如涉及身份字段清洗，先 dry-run，再正式执行。
- [ ] 重启 `alumni-site` 后检查日志无持续 500 或启动错误。

## 6. 上线后验证

```bash
curl -s http://127.0.0.1:3000/api/health
curl -I https://yanchuaner.cn
sudo systemctl status alumni-site
sudo journalctl -u alumni-site -n 100 --no-pager
```

手动检查：

- [ ] 首页和 `/about` 可公开访问。
- [ ] 未登录访问 `/news`、`/events`、`/students`、`/teachers`、`/contact`、`/alumni/*` 会跳转登录。
- [ ] 校友账号可访问校友空间，地图和统计有 Skeleton/加载态且移动端不溢出。
- [ ] 管理员可访问 `/admin`，能查看统计、审核队列和主要 CRUD 页。
- [ ] 后台上传图片后 `/uploads/<文件名>` 可访问。
- [ ] 个人中心修改资料、故事投稿、基础身份修正申请流程正常。

## 7. 回滚条件

出现以下情况时优先回滚，而不是在线热修：

- 登录、注册、校友认证、管理员后台大面积不可用。
- 首页或主要校友页面静态资源 404，清缓存和重启仍不能恢复。
- Prisma migration 后出现持续数据库错误。
- 上传目录或生产数据库权限异常，影响后台发布内容。

回滚命令见 [deployment.md](deployment.md)。
