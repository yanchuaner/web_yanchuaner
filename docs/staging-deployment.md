# 测试环境部署

测试环境必须与生产数据库、上传目录、域名和密钥隔离。仓库提供 Docker Compose 作为可重复的 staging 入口；正式生产仍使用 `deployment.md` 中的 standalone + systemd 流程。

## 本机或测试服务器

```bash
cp .env.staging.example .env.staging
```

为 `SESSION_SECRET` 和 `STAGING_REDIS_PASSWORD` 分别生成随机值；后者同时写入
`REDIS_URL` 的密码部分。测试微信登录时填写测试小程序的 AppID/AppSecret，
不得提交 `.env.staging`。

```bash
openssl rand -hex 32
npm run check:staging
```

检查器不会打印密钥。缺少真实邮件或 OAuth 凭据时会明确列为外部待办；配置了半套
OAuth 或不安全的非本机 HTTP 地址时则直接失败。

```bash
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3100/api/health
```

Compose 会先启动固定摘要的 Redis、执行 `prisma migrate deploy`，两者健康后才启动
应用。SQLite 与上传文件分别保存在被 Git 忽略的 `.tmp/staging-data` 和
`.tmp/staging-uploads`；Redis 数据使用 Compose 专属命名卷，不发布主机端口。

staging 首次启动只创建 schema，不会复制 `prisma/dev.db`、生产数据库或既有账号。需要验收登录时，只向该隔离数据库写入仓库内置的虚拟账号：

```bash
docker compose run --rm --no-deps \
  -v "$PWD/scripts:/app/scripts:ro" \
  -e ACCEPTANCE_ALLOW_MUTATION=true \
  -e NODE_ENV=development \
  migrate sh -lc 'npx tsx scripts/seed_acceptance.ts && chown -R 1001:1001 /data /uploads'
```

该命令只允许明显包含 `staging`、`.tmp` 或 `acceptance` 的数据库路径，并拒绝生产环境。真实注册闭环还需要配置可用的邮件发送服务；`RESEND_API_KEY` 为空时账号可以创建，但无法通过真实邮箱收到验证链接。

完整业务验收需要开发模拟登录，但 production standalone 会在构建期关闭该路由。使用同一 builder 镜像临时启动只监听本机的验收服务：

```bash
docker compose run --rm -d --no-deps \
  --name yanchuaner-acceptance \
  -p 127.0.0.1:3101:3000 \
  -e NODE_ENV=development \
  -e APP_URL=http://127.0.0.1:3101 \
  -e SITE_URL=http://127.0.0.1:3101 \
  -e MP_DEV_MOCK_LOGIN_ENABLED=true \
  -e MP_DEV_MOCK_USER_IDS=acceptance-verified,acceptance-candidate,acceptance-deletion \
  migrate npx next dev -H 0.0.0.0 -p 3000

ACCEPTANCE_BASE_URL=http://127.0.0.1:3101 npm run test:acceptance
docker stop yanchuaner-acceptance
```

临时容器带 `--rm`，停止后自动删除。不要用 `docker run --env-file .env.staging` 代替 Compose：Docker CLI 会保留示例文件中的引号，可能让 SQLite 和 Redis URL 被错误解析。

停止环境使用 `docker compose down`。清空测试数据前必须确认目标是当前仓库下的 `.tmp/staging-data` 和 `.tmp/staging-uploads`。

## 发布门槛

```bash
npm ci
npm run release:check
npm run build:check:wsl
```

随后确认 health、登录与鉴权边界、安全响应头、人工验收矩阵、备份恢复及日志脱敏。若开发机未安装 Docker，可先使用 `acceptance-plan.md` 的本地隔离数据库流程，并在具备 Docker Compose 的测试服务器补跑容器验证。

OAuth/OIDC 联合验收必须在 HTTPS staging 上进行，并配置独立客户端密钥和持久化
RSA 签名密钥。本机 HTTP staging 已覆盖数据库、Redis、主站功能和 OAuth 提供方合约，
但不作为真实跨域 SSO 已完成的结论。真实邮件闭环同样需要 Resend 凭据和已验证发件域名。
