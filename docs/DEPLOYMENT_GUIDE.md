# 部署与运维指南

## 部署原则

- **Windows 写代码**：本地开发在 Windows 上进行。
- **WSL/Linux 构建**：`next build` 在 WSL 或 Linux 中执行，Windows 下 `next build` 不完全兼容。
- **云服务器只运行**：服务器运行构建产物，不直接编辑业务代码。

> 项目使用 `output: "standalone"`，不能使用 `output: "export"`。因为项目包含 API 路由、SQLite 数据库、文件上传、登录认证等需要服务端运行的功能，静态导出无法支持。

---

## WSL 构建流程

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖
npm ci

# 3. 生成 Prisma Client
npx prisma generate

# 4. 代码检查
npm run lint

# 5. 构建
npm run build

# 6. 部署目录准备
rm -rf deploy
mkdir -p deploy

# 7. 复制 standalone 产物
cp -a .next/standalone/. deploy/

# 8. 复制静态资源
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma
```

---

## 部署目录结构

构建完成后，`deploy/` 目录应包含：

```
deploy/
├── server.js              # Next.js standalone 入口
├── .next/
│   ├── BUILD_ID
│   ├── server/            # 服务端代码
│   └── static/            # 静态资源
├── public/                # 公共资源
└── prisma/                # Prisma schema（用于 db push）
```

### 不应包含的内容

- `.env`（服务器上有独立配置）
- `dev.db`、`prod.db`（数据库在 data 目录）
- `.git`
- `.next/cache`
- `node_modules/`（standalone 已包含必要依赖）
- `public/uploads/`（上传文件在单独目录）
- `.claude/`

---

## 服务器目录结构

```
/var/www/alumni-site/
├── app/                   # 部署代码（server.js + .next + public）
├── data/                  # 数据库
│   └── prod.db            # 生产数据库
├── uploads/               # 用户上传文件
└── backups/               # 备份
```

---

## systemd 服务

服务名：`alumni-site`

### 服务配置

```ini
[Unit]
Description=Alumni Site
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/alumni-site/app
EnvironmentFile=/var/www/alumni-site/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 监听端口

- 应用监听：`127.0.0.1:3010`（不直接对外暴露）

### 常用命令

```bash
sudo systemctl status alumni-site    # 查看状态
sudo systemctl restart alumni-site   # 重启
sudo systemctl stop alumni-site      # 停止
sudo systemctl start alumni-site     # 启动
sudo journalctl -u alumni-site -f    # 查看日志
```

---

## Nginx 配置

```nginx
server {
    listen 80;
    server_name yanchuaner.cn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yanchuaner.cn;

    ssl_certificate     /etc/letsencrypt/live/yanchuaner.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanchuaner.cn/privkey.pem;

    # 上传文件代理
    location /uploads/ {
        alias /var/www/alumni-site/uploads/;
    }

    # 应用代理
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## HTTPS（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书（自动配置 Nginx）
sudo certbot --nginx -d yanchuaner.cn

# 证书自动续期（默认已配置 systemd timer）
sudo certbot renew --dry-run
```

---

## 部署步骤

每次部署前：

1. **备份生产数据库**

   ```bash
   cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)
   ```

2. **构建**（在 WSL/Linux 中执行上述构建流程）

3. **上传构建产物到服务器**（scp / rsync）

4. **部署到生产目录**

   ```bash
   # 停止服务
   sudo systemctl stop alumni-site

   # 备份当前版本
   mv /var/www/alumni-site/app /var/www/alumni-site/app.old

   # 部署新版本
   mv deploy /var/www/alumni-site/app

   # 确保 .env 存在且配置正确
   # .env 不被覆盖，手动确认

   # 确保 uploads 目录连接或存在
   ln -sf /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

   # 同步数据库结构（如果 Prisma schema 有变更）
   cd /var/www/alumni-site/app && npx prisma db push

   # 启动服务
   sudo systemctl start alumni-site

   # 检查状态
   sudo systemctl status alumni-site
   ```

5. **验证**：访问 `https://yanchuaner.cn` 确认正常运行。

---

## Prisma Schema 变更流程

如果 Prisma schema 有变更：

1. **先备份生产数据库**（参见上文）。
2. 在本地修改 schema，生成迁移。
3. 构建后部署到服务器。
4. 在服务器上执行 `npx prisma db push` 同步数据库结构。
5. **不要执行 `prisma reset`**，这会清空所有数据。
6. 验证数据完整性。

---

## 关键注意事项

- 上线后**严禁用本地 dev.db 覆盖线上 prod.db**。
- 不要在服务器上直接编辑业务代码或 `prisma/schema.prisma`。
- 部署前务必备份数据库。
- 上传目录（`uploads/`）在部署时不要覆盖。
- `.env` 文件在每个环境下独立配置，不随代码部署。
- 构建和部署必须在 WSL/Linux 中执行。
