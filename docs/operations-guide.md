# 运营指南

本文档覆盖本地开发、环境配置、数据库操作、脚本工具使用和日常运维的全部流程，已针对 V2.0 全面升级。

---

## 1. 本地开发流程

```bash
git clone <repo-url>
cd web_yanchuaner
cp .env.example .env          # 从模板创建环境变量文件
npm ci                         # 严格按 lockfile 安装依赖
npm run build                  # V2.0 一键构建（详见第 2 节）
npm run dev                    # 启动开发服务器 → http://localhost:3000
```

**日常开发**：
```bash
npm run dev                    # 开发模式（热更新）
npm run lint                   # ESLint 代码检查
npm run build                  # 生产构建
```

Windows 本地开发使用 SQLite `prisma/dev.db`，所有数据变更可通过 Prisma schema + `db push` 或后台 UI 操作完成。

---

## 2. V2.0 构建流程：`npm run build`

V2.0 将构建流水线整合为一条命令，覆盖从数据库同步到 Next.js 生产构建的全流程：

```
npm run build
  → prisma generate       # 根据 schema.prisma 生成类型安全的 Prisma Client
  → prisma db push        # 将 schema 变更同步到 SQLite（创建表/列/索引）
  → prisma db seed        # 幂等种子填充：首次运行注入初始数据，多次运行不重复
  → next build            # Next.js 生产构建（standalone 输出）
```

**为什么四步合一？**

| 步骤 | 单独运行的代价 | 合一的收益 |
|------|---------------|-----------|
| `prisma generate` | 每次修改 schema 或新 clone 后容易忘记执行，导致类型报错 | 构建前自动生成，消除"构建成功但类型报错"的诡异情况 |
| `prisma db push` | 新环境 / 新增字段后可能漏执行，导致运行时 `no such column` 500 | 每次构建自动同步 schema，生产与开发定义一致 |
| `prisma db seed` | 新部署时需手动种子，遗漏则站点展示空数据 | 幂等种子确保初始数据存在，已存在则跳过（见第 7.1 节） |
| `next build` | 原有的最后一步 | 在前三步就绪后，用最新数据和 schema 构建 |

**注意事项**：
- 仍可在本地单独执行各子步骤（如 `npm run db:push` 只同步 schema）
- 构建前建议通过 `npx tsc --noEmit` 验证一次类型
- 生产构建必须在 WSL 或 Linux 中执行（Windows 不兼容）

---

## 3. 环境变量

| 变量名 | 用途 | 必填 |
|--------|------|------|
| `DATABASE_URL` | SQLite 数据库连接字符串（如 `file:./prisma/dev.db`） | 是 |
| `SESSION_SECRET` | HMAC-SHA256 token 签名密钥（随机字符串） | 是 |
| `APP_URL` | 站点外部访问地址，用于邮件验证/密码重置链接 | 是（启用邮件时） |
| `SITE_URL` | 站点根 URL（用于 Open Graph 等 SEO 标签） | 否 |
| `SITE_NAME` | 站点名称（SEO） | 否 |
| `RESEND_API_KEY` | Resend 邮件 API Key | 否（本地测试可跳过） |
| `RESEND_FROM_EMAIL` | 发件人名称和邮箱（如 `燕中数字母港 <noreply@your.domain>`） | 否（本地测试可跳过） |
| `REDIS_URL` | ioredis 连接地址（legacy 限流中间层） | 否（未配置时降级为内存限流） |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL（首选举手限流层） | 否（未配置时降级） |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token（配合上面使用） | 否（未配置时降级） |
| `ROOT_ADMIN_EMAIL` | 超级管理员唯一邮箱标识（默认 `yanchuaner@yanchuaner.cn`） | 否 |
| `PORT` | 服务端口（默认 3000） | 否 |
| `UPLOAD_DIR` | 文件上传目录 | 否 |
| `BACKUP_DIR` | 备份目录 | 否 |

**V2.0 新增变量说明**：
- **`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`**：为 V2.0 三级限流系统的最顶层。配置后在认证接口（登录/注册/邮箱）上启用滑动窗口限流。前往 [Upstash Console](https://console.upstash.com) 免费创建实例后获取。不配置则自动降级到 ioredis → 内存限流。
- **`REDIS_URL`**（legacy）：原有的 Redis 连接，在 Upstash 不可用时作为中间层回退。如果两者都不配置，系统使用内存 Map 限流（单进程有效，重启清零）。

**.env 文件管理原则**：
- `.env` 不提交到 git（已在 `.gitignore` 中）
- `.env.example` 只写变量名和占位值，不写真实凭据
- 生产环境的 `.env` 独立维护在服务器 `/var/www/alumni-site/.env`

---

## 4. 账号管理

用户与管理员账号均存储在数据库 `User` 表中，密码使用 bcrypt 哈希。

### 创建管理员

```bash
npm run create-admin
```

脚本会交互式地要求输入用户名、邮箱和密码，创建已验证的管理员账号。

### 用户注册

普通用户通过 `/register` 注册，需要填写用户名、密码、邮箱、姓名、届别、班级。注册后需完成邮箱验证才能登录。

### 校友自动匹配

注册时如果姓名、届别、班级、邮箱四项与 `WhitelistRoster` 名册完全匹配，用户会自动获得校友认证（role=ALUMNI, status=VERIFIED），无需管理员审核。

### 管理员后台管理

管理员可在后台 `/admin/users` 审核校友身份、停用/恢复账号、强制注销全部会话、提升/撤销管理员权限。所有敏感操作记录到 AuditLog。

---

## 5. 数据库操作

### 5.1 数据库类型与位置

| 环境 | 路径 | 说明 |
|------|------|------|
| 本地开发 | `prisma/dev.db` | SQLite 单文件，可随意修改 |
| 生产环境 | `/var/www/alumni-site/data/prod.db` | SQLite 单文件，禁止直接覆盖 |

### 5.2 SQLite WAL 优化

V2.0 在数据库连接初始化时自动启用以下 PRAGMA 优化，有效防止并发场景下的 `SQLITE_BUSY` 错误：

```ts
// src/lib/db.ts — 每次 PrismaClient 初始化时自动执行
PRAGMA journal_mode = WAL;        // Write-Ahead Logging 模式
PRAGMA synchronous = NORMAL;      // 正常同步级别
PRAGMA busy_timeout = 5000;       // 5 秒忙等超时
```

| PRAGMA | 作用 | 为什么重要 |
|--------|------|-----------|
| `journal_mode = WAL` | 读写互不阻塞：写入在 WAL 文件中进行，不阻塞并发读取 | 解决"一个请求在写数据时其他请求全部读不了"的经典问题 |
| `synchronous = NORMAL` | 在关键时刻（WAL 文件切换）fsync，而非每次写入都同步 | 在数据安全与写入性能之间取平衡点 |
| `busy_timeout = 5000` | 遇到锁定时不立即报错，而是最多等待 5 秒 | 避免短时并发写入直接报 `SQLITE_BUSY` |

**这三个设置共同保障了**：多用户同时浏览页面（读）不会因后台 CSV 导入（写）而卡死；请求之间短暂的写入竞争会被 5 秒等待吸收而非直接报错。

### 5.3 如何修改数据

有多种方式可以修改数据库中的数据：

**方式一：通过后台 UI（推荐）**

这是最安全的方式。登录 `/admin` 后通过图形界面管理新闻、活动、校友名单等。所有修改即时生效，无需重启服务。

**方式二：通过 Prisma Studio（本地开发）**

```bash
npx prisma studio
```

打开浏览器中的数据库浏览器 (`http://localhost:5555`)，可直观地浏览和编辑所有表和记录。适合本地开发和调试。

**方式三：通过 API（程序化）**

后台管理 API 支持对新闻、活动、校友名单等资源的 CRUD 操作。需要管理员 cookie 认证。详见 [ROUTES.md](ROUTES.md) 中的 API 路由清单。

**方式四：直接操作 SQLite 数据库（仅限紧急情况）**

```bash
# 连接数据库
sqlite3 prisma/dev.db

# 查看所有表
.tables

# 查看表结构
.schema WhitelistRoster

# 查询数据
SELECT * FROM WhitelistRoster WHERE name LIKE '%张三%';

# 修改数据（务必先备份！）
UPDATE WhitelistRoster SET city = '北京' WHERE id = 'xxx';

# 退出
.quit
```

> **警告**：直接操作生产数据库前必须先备份！参考 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)。

**方式五：通过 CSV 导入/导出**

校友名单支持批量 CSV 导入。适用于初次填充数据或批量更新：
1. 先从后台导出当前数据为 CSV
2. 在 Excel / Google Sheets 中编辑
3. 通过后台导入功能上传修改后的 CSV

### 5.4 数据库 Schema 变更

如果修改了 `prisma/schema.prisma`：

```bash
# 本地开发：直接同步
npx prisma db push

# 生产环境：部署后在服务器执行
cd /var/www/alumni-site/app
npx prisma db push
```

**不要执行 `prisma migrate reset`**，这会清空所有数据。

### 5.5 数据库备份

```bash
# 本地备份
cp prisma/dev.db "prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)"

# 生产备份（在服务器上）
cp /var/www/alumni-site/data/prod.db "/var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)"
```

详细备份策略见 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)。

---

## 6. V2.0 关键功能

### 6.1 三级限流系统

V2.0 的限流采用三级链式降级架构，从高到低依次尝试：

```
请求 → Upstash Redis（生产推荐）
        ↓ 不可用/异常
      ioredis（legacy Redis）
        ↓ 不可用/异常
      内存 Map（单进程，重启清零）
```

**三个限流器**：

| 限流器 | 范围 | 窗口 | 用途 |
|--------|------|------|------|
| `authLimiter` | 每 IP | 5 次/分钟 | 登录、注册接口 |
| `emailLimiter`（分钟） | 每邮箱 | 1 次/分钟 | 邮件发送频率控制 |
| `emailLimiter`（天） | 每邮箱 | 10 次/天 | 邮件日总量控制 |

**降级行为**：
- Upstash 不可用时 → 自动尝试 ioredis（`REDIS_URL`）
- ioredis 也不可用 → 内存 Map（滑动窗口，进程重启后清零）
- 任意层连接失败 → 记录 `console.error` 日志但不影响服务响应

### 6.2 Redis 缓存层

V2.0 引入 `getCachedOrFetch()` 通用缓存模式（`src/lib/cache.ts`）：

```ts
// 先查 Redis 缓存，缺失时执行 fetchFn 并写入缓存
const data = await getCachedOrFetch('api:alumni:map', 300, async () => {
  // 数据库查询...
});
```

**已接入缓存的端点**：

| 缓存 key | TTL | 用途 |
|----------|-----|------|
| `api:alumni:map` | 300 秒（5 分钟） | 校友地图数据（城市分布、人数） |
| `admin:stats` | 60 秒 | 后台首页统计数据 |
| `home:dashboard:stats` | 60 秒 | 前台首页仪表盘统计 |

**缓存行为**：如果 Redis 不可用，`getCachedOrFetch` 会直接执行 `fetchFn` 并返回结果，缓存写入失败静默忽略。这确保缓存层永远是可选的加速器，不是单点故障。

### 6.3 Tags 解析（向后兼容）

V2.0 的校友数据模型新增了独立字段 `city`、`university`、`major`，同时保留旧版 `tags` 字符串字段（`大学 | 专业 | 城市`）。

`parseTags()` 函数（`src/lib/tags.ts`）的解析优先级：

1. **优先读取独立字段**：`r.city` / `r.university` / `r.major`
2. **独立字段为空时回退到 tags 解析**：按 `|` 拆分（新格式），不行再按逗号拆分（旧格式兼容）
3. **最终兜底**：城市字段为空时显示"未知"

这确保了旧的 CSV 导入数据（仅 `tags` 列）和新导入数据（有独立 `city`/`university`/`major` 列）都能正确解析，地图和统计功能不受影响。

### 6.4 事务批处理

V2.0 在两个关键写入路径上使用 `prisma.$transaction()` 确保原子性和性能：

**CSV 导入**（`/api/admin/alumni/import`）：
```ts
await prisma.$transaction(async (tx) => {
  for (const line of lines) {
    await upsertRosterEntry(tx, { name, ... });
  }
});
```
- 所有行在一个事务中写入，获取单一数据库锁
- 大幅减少 `SQLITE_BUSY` 风险（相比逐行独立事务）
- 任一单行解析失败不影响整体事务继续

**故事审核**（`/api/admin/stories/[id]/review`）：
```ts
const updated = await prisma.$transaction(async (tx) => {
  const story = await tx.story.update({ ... });          // 1. 更新状态
  await tx.auditLog.create({ ... });                     // 2. 创建审计日志
  return story;
});
```
- 状态更新 + 审计日志为原子操作
- 绝不会出现"状态改了但没留下审计记录"的不一致情况

### 6.5 请求体大小限制

所有 API 端点的请求体都通过 `readJsonBody<T>(req, maxBytes)` 精确限制大小，防止内存耗尽攻击：

| maxBytes | 端点类型 | 原因 |
|----------|---------|------|
| 4096 | 认证类（登录/注册/验证/密码重置） | 仅字段名和简短值 |
| 16384 (16KB) | 管理类写入（新闻/活动/故事/审核） | 含富文本内容 |
| 65536 (64KB) | 前台投稿（`/api/posts`、`/api/stories`） | 长文投稿 |

如果请求体超过限制，返回 `413 Payload Too Large` 错误。

---

## 7. 脚本工具

| 脚本 | 用途 | 使用场景 |
|------|------|----------|
| `npm run seed` | Prisma 种子填充（幂等） | 初次填充白名单 + 故事基础数据 |
| `npm run seed-all` | 全量种子脚本（白名单、页面内容、记忆、故事） | 首次部署或完全重置 |
| `npm run create-admin` | 创建数据库管理员账号（交互式） | 首次部署或新增管理员 |
| `npm run smoke` | 关键路径回归测试 | 部署前验证认证、后台流程是否正常 |
| `npm run fresh` | 清理构建产物后重新开发 | 遇到奇怪的缓存/构建问题 |
| `npm run update-list` | 构建校友列表文件 | 数据更新后重新生成静态文件 |
| `npm run normalize-identity-fields` | 清洗届别/班级历史后缀 | PR #23 后生产执行一次，支持 `-- --dry-run` |
| `npm run db:generate` | 仅生成 Prisma Client | schema 变更后单独执行 |
| `npm run db:push` | 仅同步数据库 schema | 不触发种子和构建 |
| `npm run db:studio` | 打开 Prisma Studio | 本地调试数据 |
| `scripts/gen_cert_numbers.js` | 批量生成证书编号 | 新增校友后统一编号 |
| `scripts/backup.sh` | 自动备份数据库与上传文件 | 配合 cron 定时执行 |

### 7.1 幂等种子（`npm run seed`）

V2.0 的 `prisma/seed.ts` 使用 `findFirst + createOrUpdate` 模式：

- **白名单**：按 `姓名 + 届别 + 班级 + 邮箱` 查重，存在则更新字段，不存在则创建
- **故事**：按 `标题 + 作者` 查重，存在则更新内容

因此 `npm run seed` 可以安全地多次执行——不会产生重复数据，只补充缺失项和更新已有项。这在构建流水线（`npm run build`）中特别关键：每次构建自动种子不会污染数据库。

### 7.2 身份字段清洗（normalize-identity-fields）

PR #23 后，届别和班级统一为纯数字存储：数据库保存 `2025`、`1`，展示层格式化为 `2025届`、`1班`。历史数据如果仍有后缀，可通过脚本幂等清洗。

```bash
# 本地预览会改动多少行
npm run normalize-identity-fields -- --dry-run

# 本地正式执行
npm run normalize-identity-fields
```

生产执行顺序：

```bash
# 1. 必须先备份数据库和上传目录
sudo /var/www/alumni-site/scripts/backup.sh

# 2. 部署新版本后，先同步 schema
cd /var/www/alumni-site/app
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push

# 3. 先 dry-run，再正式执行
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js --dry-run
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" node scripts/normalize_identity_fields.js
```

脚本会处理 `User`、`WhitelistRoster`、`Achievement`、`AlumniCorrectionRequest` 中的届别/班级字段；多次执行不会重复改动。本地开发仍可使用 `npm run normalize-identity-fields`。

### 7.3 全量种子（`npm run seed-all`）

执行顺序：
```
seed_whitelist.js  → seed_content_sections.js  → seed_memories.js  → seed_stories.js
```

适合首次部署或需要完整重建演示数据时使用。

### 7.4 烟雾测试（`npm run smoke`）

```bash
# 使用环境变量配置测试参数
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_USERNAME=admin \
SMOKE_PASSWORD=yourpassword \
npm run smoke
```

测试覆盖：用户注册 → 邮箱验证 → 用户登录 → 管理员登录 → 后台 API 访问 → 校友数据 API 访问。

### 7.5 证书编号管理（gen_cert_numbers.js）

电子校友证上的编号来自数据库 `WhitelistRoster.certificateNo` 字段。留空则回退显示 UUID。

```bash
node scripts/gen_cert_numbers.js
```

脚本逻辑：

- 部分核心成员的编号置空，由管理员在后台手动填写
- 其余成员按姓名排序生成 `YC-2022-0001` 格式的编号

两种方式修改编号：

- 后台 → 校友名单 → 编辑 → 证书编号输入框
- 数据库 → `npx prisma studio` → WhitelistRoster → certificateNo 列

### 7.6 燕中记忆管理（seed_memories.js）

燕中记忆文化长廊使用数据库驱动，通过后台 `/admin/memories` 可视化维护。

```bash
# 初始化种子数据
node scripts/seed_memories.js
```

**记忆展品数据结构**（`MemoryItem` 表）：
- `title` / `subtitle` — 展品标题和副标题
- `description` — 描述文字
- `imagePath` — 图片路径（`/uploads/xxx.jpg`）
- `imageAlt` — 图片无障碍说明
- `icon` — 图标类型（camera/house/landmark/library/mountain/trees）
- `sortOrder` — 显示排序

**图片命名工具**：`src/lib/memories.ts` 提供 `renameToCategoryPath()` 在保存时将上传图片自动重命名为 `{板块英文名}{排序号}.jpg`。

**Tags 解析工具**：`src/lib/tags.ts` 提供 `parseTags()` 和 `normalizeTags()`，统一处理校友 tags 中竖线 `|` 和逗号两种分隔符，支持独立字段优先读取。

---

## 8. CSV 导入/导出规范

### 8.1 编码要求

- 文件编码必须是 **UTF-8**（不是 GBK、不是 UTF-8 BOM）
- 导出的文件使用 UTF-8 BOM（确保 Excel 正确识别中文）

### 8.2 表头格式

支持中文和英文两种表头：

| 中文表头 | 英文表头 | 说明 |
|----------|----------|------|
| 姓名 | name | **必填**，最长 50 字符 |
| 届别 | graduationClass | 如"2025"（毕业年份），最长 50 字符 |
| 班级 | className | 如"3班"，最长 64 字符 |
| 邮箱 | email | 选填，最长 254 字符，需含 `@` |
| 联系方式 | contact | 选填（11 位手机号） |
| 标签 | tags | 旧格式兼容：`大学名 \| 专业 \| 城市` |
| 城市 | city | **V2.0 新增**：独立城市字段 |
| 院校 / 毕业院校 / 大学 | university | **V2.0 新增**：独立院校字段 |
| 专业 / 就读专业 | major | **V2.0 新增**：独立专业字段 |
| 行业 / 从事行业 | industry | **V2.0 新增**：独立行业字段 |

### 8.3 V2.0 标签格式

**推荐方式**（V2.0）：在 CSV 中使用独立列 `city`、`university`、`major`，每个字段一个值。

**兼容方式**（旧版）：在 `tags` 列中使用竖线分隔：

```
大学名称 | 专业名称 | 城市名称
```

示例：
```
清华大学 | 计算机科学与技术 | 北京
中山大学 | 临床医学 | 广州
```

城市名称用于校友地图的城市聚合。V2.0 中城市字段的独立列 `city` 会被优先读取；如果 `city` 列为空，回退到 `tags` 解析。

### 8.4 城市名称格式

城市名不需要带"市"后缀（导入时自动去除）。支持的城市名称见 `src/data/cityCoordinates.ts` 中的 `CITY_COORDS` 映射表。不在映射表中的城市在地图上不会显示。

### 8.5 导入去重

按 `姓名 + 届别 + 班级 + 邮箱` 四字段去重。完全匹配时更新现有记录，不新增重复项。CSV 导入使用 `prisma.$transaction()` 事务批处理，确保锁开销最小。

### 8.6 导出安全

导出的 CSV 做了**公式注入防护**：以 `=`、`+`、`-`、`@` 开头的字段前自动加单引号前缀。

### 8.7 导入限制

- 文件大小上限：**2MB**
- 错误行上限：**20 行**（超过后跳过剩余行）
- 文件编码必须是 UTF-8（不含 BOM）

---

## 9. 图片上传

### 9.1 支持的上传类型

| 上传入口 | API 路由 | 用途 |
|----------|----------|------|
| 后台新闻/活动编辑页 | `/api/upload` | 新闻封面图、活动封面图 |
| 校友证页面（管理端） | `/api/alumni/certificate/upload-bg` | 校友证个人背景图 |
| 系统设置 | `/api/settings/card-bg/upload` | 校友纪念卡默认背景（16:9，Sharp 裁切） |

### 9.2 上传要求

- 格式：PNG / JPG / WebP
- 新闻/活动封面建议尺寸：1200×630
- 校友卡默认背景：16:9 比例（2752×1548），服务端自动裁切
- 文件大小限制由 `next.config.mjs` 中的 `serverActions.bodySizeLimit` 控制

### 9.3 上传目录

| 环境 | 路径 |
|------|------|
| 本地开发 | `public/uploads/` |
| 生产环境 | `/var/www/alumni-site/uploads/`（通过 Nginx `/uploads/` 路径对外服务） |

---

## 10. 生产运维

### 10.1 服务管理

```bash
# 查看服务状态
sudo systemctl status alumni-site

# 重启服务
sudo systemctl restart alumni-site

# 查看实时日志
sudo journalctl -u alumni-site -f

# 停止/启动
sudo systemctl stop alumni-site
sudo systemctl start alumni-site
```

### 10.2 日常检查清单

- [ ] 站点首页正常访问
- [ ] 管理员能正常登录
- [ ] 校友地图正常加载（含 Redis 缓存命中）
- [ ] 数据库文件大小正常（未异常增长）
- [ ] 磁盘空间充足（`df -h`）
- [ ] 备份文件在有效期内
- [ ] Upstash Redis 连接正常（如已配置）

---

## 11. 注意事项

- **不要用本地 dev.db 覆盖线上 prod.db**
- **不要**提交 `.env`、`.env.local`、`.env.production`、`credentials.local.json`、`.claude/`、`*.db` 到 git
- **不要在服务器上直接编辑业务代码**
- **构建和部署必须**在 WSL 或 Linux 中执行（Windows 下 `next build` 不完全兼容）
- **不要使用** `output: "export"` 静态部署（项目依赖 API 路由、数据库、上传等动态功能）
- **所有** `/api/admin/*` 接口必须经过 `requireAdmin()` 保护
- 认证 API 默认走限流（注册/登录/邮箱验证/密码重置等）
- sessionVersion 在修改密码/停用账号/强制退出时递增，旧 token 立即失效
- 修改凭据后**必须重启服务**才能生效
- 直接操作生产数据库前**必须先备份**
- CSV 导入使用事务批处理，大数据量导入建议分组执行（每次不超过 500 行）
