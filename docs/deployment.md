# 🚢 部署流水线指南 · Deployment

> **燕中校友数字母港 V2.0** 云端自动化 CI/CD 部署指南  
> 涵盖 Standalone 构建、systemd 服务化、Nginx 反向代理、SSL 证书与数据库备份策略

---

## 目录

- [1. 部署架构概览](#1-部署架构概览)
- [2. 环境要求](#2-环境要求)
- [3. 构建流程（Windows → WSL → 服务器）](#3-构建流程windows-开发--wsl-构建--服务器部署)
  - [3.1 从 Windows 复制项目到 WSL](#31-第一阶段从-windows-复制项目到-wsl)
  - [3.2 WSL 内安装依赖并构建](#32-第二阶段wsl-内安装依赖并构建)
  - [3.3 打包](#33-第三阶段打包)
  - [3.4 上传到服务器](#34-第四阶段上传到服务器)
  - [3.5 服务器上部署](#35-第五阶段服务器上部署)
- [4. 服务器初始化](#4-服务器初始化)
- [5. systemd 服务化](#5-systemd-服务化)
- [6. Nginx 反向代理](#6-nginx-反向代理)
- [7. SSL 证书 (Let's Encrypt)](#7-ssl-证书-lets-encrypt)
- [8. 数据库备份策略](#8-数据库备份策略)
- [9. 简易 CI/CD (Git Hooks)](#9-简易-cicd-git-hooks)
- [10. Docker 构建（可选）](#10-docker-构建可选)
- [11. 常用运维命令](#11-常用运维命令)

---

## 1. 部署架构概览

```
互联网 (HTTPS :443)
    │
    ▼
┌──────────────────────────────┐
│  Nginx                       │
│  ├── SSL Termination         │
│  ├── Static Assets Proxy     │
│  │   /_next/static/*         │
│  │   /uploads/*              │
│  └── Reverse Proxy           │
│      └── http://127.0.0.1:3000
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  systemd: alumni-site        │
│  ├── next start -H 0.0.0.0  │
│  ├── WorkingDirectory       │
│  │   /var/www/alumni-site   │
│  └── Restart=always          │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  SQLite DB                   │
│  /var/www/alumni-site/data/  │
│  prod.db (WAL mode)          │
└──────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Cron: backup.sh             │
│  每日 02:00 冷备份           │
│  /var/backups/alumni-site/   │
└──────────────────────────────┘
```

---

## 2. 环境要求

| 组件 | 最低版本 | 说明 |
|------|----------|------|
| **服务器 OS** | Ubuntu 22.04 LTS / Debian 12 | Linux x64 |
| **Node.js** | 20.x LTS | 构建与运行 |
| **npm** | 10.x | 包管理 |
| **Nginx** | 1.24+ | 反向代理 + 静态资源 |
| **certbot** | 2.x | Let's Encrypt SSL 证书 |
| **Git** | 2.x | 代码拉取 |

### 推荐硬件

| 环境 | CPU | RAM | 磁盘 |
|------|-----|-----|------|
| 生产 | 2 核 | 2 GB | 20 GB SSD |
| 开发 | 任意 | 任意 | 任意 |

> 💡 **为什么只需要 2GB 内存？** Standalone 编译输出是自包含的 Node.js 应用，SQLite 单文件数据库，无额外服务进程。

---

## 3. 构建流程（Windows 开发 → WSL 构建 → 服务器部署）

本项目的实际开发环境为 **Windows + VS Code**，但 Next.js Standalone 构建**必须在 WSL / Linux 中完成**。以下是完整的四阶段链路。

> ⚠️ **为什么不能直接在 Windows 上 `npm run build`？**  
> Standalone 输出依赖 Unix 符号链接和原生二进制（`better-sqlite3`、`sharp`、`@next/swc`），Windows 构建产物在上传服务器后无法运行。

### 3.1 第一阶段：从 Windows 复制项目到 WSL

```bash
# 在 WSL 终端中执行（首次或每次构建前都要做）

# 1. 复制整个项目目录到 WSL 原生文件系统
rm -rf ~/web_yanchuaner
cp -r "/mnt/c/Users/<你的用户名>/Desktop/web_projects/web_yanchuaner" ~/web_yanchuaner
cd ~/web_yanchuaner
```

> ⚠️ **为什么不能直接在 `/mnt/c/...`（Windows 目录）里构建？**  
> WSL 跨文件系统操作（Windows ↔ ext4）会导致符号链接创建失败和 I/O 性能暴跌，`next build` 在跨文件系统目录下会报错或构建不完整。**必须复制到 WSL 原生目录（`~/`）再构建。**

### 3.2 第二阶段：WSL 内安装依赖并构建

```bash
cd ~/web_yanchuaner

# 2. 修复权限（Windows cp 过来的文件默认只读）
chmod -R u+w prisma/

# 3. 删除 Windows 的 node_modules（原生模块不兼容）
rm -rf node_modules
npm install --registry=https://registry.npmmirror.com

# 4. 配置构建环境变量（仅用于构建时的数据库初始化，不是生产 .env）
cat > .env << 'ENDOFFILE'
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="build-temp-key-not-used-in-production"
APP_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"
SITE_NAME="燕中校友数字母港"
ENDOFFILE

# 5. 一站式构建（生成 Prisma Client → 建表 → 种子数据 → 编译）
npx prisma generate
npm run build
```

> ⚠️ **绝对不能跳过第 3 步**。Windows 的 `better-sqlite3`、`sharp`、`@next/swc` 是 `.dll` 原生二进制，在 Linux 下会报 `invalid ELF header`。必须删掉 `node_modules` 用 Linux 版重装。

构建成功后会输出：

```text
.next/standalone/        # 自包含运行目录（无需 node_modules）
.next/static/            # 静态资源（CSS / JS / chunks）
public/                  # 上传文件 / 图标等
prisma/                  # Schema + 种子数据源
```

### 3.3 第三阶段：打包

```bash
cd ~/web_yanchuaner

# 6. 删掉旧包（tar 不会覆盖已有文件）
rm -rf deploy deploy.tar.gz
mkdir -p deploy

# 7. 拷贝部署所需文件
cp -a .next/standalone/. deploy/
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma
cp prisma.config.ts deploy/
cp -a scripts deploy/scripts

# 8. 打包
tar -czf deploy.tar.gz deploy/
ls -lh deploy.tar.gz   # 确认大小（通常 50~150MB）
```

### 3.4 第四阶段：上传到服务器

```bash
# 方式一：SCP 直传（推荐）
scp deploy.tar.gz root@<服务器IP>:/tmp/

# 方式二：华为云 ECS → 浏览器 CloudShell 上传
# 先把 deploy.tar.gz 从 WSL 复制到 Windows 桌面：
cp ~/web_yanchuaner/deploy.tar.gz "/mnt/c/Users/<你的用户名>/Desktop/"
# 然后浏览器打开华为云控制台 → ECS → 远程登录 → CloudShell → 上传文件
# 再从 CloudShell scp 到 ECS 本身（如果 CloudShell 和 ECS 在不同节点）
```

### 3.5 第五阶段：服务器上部署

```bash
# SSH 进服务器
ssh root@<服务器IP>

# === 备份数据库（必须！！） ===
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy

# === 停止服务 ===
systemctl stop alumni-site

# === 解压新包 ===
cd /tmp
rm -rf /tmp/deploy
tar -xzf deploy.tar.gz

# === 替换旧版本 ===
rm -rf /var/www/alumni-site/app.old
mv /var/www/alumni-site/app /var/www/alumni-site/app.old   # 保留旧版本用于快速回滚
mv /tmp/deploy /var/www/alumni-site/app

# === 链接生产环境变量（不要覆盖线上 .env！） ===
ln -sf /var/www/alumni-site/.env /var/www/alumni-site/app/.env
rm -rf /var/www/alumni-site/app/public/uploads
ln -s /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

# === 修复上传目录循环链接 ===
rm -f /var/www/alumni-site/uploads/uploads

# === 安装 Prisma CLI（Standalone 包里不含此模块） ===
cd /var/www/alumni-site/app
npm install prisma@7.8.0

# === 同步数据库 Schema ===
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push

# === 清洗历史身份字段（PR #23 后执行一次） ===
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js --dry-run
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js

# === 启动服务 ===
systemctl start alumni-site

# === 验证 ===
curl -s http://localhost:3000/api/health
# 期望输出：{"status":"healthy"}
```

> 💡 **回滚操作**（如果新版本有问题）：
> ```bash
> systemctl stop alumni-site
> mv /var/www/alumni-site/app /var/www/alumni-site/app.broken
> mv /var/www/alumni-site/app.old /var/www/alumni-site/app
> systemctl start alumni-site
> ```

---

## 4. 服务器初始化

### 4.1 安装 Node.js 20.x

```bash
# 使用 NodeSource 官方仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 4.2 创建目录结构

```bash
sudo mkdir -p /var/www/alumni-site/data/uploads
sudo mkdir -p /var/www/alumni-site/data/backups
sudo mkdir -p /var/backups/alumni-site

# 设置权限
sudo chown -R www-data:www-data /var/www/alumni-site
sudo chmod 755 /var/www/alumni-site/data
```

### 4.3 安装 Nginx

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 5. systemd 服务化

### 创建服务文件

```bash
sudo vim /etc/systemd/system/alumni-site.service
```

```ini
[Unit]
Description=Yanzhong Alumni Site (Next.js Standalone)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/alumni-site/.next/standalone
EnvironmentFile=/var/www/alumni-site/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

# 安全加固
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/www/alumni-site/data
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

### 启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable alumni-site
sudo systemctl start alumni-site

# 检查状态
sudo systemctl status alumni-site
sudo journalctl -u alumni-site -f   # 实时日志
```

---

## 6. Nginx 反向代理

### 站点配置

```bash
sudo vim /etc/nginx/sites-available/alumni-site
```

```nginx
server {
    listen 80;
    server_name yanchuaner.cn www.yanchuaner.cn;

    add_header X-Content-Type-Options "nosniff" always;

    # 静态资源直读（绕过 Node.js）
    location /_next/static/ {
        alias /var/www/alumni-site/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/alumni-site/public/uploads/;
        expires 7d;
    }

    location /favicon.ico {
        alias /var/www/alumni-site/public/favicon.ico;
    }

    # 其余请求代理到 Next.js
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

    # 上传大小限制
    client_max_body_size 10M;
}
```

### 启用站点

```bash
sudo ln -sf /etc/nginx/sites-available/alumni-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # 移除默认站点
sudo nginx -t                                  # 测试配置
sudo systemctl reload nginx
```

> CSP 当前由 `next.config.mjs` 以 `Content-Security-Policy-Report-Only` 管理。不要在 Nginx 代理层重复下发不同 CSP，避免排查时出现多份策略互相干扰。

### HTTPS 安全响应头

certbot 签发证书并生成/改写 443 server 后，在 HTTPS server 中保留 HSTS 和基础安全头：

```nginx
server {
    listen 443 ssl http2;
    server_name yanchuaner.cn www.yanchuaner.cn;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 其余 SSL、静态资源和 proxy_pass 配置沿用 certbot / 上方站点配置
}
```

---

## 7. SSL 证书 (Let's Encrypt)

### 安装 certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 获取证书

```bash
# 确保域名 DNS 已指向服务器 IP
sudo certbot --nginx -d yanchuaner.cn -d www.yanchuaner.cn

# 按提示输入邮箱，同意服务条款
```

### 自动续期

```bash
# certbot 会自动添加 systemd timer
sudo systemctl status certbot.timer

# 手动测试续期
sudo certbot renew --dry-run
```

Let's Encrypt 证书有效期 90 天，certbot 会在到期前自动续期。

---

## 8. 数据库备份策略

### 备份脚本

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/var/backups/alumni-site"
DB_PATH="/var/www/alumni-site/data/prod.db"
UPLOAD_DIR="/var/www/alumni-site/data/uploads"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d-%H%M%S)

# 数据库备份（SQLite 支持在线备份）
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/prod-$DATE.db'"

# 上传文件备份
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

# 清理旧备份
find "$BACKUP_DIR" -name "*.db" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup complete: prod-$DATE.db, uploads-$DATE.tar.gz"
```

### Cron 定时任务

```bash
# 编辑 crontab
sudo crontab -e

# 每天凌晨 2:00 执行备份
0 2 * * * /var/www/alumni-site/scripts/backup.sh >> /var/log/alumni-backup.log 2>&1
```

---

## 9. 简易 CI/CD (Git Hooks)

### 服务端接收钩子

```bash
# 在服务器上创建裸仓库
sudo mkdir -p /var/git/alumni-site.git
cd /var/git/alumni-site.git
sudo git init --bare
```

### post-receive Hook

```bash
sudo vim /var/git/alumni-site.git/hooks/post-receive
```

```bash
#!/bin/bash
# Git push 后自动部署

set -e

DEPLOY_DIR="/var/www/alumni-site"
WORK_TREE="/tmp/alumni-build-$(date +%s)"

echo "🚀 开始部署..."

# 1. Checkout 到临时目录
git --work-tree="$WORK_TREE" checkout -f main

# 2. 安装依赖并构建
cd "$WORK_TREE"
npm ci --production=false
cp "$DEPLOY_DIR/.env" .env    # 使用服务器上的 .env
npm run build

# 3. 备份当前版本
cp "$DEPLOY_DIR/data/prod.db" "/var/backups/alumni-site/pre-deploy-$(date +%Y%m%d-%H%M%S).db"

# 4. 切换版本
rm -rf "$DEPLOY_DIR/.next"
cp -r .next "$DEPLOY_DIR/"

# 5. 重启服务
sudo systemctl restart alumni-site

# 6. 清理
rm -rf "$WORK_TREE"

echo "✅ 部署完成！"
```

```bash
sudo chmod +x /var/git/alumni-site.git/hooks/post-receive
```

### 本地推送部署

```bash
# 在本地开发机
git remote add deploy ssh://user@yanchuaner.cn/var/git/alumni-site.git
git push deploy main
```

---

## 10. Docker 构建（可选）

### Dockerfile (多阶段构建)

```dockerfile
# Stage 1: 构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: 运行
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma/data ./prisma/data

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data          # SQLite 数据库持久化
      - ./public/uploads:/app/public/uploads
    restart: unless-stopped
```

```bash
docker compose up -d --build
```

---

## 11. 常用运维命令

```bash
# 服务管理
sudo systemctl status alumni-site     # 查看服务状态
sudo systemctl restart alumni-site    # 重启服务
sudo systemctl stop alumni-site       # 停止服务
sudo journalctl -u alumni-site -f     # 实时日志

# Nginx
sudo nginx -t                         # 测试配置
sudo systemctl reload nginx           # 重载配置（零停机）
sudo tail -f /var/log/nginx/access.log  # 访问日志

# 数据库
sqlite3 /var/www/alumni-site/data/prod.db  # 直接连接
sqlite3 /var/www/alumni-site/data/prod.db ".tables"  # 列出所有表
sqlite3 /var/www/alumni-site/data/prod.db "SELECT count(*) FROM User;"  # 用户数

# 备份
sudo /var/www/alumni-site/scripts/backup.sh           # 手动备份
ls -lh /var/backups/alumni-site/                      # 查看备份文件

# SSL
sudo certbot certificates                              # 查看证书状态
sudo certbot renew --dry-run                           # 测试续期
```

---

## 故障排查速查表

| 症状 | 检查步骤 |
|------|----------|
| 502 Bad Gateway | `systemctl status alumni-site` → 查看是否 crash |
| 首页加载慢 | 检查 SQLite WAL 是否生效：`PRAGMA journal_mode;` |
| SQLITE_BUSY | 检查 `busy_timeout` 设置 | 
| 上传失败 | 检查 Nginx `client_max_body_size` 和 `UPLOAD_DIR` 权限 |
| 登录失败 | 检查 `SESSION_SECRET` 是否与构建时一致 |
| SSL 过期 | `sudo certbot renew` |

---

<p align="center">
  <sub>Deployment Guide · V2.0 · Last updated: June 2026</sub>
</p>
