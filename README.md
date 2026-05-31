# 燕中校友数字母港

公益、非官方的深圳市燕川中学校友会数字平台。本仓库包含 Next.js 14 前端、Prisma + SQLite 数据层、HMAC 鉴权与 Sharp 图像处理。

## 30 秒修改凭证

需要修改三项凭证（访问口令 / 管理员账号 / 管理员密码）时：

```bash
# 1. 复制模板（仅首次）
cp credentials.example.json credentials.local.json

# 2. 编辑 credentials.local.json，填入新值；不需要修改的字段可删除该 key
#    （也可直接用 CLI 参数：
#       node scripts/set-credentials.js --access "新口令" \
#                                       --admin-user "新账号" \
#                                       --admin-password "新密码"）

# 3. 执行
node scripts/set-credentials.js

# 4. 重启服务（开发：重新 npm run dev；生产：重启 .next/standalone/server.js）
```

脚本行为：

- **原子写入**：先写 `.env.tmp` 再 rename，避免 `.env` 半写损坏
- **自动备份**：每次修改前生成 `.env.bak.<时间戳>`；回滚命令显示在脚本输出末尾
- **不入库**：`credentials.local.json` 与 `.env.bak.*` 已在 `.gitignore` 中
- **永远不打印明文密码**；密码写入 `.env` 时会被 SHA-256 哈希

## 本地预览

```bash
npm install
cp .env.example .env  # 然后填入 SESSION_SECRET 等基础项
node scripts/set-credentials.js  # 设置初始凭证（同上）
npm run build
node .next/standalone/server.js   # 默认 :3000
```

或直接：

```bash
npm run dev  # http://localhost:3000
```

## 主要文档

- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — 项目结构与模块概览
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — 后台使用
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) — 部署
- [docs/BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md) — 备份与恢复
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — 常见问题
