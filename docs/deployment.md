# 🚢 部署流水线指南 · Deployment

> **燕中校友数字母港 V2.0** 云端自动化 CI/CD 部署指南  
> 涵盖 Standalone 构建、systemd 服务化、Nginx 反向代理、SSL 证书与数据库备份策略

---

## 目录

- [1. 部署架构概览](#1-部署架构概览)
- [2. 环境要求](#2-环境要求)
- [3. 本地构建流程](#3-本地构建流程)
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

## 3. 本地构建流程

> ⚠️ **关键：必须在 WSL 或 Linux 环境中构建**（Next.js Standalone 输出依赖 Unix 构建环境）

### 3.1 初次构建

```bash
# 1. 克隆仓库
git clone https://github.com/yanchuaner/web_yanchuaner.git
cd web_yanchuaner

# 2. 安装依赖
npm ci

# 3. 配置环境变量
cp .env.example .env
vim .env  # 编辑生产环境变量（见下方模板）

# 4. 一站式构建（生成→建表→播种→编译）
npm run build
```

### 3.2 生产环境 `.env` 模板

```bash
# 数据库
DATABASE_URL="file:/var/www/alumni-site/data/prod.db"

# 安全密钥（⚠️ 生产环境务必使用随机生成的强密钥）
SESSION_SECRET="$(openssl rand -hex 32)"
ACCESS_PASSWORD_HASH="<sha256 hash of your access password>"

# 管理员
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="<sha256 hash of your admin password>"

# 站点
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"

# 上传
UPLOAD_DIR="/var/www/alumni-site/data/uploads"

# 邮件 (Resend)
RESEND_API_KEY="re_......"
RESEND_FROM_EMAIL="noreply@yanchuaner.cn"

# 可选：Redis 限流
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 3.3 构建产物

```bash
# npm run build 执行流程：
prisma generate          # → node_modules/.prisma/client/
prisma db push           # → SQLite 建表 / 迁移
prisma db seed           # → 种子数据注入（幂等）
next build               # → .next/standalone/

# 产物目录
.next/standalone/        # ← 自包含运行目录（无需 node_modules）
.next/static/            # ← 静态资源（CSS/JS/chunks）
public/                  # ← 上传文件 / 图标等
```

### 3.4 打包上传

```bash
# 在 WSL 中打包
tar -czf deploy.tar.gz \
  .next/standalone/ \
  .next/static/ \
  public/ \
  prisma/data/ \
  .env

# 上传到服务器
scp deploy.tar.gz user@yanchuaner.cn:/tmp/

# 在服务器上解压
ssh user@yanchuaner.cn
sudo mkdir -p /var/www/alumni-site
sudo tar -xzf /tmp/deploy.tar.gz -C /var/www/alumni-site/
```

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
  <sub>Deployment Guide · V2.0 · Last updated: June 2025</sub>
</p>
