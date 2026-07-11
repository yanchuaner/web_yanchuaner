# 部署指南

本文档记录本项目当前推荐的上线流程：Windows 本地开发，复制到 WSL/Linux 原生文件系统构建，再打包上传到服务器。生产运行使用 Next.js standalone、systemd、Nginx、Let's Encrypt 和 SQLite。每次发布前后可配合 [launch-checklist.md](launch-checklist.md) 核对。

## 1. 部署目录约定

生产服务器统一使用以下路径：

| 路径 | 用途 |
| --- | --- |
| `/var/www/alumni-site/app` | 当前运行中的 standalone 应用 |
| `/var/www/alumni-site/app.old` | 上一次版本，用于快速回滚 |
| `/var/www/alumni-site/.env` | 生产环境变量，部署时软链接到 `app/.env` |
| `/var/www/alumni-site/data/prod.db` | 生产 SQLite 数据库 |
| `/var/www/alumni-site/uploads` | 生产上传文件目录，对外映射为 `/uploads/` |
| `/var/www/alumni-site/backups` | 部署前临时备份 |
| `/var/backups/alumni-site` | 定时备份目录 |

`public/uploads/` 不再作为仓库内容提交。应用上传接口会在目录不存在时自动创建，但生产环境仍应提前创建 `/var/www/alumni-site/uploads` 并授予服务用户写权限。

## 2. 环境要求

| 组件 | 建议 |
| --- | --- |
| 服务器 OS | Ubuntu 22.04 LTS / Debian 12 |
| Node.js | 20.x LTS |
| npm | 10.x |
| Nginx | 1.24+ |
| certbot | 2.x |
| SQLite CLI | 用于备份和应急检查 |

推荐生产规格：2 核 CPU、2 GB RAM、20 GB SSD 起步。不要在低内存生产服务器上直接构建 Next.js；应在 WSL/Linux 构建后上传 standalone 包。

## 3. 构建流程

### 3.1 从 Windows 复制到 WSL

在 WSL 终端中执行，复制到 WSL 原生文件系统后再构建：

```bash
rm -rf ~/web_yanchuaner
cp -r "/mnt/c/Users/<你的用户名>/Desktop/web_projects/yanchuaner" ~/web_yanchuaner
cd ~/web_yanchuaner
```

不要在 `/mnt/c/...` 下直接 `npm run build`。Windows 文件系统和 Linux 原生模块、符号链接、I/O 行为不同，容易得到不能在服务器运行的构建产物。

### 3.2 安装依赖并构建

```bash
cd ~/web_yanchuaner

# 删除 Windows 依赖，安装 Linux 原生依赖
rm -rf node_modules
npm ci

# 构建用 .env。不要复制生产 .env 到本地仓库提交。
cat > .env << 'EOF'
NODE_ENV="production"
PORT="3000"
DATABASE_URL="file:./.tmp/build.db"
SESSION_SECRET="build-temp-key-replace-in-production"
APP_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"
SITE_NAME="燕中校友数字母港"
ROOT_ADMIN_EMAIL="yanchuaner@yanchuaner.cn"
EOF

npx tsc --noEmit
npm run lint
npm run audit:prod
mkdir -p .tmp
touch .tmp/build.db
npm run db:migrate:deploy
npm run build
```

这里的 `db:migrate:deploy` 只在一次性构建库 `.tmp/build.db` 上应用已提交 migration，供 ISR 页面在构建期间读取空 schema。`npm run build` 本身只执行 `prisma generate && next build`，不会迁移 schema 或运行 seed。构建环境禁止使用生产 `DATABASE_URL`；seed 也不属于常规构建步骤。

### 3.3 打包部署文件

```bash
cd ~/web_yanchuaner

rm -rf deploy deploy.tar.gz
mkdir -p deploy

cp -a .next/standalone/. deploy/
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma
cp prisma.config.ts deploy/
cp -a scripts deploy/scripts

tar -czf deploy.tar.gz deploy/
ls -lh deploy.tar.gz
```

`public/` 中的 `card.jpg`、`icon.svg`、`leaflet/*` 是公开静态资源。生产上传文件不要随包覆盖，部署后通过 `/var/www/alumni-site/uploads` 持久化。

### 3.4 上传到服务器

```bash
scp deploy.tar.gz root@<服务器IP>:/tmp/
```

如果云厂商安全工具拦截 SCP，可使用控制台 CloudShell 上传，再从 CloudShell 转移到 ECS。

## 4. 服务器初始化

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx sqlite3

sudo mkdir -p /var/www/alumni-site/app
sudo mkdir -p /var/www/alumni-site/data
sudo mkdir -p /var/www/alumni-site/uploads
sudo mkdir -p /var/www/alumni-site/backups
sudo mkdir -p /var/backups/alumni-site

sudo chown -R www-data:www-data /var/www/alumni-site
sudo chown -R www-data:www-data /var/backups/alumni-site
sudo chmod 755 /var/www/alumni-site
sudo chmod 750 /var/www/alumni-site/data /var/www/alumni-site/uploads /var/www/alumni-site/backups
```

生产 `.env` 放在 `/var/www/alumni-site/.env`：

```env
NODE_ENV="production"
PORT="3000"
SITE_URL="https://yanchuaner.cn"
APP_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
DATABASE_URL="file:/var/www/alumni-site/data/prod.db"
SESSION_SECRET="<至少32字符随机串>"
ROOT_ADMIN_EMAIL="yanchuaner@yanchuaner.cn"
RESEND_API_KEY=""
RESEND_FROM_EMAIL="燕中数字母港 <noreply@yanchuaner.cn>"
UPLOAD_DIR="/var/www/alumni-site/uploads"
BACKUP_DIR="/var/backups/alumni-site"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
REDIS_URL=""
```

```bash
sudo chown www-data:www-data /var/www/alumni-site/.env
sudo chmod 640 /var/www/alumni-site/.env
```

### 4.1 首次纳管现有生产库（仅执行一次）

本项目的现有生产库早于 Prisma migration 历史。首次部署包含 `prisma/migrations` 的版本时，不能直接应用 baseline，否则会尝试重复创建现有表。以下流程仅适用于“已有业务表、尚无 `_prisma_migrations` 表”的生产库；全新空库直接执行 `migrate deploy`。

先从生产备份制作受控副本，在本次发布源码目录中演练。不要对仍在提供服务的生产文件做实验：

```bash
mkdir -p .tmp
cp /secure/path/prod-copy.db .tmp/prod-migration-rehearsal.db
export DATABASE_URL="file:./.tmp/prod-migration-rehearsal.db"

npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script \
  --output .tmp/prod-to-current.sql
```

人工审阅 `.tmp/prod-to-current.sql`。对本次首次纳管，它应当只包含 `WechatIdentity` 表、外键和索引的新增。若出现删除表/列、重建既有表或其他非预期差异，立即停止，不得执行 `migrate resolve`。

差异确认后，只在副本上标记 baseline，并应用剩余增量：

```bash
npx prisma migrate resolve --applied 20260710000000_baseline
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --exit-code
```

最后一条 diff 必须以状态码 0 结束，且副本的记录数、唯一约束、登录和后台关键路径检查必须通过。随后在首次生产发布窗口中，完成备份并停止服务，在真实生产库上重新生成 diff：

```bash
export DATABASE_URL="file:/var/www/alumni-site/data/prod.db"
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script \
  --output /tmp/prod-to-current.sql
```

再次人工审阅 `/tmp/prod-to-current.sql`，确认与副本演练的预期增量一致后，才执行：

```bash
npx prisma migrate resolve --applied 20260710000000_baseline
npx prisma migrate deploy
npx prisma migrate status
```

只允许将 `20260710000000_baseline` 标记为已应用；不得手工 resolve `20260710001000_add_wechat_identity` 或后续增量。完成一次性纳管后，所有发布都只运行 `migrate deploy`。

## 5. 发布新版本

每次发布前先备份数据库和上传文件。若这是首次纳管既有生产库，必须先完成 4.1 节的副本演练和生产 baseline 标记。

```bash
ssh root@<服务器IP>

set -e

DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p /var/www/alumni-site/backups
if [ -f /var/www/alumni-site/data/prod.db ]; then
  sqlite3 /var/www/alumni-site/data/prod.db ".backup '/var/www/alumni-site/backups/prod.db.$DATE.pre-deploy'"
fi
if [ -d /var/www/alumni-site/uploads ]; then
  tar -czf /var/www/alumni-site/backups/uploads.$DATE.pre-deploy.tar.gz -C /var/www/alumni-site uploads
fi

systemctl stop alumni-site || true

cd /tmp
rm -rf /tmp/deploy
tar -xzf deploy.tar.gz

rm -rf /var/www/alumni-site/app.old
if [ -d /var/www/alumni-site/app ]; then
  mv /var/www/alumni-site/app /var/www/alumni-site/app.old
fi
mv /tmp/deploy /var/www/alumni-site/app

ln -sfn /var/www/alumni-site/.env /var/www/alumni-site/app/.env
rm -rf /var/www/alumni-site/app/public/uploads
ln -sfn /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

chown -R www-data:www-data /var/www/alumni-site/app /var/www/alumni-site/uploads /var/www/alumni-site/backups

cd /var/www/alumni-site/app
npm install prisma@7.8.0 --omit=dev
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma migrate deploy
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma migrate status

# 历史身份字段仍带“届/班”后缀时执行；已清洗过的环境再次执行也应为 0 改动。
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js --dry-run
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js

systemctl start alumni-site
curl -s http://127.0.0.1:3000/api/health
```

如果生产后台曾通过“校友纪念卡默认背景”上传替换过 `public/card.jpg`，发布新包可能会用仓库内的 `public/card.jpg` 覆盖当前版本。上线前请确认是否需要保留该文件，或上线后重新在后台上传。

## 6. 回滚

```bash
systemctl stop alumni-site
rm -rf /var/www/alumni-site/app.broken
mv /var/www/alumni-site/app /var/www/alumni-site/app.broken
mv /var/www/alumni-site/app.old /var/www/alumni-site/app
systemctl start alumni-site
curl -s http://127.0.0.1:3000/api/health
```

Prisma migration 是前向执行，不要用 `migrate resolve` 伪装回滚。如果 schema 已经写入不兼容变更，需要同时从部署前备份恢复数据库。恢复生产数据库前先停止服务，并保留当前损坏现场备份。

## 7. systemd

创建 `/etc/systemd/system/alumni-site.service`：

```ini
[Unit]
Description=Yanzhong Alumni Site (Next.js Standalone)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/alumni-site/app
EnvironmentFile=/var/www/alumni-site/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/www/alumni-site/data /var/www/alumni-site/uploads /var/www/alumni-site/backups /var/www/alumni-site/app/public
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable alumni-site
sudo systemctl start alumni-site
sudo systemctl status alumni-site
```

## 8. Nginx

创建 `/etc/nginx/sites-available/alumni-site`：

```nginx
server {
    listen 80;
    server_name yanchuaner.cn www.yanchuaner.cn;

    add_header X-Content-Type-Options "nosniff" always;

    location /_next/static/ {
        alias /var/www/alumni-site/app/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/alumni-site/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    location /favicon.ico {
        alias /var/www/alumni-site/app/public/favicon.ico;
    }

    location /icon.svg {
        alias /var/www/alumni-site/app/public/icon.svg;
    }

    location /card.jpg {
        alias /var/www/alumni-site/app/public/card.jpg;
        expires 1h;
    }

    location /leaflet/ {
        alias /var/www/alumni-site/app/public/leaflet/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

启用站点：

```bash
sudo ln -sf /etc/nginx/sites-available/alumni-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

签发 HTTPS：

```bash
sudo certbot --nginx -d yanchuaner.cn -d www.yanchuaner.cn
sudo certbot renew --dry-run
```

HTTPS server 中保留 HSTS 和基础安全头。CSP 当前由 `next.config.mjs` 以 `Content-Security-Policy-Report-Only` 下发，不要在 Nginx 侧重复配置不同 CSP。

## 9. 备份

推荐将 `scripts/backup.sh` 放到服务器并通过 cron 执行。核心逻辑如下：

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/alumni-site"
DB_PATH="/var/www/alumni-site/data/prod.db"
UPLOAD_DIR="/var/www/alumni-site/uploads"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d-%H%M%S)

sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/prod-$DATE.db'"
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

find "$BACKUP_DIR" -name "*.db" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

cron 示例：

```bash
sudo crontab -e
0 2 * * * /var/www/alumni-site/app/scripts/backup.sh >> /var/log/alumni-backup.log 2>&1
```

`backup.sh` 使用 SQLite 在线备份 API，并在落盘后执行 `PRAGMA quick_check` 和 SHA-256 校验。本机 `/var/backups/alumni-site` 仍可能与生产数据位于同一块云盘；正式测试前必须再同步至少一份到独立云盘或对象存储，并定期从该副本执行恢复演练。

## 10. 上线后验证

```bash
curl -s http://127.0.0.1:3000/api/health
curl -I https://yanchuaner.cn
sudo systemctl status alumni-site
sudo journalctl -u alumni-site -n 100 --no-pager
```

如果有管理员测试账号，可在本地或服务器执行：

```bash
SMOKE_BASE_URL=https://yanchuaner.cn \
SMOKE_USERNAME="<管理员用户名>" \
SMOKE_PASSWORD="<管理员密码>" \
npm run smoke
```

没有测试账号时，至少手动验证：

- 首页与 `/about` 可公开访问。
- `/news`、`/events`、`/students`、`/teachers`、`/alumni/*` 未登录时跳转登录。
- 管理员能访问 `/admin`。
- `/api/health` 返回 healthy。
- 后台上传新闻/活动封面后，`/uploads/<文件名>` 可访问。

## 11. 常用命令

```bash
sudo systemctl status alumni-site
sudo systemctl restart alumni-site
sudo journalctl -u alumni-site -f

sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/access.log

sqlite3 /var/www/alumni-site/data/prod.db ".tables"
sqlite3 /var/www/alumni-site/data/prod.db "PRAGMA journal_mode;"

sudo certbot certificates
sudo certbot renew --dry-run
```
