# 故障排除

本文档记录项目开发与运维中实际遇到的问题及修复方案。按分类编排，方便快速定位。已针对 V2.0 全面升级。

---

## 构建问题

### 1. UTF-8 编码导致构建失败

**现象**：
- `npm run build` 失败
- 错误信息包含 `stream did not contain valid UTF-8`

**原因**：新建或复制的 TS/TSX 文件中混入了非 UTF-8 字节（如 GBK 编码的中文文件）

**修复**：
1. 确认文件编码为 UTF-8：`file src/app/xxx/page.tsx`
2. 将异常文件重写为 UTF-8 编码
3. 重新执行 `npm run build`

### 2. 构建卡死 / 长时间无输出

**现象**：`npm run build` 停在某个阶段不动，终端没有报错但也不结束

**常见原因**：
- 有正在运行的 `node server.js` 或 `next start` 进程占用端口
- `.next/standalone/` 正被运行中的服务读取，新构建无法落盘
- 内存不足导致构建缓慢

**处理步骤**：
1. 检查是否有旧服务占用端口：`lsof -i :3000` 或 `netstat -tlnp | grep 3000`
2. 停止正在运行的 Node 服务后重试
3. 删除 `.next` 目录后重新构建
4. 内存不足时可增大 Node 内存限制：`NODE_OPTIONS=--max_old_space_size=4096 npm run build`
5. 逐步排查：先执行 `npx tsc --noEmit` 验证类型，再构建

**经验规则**：
- 构建完全无输出超过 5 分钟时，先停服务再重试，不要无限等待
- 构建和服务尽量错峰执行，避免同一目录同时读写

### 3. webpack_modules 残留冲突

**现象**：运行时 `webpack_modules` 相关报错，可能伴随 `moduleId is not a function`

**原因**：`.next` 构建产物与当前代码版本不匹配

**修复**：
1. 删除 `.next` 目录
2. 删除 `node_modules/.cache`（如果存在）
3. 重新 `npm run dev` 或 `npm run build`

### 4. `useSearchParams` bailout — 全局客户端组件导致页面预渲染失败

**现象**：
```
useSearchParams() should be wrapped in a suspense boundary at page "/admin/xxx"
Export encountered errors on following paths:
    /admin/page: /admin
    /admin/news/page: /admin/news
    ...
```

**原因**：全局根 `layout.tsx` 或跨页面共享组件中直接使用了 `useSearchParams()`、`usePathname()` 等客户端 hook。Next.js 构建时会对页面做预渲染，遍历整棵组件树时遇到缺少 `<Suspense>` 边界的客户端 hook，可能导致多个页面 bail out。

**修复**：优先把该逻辑移出全局 layout，或改成页面局部客户端组件；确实需要全局存在时，用 `<Suspense fallback={null}>` 包裹对应组件，并确认它默认不影响 SSR 输出。

### 5. `'use client'` 必须在 `export const dynamic` 之前

**现象**：
```
The "use client" directive must be placed before other expressions.
Move it to the top of the file to resolve this issue.
```

**原因**：Next.js 编译器要求 `'use client'` 指令必须是文件的第一个语句。`export const dynamic = 'force-dynamic'` 是表达式，写在 `'use client'` 前面会触发此错误。

**修复**：将两行顺序对调——`'use client'` 放在第一行，`export const dynamic = 'force-dynamic'` 放在第二行。

### 6. `export const dynamic` 不会从 layout 继承给子页面

**注意**：在 `admin/layout.tsx` 中声明 `export const dynamic = 'force-dynamic'` **只影响 layout 组件本身**，不会自动让所有子页面跳过静态预渲染。子页面的预渲染行为是独立的。如果子页面的组件树中包含 `useSearchParams` 等 CSR hook 且没有 `<Suspense>` 边界，仍会报错。正确做法是定位并修复**根因组件**（如添加 `<Suspense>` 包裹），而不是逐个给每个 page 加 `force-dynamic`。

---

## 运行时问题

### 7. SSR 水合冲突（页面白屏）

**现象**：页面报 500 错误，控制台出现 hydration 相关错误信息

**常见场景**：模态框组件、客户端交互组件在 SSR 和客户端渲染阶段不一致

**修复方式一（添加 mounted 状态）**：
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

**修复方式二（跳过 SSR）**：
```tsx
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./Component'), { ssr: false });
```

### 8. Tailwind 样式失效（页面纯文字）

**现象**：页面无样式，纯文字显示

**原因**：
- `tailwind.config.ts` 中 `content` 配置未覆盖所有源码目录
- 或编译中间产物导致 CSS 丢失

**修复**：
1. 确认 `tailwind.config.ts` 的 `content` 至少包含：
   ```ts
   content: [
     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
   ]
   ```
2. 确认 `postcss.config.mjs` 包含 `tailwindcss` 和 `autoprefixer`
3. 清缓存并重新构建

### 9. 静态资源 404（/_next/static/... 丢失）

**现象**：`/_next/static/...` 返回 404，页面样式或 JS 加载失败

**原因**：
- 多个 Node/Next 进程同时运行，端口或资源冲突
- 前次构建产物与当前运行环境不一致

**修复**：
1. 终止所有 Node 进程：`killall -9 node`（Linux）/ 任务管理器结束 node.exe（Windows）
2. 删除 `.next` 和 `node_modules/.cache`
3. 重新启动开发服务器
4. 浏览器强制刷新（Ctrl+Shift+R）

### 10. SQLITE_BUSY 错误（V2.0）

**现象**：写入操作报错 `SQLITE_BUSY: database is locked`

**V2.0 已有的防护**：
项目在 `src/lib/db.ts` 中已配置三重 PRAGMA 防护：
- `journal_mode = WAL`：读写互不阻塞，写入在 WAL 文件中进行不阻塞并发读取
- `synchronous = NORMAL`：在关键时刻 fsync，而非每次写入都同步
- `busy_timeout = 5000`：遇到锁定时最多等待 5 秒，不立即报错

**如果仍然出现**：
1. 等待当前操作完成后重试（最多等待 `busy_timeout` 即 5 秒）
2. 检查是否有异常长时间的事务未提交（如 CSV 导入卡在中途）
3. 重启服务：`sudo systemctl restart alumni-site`
4. 确认代码中的大写入操作使用了 `prisma.$transaction()` 事务批处理——CSV 导入和故事审核均已实现

**预防措施**：
- 后台批量操作（CSV 导入、数据迁移）避开访问高峰
- 大数据量导入建议分批执行，每批不超过 500 行
- 不要手动在 `sqlite3` CLI 中开启长事务

### 11. Payload Too Large（413 错误）（V2.0 新增）

**现象**：API 调用返回 `413 Payload Too Large` 或 `请求体过大`

**原因**：V2.0 所有 API 端点通过 `readJsonBody<T>(req, maxBytes)` 精确限制请求体大小，防止内存耗尽攻击。超过上限时立即抛出 `PAYLOAD_TOO_LARGE` 错误。

**各端点限制**：

| maxBytes | 端点 | 原因 |
|----------|------|------|
| 4096 | 登录、注册、验证邮箱、忘记密码、邮箱重发、用户操作 | 仅含字段名和简短值 |
| 16384 (16KB) | 管理类写入（新闻、活动、故事、内容、审核、教师） | 含富文本内容 |
| 524288 (512KB) | 站内故事投稿（`/api/stories`、`/api/admin/stories`） | 长文投稿 |

**修复**：
- 如果是长文投稿超限，将超大稿件拆分为多个部分，或在后台直接发布
- 如果是管理端点超限，检查上传内容是否包含不必要的 base64 数据（如图片内联在 JSON 中），改用文件上传接口
- 如果需要调整限制，修改对应 API 路由中 `readJsonBody` 的 `maxBytes` 参数

### 12. Rate Limit 限流（429 错误）（V2.0 新增）

**现象**：API 返回 `429 Too Many Requests`，响应头包含 `Retry-After`

**原因**：触发了 V2.0 三级限流系统的任一层的拒绝。

**三级限流架构**：
```
请求 → Upstash Redis（生产推荐，滑动窗口）
        ↓ 不可用/异常
      ioredis（legacy Redis，固定窗口）
        ↓ 不可用/异常
      内存 Map（单进程，重启清零）
```

**限流规则**：

| 限流器 | 规则 | 适用范围 |
|--------|------|---------|
| `authLimiter` | 5 次/分钟/IP | 登录、注册接口 |
| `emailLimiter`（分钟） | 1 次/分钟/邮箱 | 邮件发送频率控制 |
| `emailLimiter`（天） | 10 次/天/邮箱 | 邮件日总量控制 |

**排查步骤**：
1. **检查 Redis 连通性**：
   ```bash
   # 测试 Upstash Redis 连通性
   curl -s "$UPSTASH_REDIS_REST_URL/ping" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```
2. **确认环境变量**：检查 `.env` 中 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 是否正确设置
3. **查看服务端日志**：Redis 连接失败会记录 `console.error`，但不影响限流功能（自动降级）
4. **确认降级行为**：如果 Redis 完全不可用，限流降级到内存 Map，此时限流数据在进程重启后清零，多进程间不共享
5. **等待恢复**：限流窗口到期后自动恢复（认证 1 分钟，邮件 1 分钟 / 24 小时）

**生产建议**：务必配置 Upstash Redis 或自建 Redis。内存限流在单进程环境下工作正常，但多实例部署时各实例独立计数，可能导致限流不一致。

### 13. 图片上传失败

**现象**：后台上传图片时报错或无响应

**排查步骤**：
1. 检查上传目录权限：
   ```bash
   ls -la /var/www/alumni-site/uploads/
   # 确保 www-data 用户有写入权限
   ```
2. 检查磁盘空间：`df -h`
3. 检查 Nginx 上传大小限制（`client_max_body_size`）
4. 检查 `next.config.mjs` 中的 `serverActions.bodySizeLimit` 是否足够

---

## 认证问题

### 14. 登录后反复跳回登录页

**可能原因**：
- Cookie 已过期或被清除
- `SESSION_SECRET` 环境变量与签发 token 时不一致
- 浏览器阻止了第三方 cookie

**排查**：
1. 检查浏览器开发者工具 → Application → Cookies → 确认 `yc_access_token` 存在
2. 检查 `.env` 中 `SESSION_SECRET` 是否与上次启动时一致
3. 清除浏览器所有 cookie 后重新登录

### 15. API 返回 401 Unauthorized

**排查**：
1. 确认当前已登录（浏览器开发者工具 → Application → Cookies → 确认 `yc_access_token` 存在）
2. 检查 cookie 是否过期（重新登录看是否恢复）
3. 如果是管理员 API（`/api/admin/*`），确认当前登录的是管理员账号而非普通用户账号
4. 查看服务端日志确认具体拒绝原因

---

## 数据问题

### 16. CSV 导入失败（V2.0 新增）

**现象**：后台导入 CSV 时报错或无任何数据导入

**常见原因与修复**：

| 现象 | 原因 | 修复 |
|------|------|------|
| "CSV 缺少必需的列：姓名 (name)" | 表头缺少"姓名"或"name"列 | 确保 CSV 第一行为表头，包含"姓名"或"name"列 |
| "文件过大，请保持在 2MB 以内" | CSV 超过 2MB 上限 | 拆分 CSV 为多个小文件分批导入 |
| 导入后中文乱码 / 解析失败 | 文件编码不是 UTF-8 | 用 VS Code 另存为"UTF-8"（不带 BOM） |
| 城市不显示在地图上 | 城市名不在 `cityCoordinates.ts` 映射表中 | 检查 `src/data/cityCoordinates.ts`，补充缺失城市的经纬度 |
| 城市名末尾带"市" | CSV 中写成了"北京市" | 系统会自动去除"市"后缀，无需手动处理 |

**导入流程说明**：
- `prisma.$transaction()` 事务批处理，所有行在一个事务中写入
- 按 `姓名 + 届别 + 班级 + 邮箱` 四字段去重（完全匹配时更新，不新增重复）
- 错误行上限 20 行（超过后跳过剩余行，防止长时间阻塞）
- 行级校验：姓名字段必填、邮箱格式校验、字段长度限制

### 17. 故事审核不生效（V2.0 新增）

**现象**：后台审核故事后状态未更新或前端看不到变化

**排查步骤**：
1. **确认故事当前状态为 PENDING**：只有 `PENDING` 状态的故事才能被审核转为 `PUBLISHED` 或 `REJECTED`。已发布或已驳回的故事无法再次审核
2. **确认管理员权限**：审核接口要求 `role === 'ADMIN'`，普通校友角色调用返回 403 Forbidden
3. **检查审计日志**：审核操作在 `prisma.$transaction()` 中原子执行——状态更新（`tx.story.update`）和审计日志创建（`tx.auditLog.create`）同时成功或同时失败回滚。如果 `AuditLog` 表不存在，整个事务回滚不会生效
4. **查看服务端日志**：搜索 `Admin story review PATCH error`
5. **检查请求体大小**：审核接口限制 16KB（`readJsonBody(req, 16384)`），过大的请求体会被拦截

### 18. 校友地图不显示信息（V2.0 新增）

**现象**：地图组件加载正常，但看不到校友分布标记

**排查步骤**：

1. **检查 city 字段是否填充**：
   ```sql
   -- 查询无城市信息的校友数量
   SELECT COUNT(*) FROM WhitelistRoster WHERE city IS NULL AND (tags IS NULL OR tags = '');
   ```
   地图数据 API（`/api/alumni/map`）优先读取 `city` 独立字段，为空时回退到 `tags` 解析。

2. **检查 cityCoordinates 映射**：`src/data/cityCoordinates.ts` 中是否有对应城市的经纬度。不在映射表中的城市会被归入 `uncounted`，不作地图标记。

3. **检查 tags 回退兼容**：如果 `city` 字段为空，系统会自动从旧版 `tags` 字符串中解析城市（`parseTags()` 函数）。确保 `tags` 格式为 `大学 | 专业 | 城市`。此回退机制确保历史数据不丢失。

4. **检查 Redis 缓存**：地图数据 API 使用 `getCachedOrFetch('api:alumni:map', 300, ...)` 缓存 300 秒。如果刚修改了数据，最多等待 5 分钟后刷新。

5. **直接验证 API**：访问 `/api/alumni/map`，确认返回的 `alumni` 数组中 `city` 字段是否为空。

### 19. 燕中记忆前台显示"IMAGE PENDING"

**现象**：`/alumni/memories` 页面展品卡片显示 "IMAGE PENDING"，不显示图片

**原因**：
- 图片尚未上传到服务器
- 图片路径指向了不存在的旧 `/memories/` 目录
- 上传目录软链接未创建（`public/uploads` → `/var/www/alumni-site/uploads`）

**修复**：
1. 后台 `/admin/memories` 逐个展品上传图片
2. 检查 `imagePath` 字段是否为 `/uploads/` 路径
3. 确认 uploads 软链接：`ls -la /var/www/alumni-site/app/public/uploads`
4. 如缺失：`ln -sf /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads`

### 20. 燕中记忆展品排序失败

**现象**：点击排序按钮无效果

**原因**：旧版 API 要求 PUT 请求必须包含 `title`，排序请求仅传 `sortOrder` 被拒绝

**修复**：升级到最新 V2.0 代码，PUT `/api/admin/memories/[id]` 已支持部分更新。

### 21. MemoryItem 表不存在 / prisma db push 失败

**现象**：访问 `/api/memories` 报 500，日志显示 `no such table: MemoryItem`

**修复**：
```bash
cd /var/www/alumni-site/app
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push
systemctl restart alumni-site
```

### 22. 邮件发送失败（如 Invalid from field 等 Resend API 异常）

**现象**：
- 用户注册时，显示提示："账号已创建，但邮件发送失败，请稍后重新发送。"
- 控制台或服务端日志报错：
  ```
  Resend API 返回错误: {
    statusCode: 422,
    name: 'validation_error',
    message: 'Invalid `from` field. The email address contains non-ASCII characters.'
  }
  ```

**原因**：环境变量 `RESEND_FROM_EMAIL` 设置格式不规范（例如中文显示名称后没有使用 `<>` 包裹纯 ASCII 的邮箱地址）。若直接写成 `RESEND_FROM_EMAIL="燕中数字母港 noreply@yanchuaner.cn"`，Resend API 会因识别到非 ASCII 字符而拦截。

**修复**：
1. 打开配置的 `.env` 文件（本地开发环境或服务器生产环境的 `/var/www/alumni-site/.env`）
2. 确保 `RESEND_FROM_EMAIL` 符合标准邮件发件人规范，即显示名之后用 `<>` 括起纯英文邮箱：
   `RESEND_FROM_EMAIL="燕中数字母港 <noreply@yanchuaner.cn>"`
3. 重新启动服务使环境变量加载生效

---

## 部署问题

### 23. 部署后首页正常但后台 500

**可能原因**：
- Prisma schema 未在服务器同步（`npx prisma db push` 未执行）
- 数据库文件路径不正确

**修复**：
1. SSH 登录服务器
2. 进入应用目录：`cd /var/www/alumni-site/app`
3. 执行：`npx prisma db push`
4. 确认 `.env` 中 `DATABASE_URL` 指向正确的数据库路径
5. 重启服务

### 24. 证书过期（HTTPS 不可用）

**检查与续期**：
```bash
sudo certbot renew --dry-run    # 测试续期流程
sudo certbot renew               # 正式续期
sudo systemctl reload nginx      # 重新加载证书
```

### 25. 华为云 HSS 拦截 SSH 登录

**现象**：SSH 登录提示 `Input 'XXXX'.Problem contact HSS:XXXX` 反复循环

**原因**：华为云主机安全服务（HSS）拦截非常规登录

**绕过方式**：
1. **CloudShell**（推荐）：华为云控制台 → ECS → 远程登录 → CloudShell，无需 SSH
2. **VNC 控制台**：直接在浏览器内操作终端
3. 输入 HSS 提示的 4 位数字 → 通过验证后再输密码

### 26. SCP 上传卡住

**原因**：HSS 拦截 SCP 通道

**替代方案**：
```bash
# 方式 1：通过 CloudShell 上传文件，再 scp 到 ECS
scp /home/user/file root@<服务器IP>:/tmp/

# 方式 2：rsync 增量同步
rsync -avz deploy/ user@server:/tmp/alumni-deploy/
```

### 27. 服务器内存不足，构建被杀（SIGBUS）

**现象**：`npm run build` 报 `Next.js build worker exited with code: null and signal: SIGBUS`

**原因**：服务器内存不足（< 2GB），Node.js 进程被系统 OOM Killer 杀死

**修复**：**不要在生产服务器上构建**，应该在 WSL/本地构建后上传 `deploy/` 目录

```bash
# 本地 WSL 构建
npm run build
tar -czf deploy.tar.gz deploy/

# 上传到服务器
scp deploy.tar.gz root@<服务器IP>:/tmp/
```

### 28. Prisma 7.x 报 `datasource.url is required`

**现象**：执行 `npx prisma db push` 时报错

**原因**：Prisma 7.x 不再读 schema 中的 `url`，必须通过 `prisma.config.ts` 或 `DATABASE_URL` 环境变量

**修复**：确认项目根目录有 `prisma.config.ts`：
```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
});
```

如果 `.env` 不在当前目录，运行命令时显式指定：
```bash
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push
```

> **注意**：`prisma.config.ts` 在项目根目录，部署打包时别忘了 `cp prisma.config.ts deploy/`（部署指南已包含此步骤）。

### 29. 端口冲突（多个站点）

**现象**：服务启动失败 `EADDRINUSE: address already in use 0.0.0.0:3000`

**排查**：
```bash
ss -tlnp | grep 3000
```

**修复**：调整 `.env` 中的 `PORT=3010`，并同步 Nginx `proxy_pass http://127.0.0.1:3010`

### 30. Leaflet 地图标记不显示

**现象**：地图加载正常但找不到 marker 图标

**原因**：原代码引用 cdnjs 链接，国内可能不可达

**修复**：图标已本地化到 `public/leaflet/`，确认文件存在：
```bash
ls public/leaflet/
# 应包含：marker-icon.png, marker-icon-2x.png, marker-shadow.png
```

如缺失，从 `https://unpkg.com/leaflet@1.9.4/dist/images/` 下载补全。

---

## 快速修复流程（万能方案）

遇到不确定原因的问题时，按以下顺序尝试：

1. **终止所有 Node 进程**
2. **删除** `.next` 和 `node_modules/.cache`
3. **重新安装依赖**：`npm ci`
4. **重新构建或启动**：`npm run dev` 或 `npm run build`
5. **浏览器强制刷新**（Ctrl+Shift+R / Cmd+Shift+R）
6. **如果仍不行**，查看浏览器控制台（F12）和服务端日志：
   ```bash
   sudo journalctl -u alumni-site -n 100
   ```

这能解决大多数由缓存、构建残留或进程冲突引起的问题。

---

## V2.0 新增问题速查表

| 问题 | 症状 | 快速定位 | 详细条目 |
|------|------|---------|---------|
| SQLITE_BUSY | 写操作报 `database is locked` | 检查 WAL/busy_timeout 状态 | 条目 10 |
| Payload Too Large (413) | API 返回 413 | 检查请求 body 大小 vs 端点限制 | 条目 11 |
| Rate Limit (429) | 认证/邮件接口返回 429 | 检查 Redis 连通性 + 环境变量 | 条目 12 |
| CSV 导入失败 | 导入无效果或报错 | 检查编码/表头/城市映射 | 条目 16 |
| 故事审核不生效 | 状态未更新 | 检查状态 PENDING + 管理员权限 | 条目 17 |
| 地图无校友 | 地图空白无标记 | 检查 city 字段 + cityCoordinates | 条目 18 |
