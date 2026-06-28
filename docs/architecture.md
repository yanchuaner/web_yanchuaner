# 🏗️ 架构设计 · Architecture

> **燕中校友数字母港 V2.0** 系统架构深度文档  
> 涵盖前后端交互、数据库解耦策略、地图聚合算法、CMS 状态机与缓存策略

---

## 目录

- [1. 总体架构](#1-总体架构)
- [2. 请求生命周期](#2-请求生命周期)
- [3. 数据库设计](#3-数据库设计)
- [4. V2.0 数据解耦策略](#4-v20-数据解耦策略)
- [5. 地图城市聚合算法](#5-地图城市聚合算法)
- [6. CMS 审核状态机](#6-cms-审核状态机)
- [7. 缓存与限流架构](#7-缓存与限流架构)
- [8. 图片处理管道](#8-图片处理管道)

---

## 1. 总体架构

```
┌────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│          React 18 · Leaflet · Tailwind CSS             │
└──────┬─────────────────────────────────────┬───────────┘
       │  HTTP/1.1 + httpOnly Cookie          │
       │  (yc_access_token)                   │
       ▼                                       ▼
┌──────────────────┐              ┌──────────────────────┐
│  Next.js Edge    │              │  Static Assets       │
│  Middleware      │── 放行 ─────▶│  /uploads/*          │
│  (Token 验签)    │              │  /_next/static/*     │
└────────┬─────────┘              └──────────────────────┘
         │ Token 有效
         ▼
┌────────────────────────────────────────────────────────┐
│              Next.js 15.5 App Router                    │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Front Pages │  │  Admin Pages │  │  API Routes  │ │
│  │  (30+ pages) │  │  (18 routes) │  │  (50+ routes)│ │
│  │              │  │              │  │              │ │
│  │ SSR / CSR    │  │ CSR only     │  │ REST JSON    │ │
│  │ force-dynamic│  │ force-dynamic│  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                  ┌─────────▼─────────┐                  │
│                  │   Auth Layer      │                  │
│                  │   requireAdmin()  │                  │
│                  │   requireUser()   │                  │
│                  │   requireAlumni() │                  │
│                  └─────────┬─────────┘                  │
│                            │                            │
└────────────────────────────┼────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │       Prisma 7.x ORM        │
              │   ┌──────────────────────┐  │
              │   │  better-sqlite3      │  │
              │   │  WAL Mode            │  │
              │   │  busy_timeout = 5s   │  │
              │   │  synchronous=NORMAL  │  │
              │   └──────────────────────┘  │
              └──────────────┬──────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     SQLite Database File    │
              │     prisma/dev.db (开发)    │
              │     /var/www/.../prod.db    │
              └─────────────────────────────┘
```

### 关键设计原则

1. **无需外部数据库服务**：SQLite 单文件 + WAL 模式，零运维数据库
2. **Standalone 部署**：`next build` 产出自包含的 Node.js 应用，无需 `node_modules`
3. **Edge Middleware 先行拦截**：在请求到达 App Router 前完成 Token 验签
4. **双层鉴权**：Middleware 做路由级守卫，API Route 内部做 RBAC 权限细粒度校验

---

## 2. 请求生命周期

以 "校友通过审核" 这个完整操作为例，追踪一次请求的完整路径：

```
1. Client
   POST /api/admin/stories/:id/review
   Cookie: yc_access_token=<signed>
   Body: { "status": "PUBLISHED" }

2. Middleware (Edge Runtime)
   ├── 检查 pathname 是否为静态资源或公开 API → 否
   ├── 提取 Cookie 中的 yc_access_token
   ├── verifyTokenEdge(token):
   │   ├── 拆分 header.payload.signature
   │   ├── Web Crypto API HMAC-SHA256 验签
   │   ├── 校验 v=3, role, exp
   │   └── 返回 TokenPayload | null
   ├── payload.role === "admin" → 放行
   └── NextResponse.next()

3. API Route (Node.js Runtime)
   ├── getAuthenticatedUser(req):
   │   ├── 再次从 Cookie 解析 Token
   │   ├── verifyToken(token) → TokenPayload
   │   ├── prisma.user.findUnique({ where: { id } })
   │   ├── 校验 accountStatus=ACTIVE
   │   ├── 校验 emailVerified 不为 null
   │   ├── 校验 sessionVersion 匹配
   │   └── 返回 AuthenticatedUser | null
   ├── admin.role !== 'ADMIN' → 403
   │
   ├── readJsonBody<{ status }>(req, 16384):
   │   ├── 读 Content-Length header
   │   ├── > 16384 字节 → "PAYLOAD_TOO_LARGE"
   │   └── JSON.parse → { status }
   ├── 校验 status ∈ { PUBLISHED, REJECTED }
   │
   ├── prisma.$transaction(async tx => {
   │   ├── tx.story.update({ status })
   │   └── tx.auditLog.create({ action, before, after })
   │ })
   │
   └── Response: 200 { story: { ... } }
```

### 为什么 Middleware 和 API Route 都要验签？

- **Middleware** 提供快速失败——在 Edge 运行时直接拦截未登录请求，保护 App Router 不被无效流量冲击
- **API Route** 做精细校验——`sessionVersion` 需要在数据库层验证用户状态（账号是否被冻结/强制下线）

---

## 3. 数据库设计

### 核心实体关系

```
User ─────────────< AuditLog          (admin 操作记录)
User ─────────────< Post              (用户发帖)
User ─────────────< Story             (校友故事·CMS)
User ──┬──────────< UserClaimRequest   (校友认领·申请人)
       └──────────< UserClaimRequest   (校友认领·审核人)

User (合并) ───────< User (被合并)     (自引用: 账号去重合并)

WhitelistRoster ───< AlumniCorrection  (名册修正申请)

Event ────────────< EventRegistration  (活动报名)

ContentSection                        (独立: 各页面内容块)
MemoryItem                            (独立: 记忆馆条目)
TeacherSection                        (独立: 教师频道卡片)
News                                  (独立: 新闻资讯)
Achievement                           (独立: 校友成就)
```

### Story 模型的状态机定义

```prisma
enum PostStatus {
  DRAFT       // 用户草稿（仅自己可见）
  PENDING     // 已提交，等待管理员审核
  PUBLISHED   // 审核通过，前台展示
  REJECTED    // 审核驳回
}

model Story {
  status   PostStatus @default(PUBLISHED)  // 种子数据的默认状态
  authorId String?                          // 可关联注册用户
  authorUser User?                          // 投稿者
}
```

> **演进背景**：V1.0 依赖 Resend 邮件 + 手动操作，投稿流程割裂。V2.0 从 `todo.md` 的「模块二」演进而来，实现了站内闭环。

### 关键索引策略

| 表 | 索引字段 | 查询场景 |
|----|---------|----------|
| `User` | `status`, `role`, `accountStatus`, `emailVerified` | 用户列表筛选 |
| `User` | `emailVerifyTokenHash`, `passwordResetTokenHash` | Token 快速查找 |
| `Story` | `status`, `authorId` | 审核队列 / 用户投稿列表 |
| `AuditLog` | `adminId`, `targetType+targetId`, `createdAt` | 审计日志多维查询 |
| `ContentSection` | `page` | 按页面加载内容块 |

---

## 4. V2.0 数据解耦策略

### 背景问题

V1.0 的 `tags` 字段是一个多用途字符串：`"清华大学 | 计算机科学 | 深圳"`。这导致：

- 地图解析需要对 `tags` 进行字符串分割，城市名不一致（"深圳市" vs "深圳"）
- 无法独立搜索「所有在清华大学的校友」
- CSV 导入时字段映射混乱

### V2.0 解耦方案

```sql
-- Before (V1.0)
WhitelistRoster.tags = "清华大学 | 计算机科学 | 深圳"

-- After (V2.0)
WhitelistRoster.city       = "深圳"
WhitelistRoster.university = "清华大学"
WhitelistRoster.major      = "计算机科学"
WhitelistRoster.industry   = "互联网"
WhitelistRoster.tags       = "..."  -- 保留兼容，但新代码不再依赖
```

### 兼容性设计

`parseTags()` 函数作为过渡层兜底：

```typescript
// src/lib/tags.ts
export function parseTags(tags: string | null): ParsedTags {
  // 优先按 | 拆分，失败则尝试逗号
  // 返回 { university, major, city }
}
```

地图 API 的数据读取逻辑：

```typescript
// 1. 优先读取独立字段
let city = r.city;
let university = r.university;

// 2. 独立字段为空时回退到 tags 解析（兼容历史数据）
if (!city || !university) {
  const parsed = parseTags(r.tags);
  if (!city) city = parsed.city;
  if (!university) university = parsed.university;
}
```

### CSV 导入的城市清洗

```typescript
// prisma/seed.ts 和 api/admin/alumni/import/route.ts
if (city.endsWith("市") && city.length > 1) {
  city = city.slice(0, -1).trim();  // "深圳市" → "深圳"
}
```

> **为什么去「市」字？** 地图坐标数据集 `cityCoordinates` 的 key 使用的是不带「市」的城市名，如 `"深圳"` 而非 `"深圳市"`。

---

## 5. 地图城市聚合算法

### 数据流

```
WhitelistRoster (数据库)
  │ SELECT name, city, university, major, graduationClass, tags
  ▼
city-stats API (/api/alumni/city-stats)
  │ parseTags() 兜底 → 城市清洗 → cityCoords 坐标匹配
  │ Map<city, { count, universities[], majors[], members[] }>
  ▼
  {
    totalCities: N,        // 覆盖城市数
    totalAlumni: M,        // 已定位校友数
    totalUniversities: K,  // 院校种类
    totalMajors: J,        // 专业种类
    cities: [
      {
        city: "深圳",
        count: 156,
        lat: 22.5431,
        lng: 114.0579,
        universities: ["清华", "北大", ...],
        majors: ["计算机", ...],
        classes: ["2020", "2021", ...],
        members: [{ name, university, major, graduationClass }]
      }
    ],
    uncounted: X           // 无法定位的校友数（缺失城市或坐标）
  }
  ▼
Leaflet Map (react-leaflet)
  │ CircleMarker 按 count 缩放半径
  │ Popup 展示城市详情
  ▼
校友大学地图 (university-map page)
```

### 聚合核心逻辑

```typescript
// src/app/api/alumni/city-stats/route.ts (简化)

const cityMap = new Map<string, {
  count: number;
  universities: Set<string>;
  majors: Set<string>;
  classes: Set<string>;
  members: Array<{ name, university, major, graduationClass }>;
}>();

for (const record of allRecords) {
  // 1. 城市解析：独立字段优先，tags 兜底
  let city = record.city || parseTags(record.tags).city;
  if (!city) { uncounted++; continue; }

  // 2. 坐标匹配：查静态坐标系
  const coords = getCityCoords(city);
  if (!coords) { uncounted++; continue; }

  // 3. 聚合写入
  if (!cityMap.has(city)) {
    cityMap.set(city, { count: 0, universities: new Set(), ... });
  }
  const entry = cityMap.get(city)!;
  entry.count++;
  entry.universities.add(university);
  // ...
}

// 4. 排序输出：按校友数量降序
const cities = Array.from(cityMap.entries())
  .map(([city, entry]) => ({
    city,
    count: entry.count,
    lat: getCityCoords(city)!.lat,
    lng: getCityCoords(city)!.lng,
    // ...
  }))
  .sort((a, b) => b.count - a.count);
```

### 坐标数据源

`cityCoordinates` 是一个静态 Map，内嵌中国主要城市的经纬度。离线可用、零网络请求、不依赖第三方地图 API。

---

## 6. CMS 审核状态机

### 状态转换图

```
                    ┌──────────┐
       用户创建 ───▶│  DRAFT   │ (仅自己可见)
                    └────┬─────┘
                         │ 用户提交审核
                         ▼
                    ┌──────────┐
                    │ PENDING  │ (后台待审核队列)
                    └────┬─────┘
                         │ 管理员操作
                    ┌────┴────┐
                    ▼         ▼
              ┌─────────┐  ┌──────────┐
              │PUBLISHED│  │ REJECTED │
              │(前台展示)│  │(驳回可见)│
              └─────────┘  └──────────┘
                    │         │
                    └────┬────┘
                         │ 用户可撤销/删除
                         ▼
                    (从列表中移除)
```

### 相关 API 端点

| 端点 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/api/stories` | `POST` | 认证校友或管理员 | 提交新故事，自动设为 `PENDING` |
| `/api/stories` | `GET` | 认证校友或管理员 | 获取已发布的故事列表 |
| `/api/stories/[id]` | `DELETE` | 作者本人 | 用户删除自己的投稿 |
| `/api/admin/stories/pending` | `GET` | ADMIN | 获取待审核故事列表 |
| `/api/admin/stories/[id]/review` | `PATCH` | ADMIN | 审核通过/驳回 |
| `/api/me/posts` | `GET` | 登录用户 | 查看自己的投稿及状态 |

### 审核操作的审计记录

每次审核操作都会自动写入 `AuditLog`：

```typescript
// src/app/api/admin/stories/[id]/review/route.ts
await tx.auditLog.create({
  data: {
    action: `story-review-${status.toLowerCase()}`,  // "story-review-published"
    targetType: 'Story',
    targetId: id,
    adminId: admin.id,
    before: JSON.stringify({ status: existing.status }),
    after: JSON.stringify({ status }),
  },
});
```

---

## 7. 缓存与限流架构

### 三层限流降级（Rate Limit）

```
请求 → authLimiter.limit(ip)
           │
           ├── 1. Upstash Redis (云端) ← 首选，低延迟
           │   └── 失败/未配置 → 降级
           │
           ├── 2. ioredis (自建) ← 备选
           │   └── 失败/未配置 → 降级
           │
           └── 3. Memory Map (进程内) ← 最终保底
               └── 定期清理过期桶 (每 60s)
```

- `authLimiter`：滑动窗口，每 IP 5 次/分钟。
- `emailLimiter`：双窗口组合，1 次/分钟 + 10 次/天。

### 缓存策略

```typescript
// src/lib/cache.ts
export async function getCachedOrFetch<T>(key, ttlSeconds, fetchFn): Promise<T> {
  // 1. 尝试 Redis GET
  // 2. 命中 → 返回缓存
  // 3. 未命中 → 调用 fetchFn() → Redis SET → 返回
  // 4. Redis 不可用 → 直接调用 fetchFn()
}
```

当前使用场景：
- 校友地图数据：`api:alumni:map`，TTL 300s
- 设计为可扩展模式，后续可对新闻列表、成就榜单等高频读取接口启用

---

## 8. 图片处理管道

```typescript
// src/lib/image-pipeline.ts
export async function processToCard16x9(buffer: Buffer, destPath: string) {
  // 1. 元数据检查：宽≥320, 高≥180
  // 2. Sharp 处理：
  //    - rotate()        — 自动纠正 EXIF 方向
  //    - resize(2752×1548, cover, centre) — 裁切到标准 16:9
  //    - jpeg(quality=88, mozjpeg=true)   — 高压缩比输出
  // 3. 原子写入：
  //    - writeFile(tmpPath)  — 先写临时文件
  //    - rename(tmpPath, destPath) — 原子重命名
  //    - 失败时 unlink(tmpPath) — 清理残留
}
```

**为什么用 tmp+rename？** 避免并发请求读取到半写入的损坏文件——`rename()` 在同一文件系统上是原子操作。

---

<p align="center">
  <sub>Architecture Document · V2.0 · Last updated: June 2026</sub>
</p>
