# 测试环境部署

测试环境必须与生产数据库、上传目录、域名和密钥隔离。仓库提供 Docker Compose 作为可重复的 staging 入口；正式生产仍使用 `deployment.md` 中的 standalone + systemd 流程。

## 本机或测试服务器

```bash
cp .env.staging.example .env.staging
```

将 `SESSION_SECRET` 替换为随机值。测试微信登录时填写测试小程序的 AppID/AppSecret，不得提交 `.env.staging`。

```bash
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3100/api/health
```

Compose 会先执行 `prisma migrate deploy`，成功后才启动应用。数据与上传文件分别保存在被 Git 忽略的 `.tmp/staging-data` 和 `.tmp/staging-uploads`。

停止环境使用 `docker compose down`。清空测试数据前必须确认目标是当前仓库下的 `.tmp/staging-data` 和 `.tmp/staging-uploads`。

## 发布门槛

```bash
npm ci
npm run release:check
npm run build:check:wsl
```

随后确认 health、登录与鉴权边界、安全响应头、人工验收矩阵、备份恢复及日志脱敏。若开发机未安装 Docker，可先使用 `acceptance-plan.md` 的本地隔离数据库流程，并在具备 Docker Compose 的测试服务器补跑容器验证。
