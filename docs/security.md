# 🛡️ 安全防御指南 · Security

> **燕中校友数字母港 V2.0** 系统级安全架构文档  
> 记录 Payload 拦截、IDOR 防御、SQLite 锁竞争优化、Token 安全设计等实战经验

---

## 目录

- [1. 安全设计原则](#1-安全设计原则)
- [2. Payload 大小熔断 (Anti-OOM)](#2-payload-大小熔断-anti-oom)
- [3. IDOR 水平越权防御](#3-idor-水平越权防御)
- [4. Token 安全设计](#4-token-安全设计)
- [5. API 限流三层架构](#5-api-限流三层架构)
- [6. SQLite 事务与锁竞争优化](#6-sqlite-事务与锁竞争优化)
- [7. 数据脱敏策略](#7-数据脱敏策略)
- [8. 图片上传安全](#8-图片上传安全)
- [9. CSV 导入防御](#9-csv-导入防御)
- [10. 安全头与 Cookie 策略](#10-安全头与-cookie-策略)

---

## 1. 安全设计原则

> **纵深防御 (Defense in Depth)** — 每一层都假设外层已被突破，独立做校验。

```
┌─────────────────────────────────────────┐
│  Layer 1: Edge Middleware               │
│  Token 验签 + 路由级角色分流            │
├─────────────────────────────────────────┤
│  Layer 2: API Auth Middleware           │
│  DB 级用户状态校验 (sessionVersion)     │
├─────────────────────────────────────────┤
│  Layer 3: Payload Validation            │
│  大小熔断 + 类型校验 + 参数白名单       │
├─────────────────────────────────────────┤
│  Layer 4: Database Layer                │
│  select 脱敏 + 事务安全 + 索引覆盖      │
└─────────────────────────────────────────┘
```

---

## 2. Payload 大小熔断 (Anti-OOM)

### 问题场景

```typescript
// ❌ 危险：无限制读取 JSON Body
const body = await req.json();  // 攻击者发送 500MB JSON → OOM
```

### V2.0 解决方案

```typescript
// src/lib/auth-utils.ts

export async function readJsonBody<T>(
  req: Request,
  maxBytes = 16_384,  // 默认 16KB
): Promise<T> {
  // 1. 先读 Content-Length header（零拷贝）
  const length = Number(req.headers.get("content-length") || "0");
  if (length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");

  // 2. 读取 ArrayBuffer
  const buffer = await req.arrayBuffer();

  // 3. 二次校验（防止 Content-Length 伪造）
  if (buffer.byteLength > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  // 4. 解析 JSON
  const text = new TextDecoder().decode(buffer);
  return JSON.parse(text) as T;
}
```

### 分级限值策略

| 接口类型 | 限制 | 理由 |
|----------|------|------|
| 登录/注册/密码重置 | 16KB | 纯文本字段，很小 |
| 校友故事提交 | 16KB | 正文 + 标签 |
| 富文本内容（News/Event 编辑） | 512KB | 含 HTML 富文本 |

### 调用层防护

```typescript
// 每个 API 端点统一使用
const body = await readJsonBody<MyType>(req, 16384);

// 捕获并返回客户端友好的错误
} catch (error: any) {
  if (error?.message === "PAYLOAD_TOO_LARGE") {
    return NextResponse.json({ error: "请求体过大" }, { status: 413 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
  }
}
```

---

## 3. IDOR 水平越权防御

> **IDOR** (Insecure Direct Object Reference)：用户 A 通过修改 URL 中的资源 ID 访问用户 B 的数据。

### 三层防御

**第一层：Middleware 路由守卫**

```typescript
// src/middleware.ts
if (pathname.startsWith("/admin") && payload.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**第二层：API 端点鉴权**

```typescript
// src/lib/admin-auth.ts
export async function requireAdmin(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();            // 401
  if (user.role !== "ADMIN") return unauthorized("Forbidden", 403);  // 403
  return null;  // 通过
}

export async function requireVerifiedAlumni(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  // 仅允许 ADMIN 或 VERIFIED 状态的 ALUMNI
  if (user.role !== "ADMIN" &&
      (user.role !== "ALUMNI" || user.status !== "VERIFIED")) {
    return unauthorized("Forbidden", 403);
  }
  return null;
}
```

**第三层：资源归属校验（以故事编辑为例）**

```typescript
// 用户只能编辑/删除自己的故事
const story = await prisma.story.findUnique({ where: { id } });
if (!story) return 404;
if (story.authorId !== currentUserId) {
  return NextResponse.json({ error: "无权操作" }, { status: 403 });
}
```

---

## 4. Token 安全设计

### 格式

```
base64url(JSON({
  v: 3,               // Token 版本号（支持全局升级/废弃旧版）
  role: "user|admin",
  userId: "uuid",
  sessionVersion: 5,  // 用户级会话版本计数器
  exp: 1720000000000  // 过期时间戳（7 天）
})).base64url(HMAC-SHA256(encoded, SESSION_SECRET))
```

### 安全特性

**时序攻击防御**：

```typescript
// src/lib/verify-token.ts
// ❌ 危险：字符串直接比较（可能被时序攻击推断出签名）
// if (signature !== expected) return null;

// ✅ 安全：恒定时间比较
if (
  actualBuffer.length !== expectedBuffer.length ||
  !timingSafeEqual(actualBuffer, expectedBuffer)
) {
  return null;
}
```

**多因素 Token 校验**：

```typescript
// 6 项检查全部通过才算有效 Token
if (
  payload.v !== TOKEN_VERSION ||           // 1. 版本匹配
  (payload.role !== "user" && ...) ||      // 2. 角色合法
  typeof payload.userId !== "string" ||    // 3. userId 存在
  !payload.userId ||                       // 4. userId 非空
  !Number.isInteger(payload.sessionVersion) || // 5. sessionVersion 合法
  typeof payload.exp !== "number" ||       // 6. 未过期
  payload.exp <= Date.now()
) {
  return null;
}
```

**sessionVersion 机制 — 即时全局踢出**：

```typescript
// 当管理员冻结账号或用户修改密码时：
await prisma.user.update({
  where: { id: userId },
  data: { sessionVersion: { increment: 1 } }
});
// 该用户的所有现有 Token 立即失效，因为 sessionVersion 不匹配
```

---

## 5. API 限流三层架构

### 设计理念

> **优雅降级 (Graceful Degradation)** — 任一层故障都不影响服务可用性

### 三层架构

```typescript
// src/lib/rate-limit.ts

// Layer 1: Upstash Redis (云端，低延迟)
if (isUpstashConfigured) {
  authLimiterRedis = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),  // 5次/分钟
  });
}

// Layer 2: ioredis (自建 Redis)
const redis = getRedisClient();  // 读取 REDIS_URL

// Layer 3: Memory Map (进程内)
const localMemoryStore = new Map<string, number[]>();
// 每 60 秒清理过期条目
```

### 限流规则

| 限流器 | 规则 | 存储 | 适用场景 |
|--------|------|------|----------|
| `authLimiter` | 5 次/分钟/IP | Upstash → Memory | 登录/注册/密码重置 |
| `emailLimiter` | 1 次/分钟 + 10 次/天/IP | Upstash → Memory | 验证邮件发送 |

### 内存泄漏防护

```typescript
// 定期清理过期的时间戳记录，防止内存 Map 无限增长
function sweepLocalMemory(now: number) {
  if (now - lastLocalSweep < 60_000) return;  // 最多每分钟一次
  lastLocalSweep = now;
  for (const [k, timestamps] of localMemoryStore) {
    const active = timestamps.filter(t => t > now - 86_400_000);
    if (active.length === 0) {
      localMemoryStore.delete(k);  // 删除过期条目
    } else {
      localMemoryStore.set(k, active);
    }
  }
}
```

---

## 6. SQLite 事务与锁竞争优化

### 问题背景

SQLite 是单写者模型——同一时刻只有一个连接可以执行写操作。V1.0 的 CSV 导入在循环内逐行 `prisma.whitelistRoster.upsert()`，导致频繁的锁获取/释放，在高频写入场景下触发 `SQLITE_BUSY` 错误。

### V2.0 解决方案

**1. PRAGMA 优化（连接初始化时）**

```typescript
// src/lib/db.ts
const bootstrap = new Database(dbPath);
bootstrap.pragma('journal_mode = WAL');      // 写前日志：读写不互斥
bootstrap.pragma('synchronous = NORMAL');    // 降低 fsync 频率
bootstrap.pragma('busy_timeout = 5000');     // 锁等待 5 秒而非立即失败
```

**2. 批量事务写入**

```typescript
// src/app/api/admin/alumni/import/route.ts
await prisma.$transaction(async (tx) => {
  for (let i = 1; i < lines.length; i++) {
    // 所有写操作在同一个事务中完成
    const { created } = await upsertRosterEntry(tx, { ... });
    // ...
  }
});
// 💡 整个 CSV 导入只用一次写锁，而非每行一次
```

**3. 审核操作的事务性**

```typescript
// src/app/api/admin/stories/[id]/review/route.ts
const updated = await prisma.$transaction(async (tx) => {
  const story = await tx.story.update({ ... });   // 更新故事状态
  await tx.auditLog.create({ ... });              // 写入审计日志
  return story;
});
// 💡 状态更新 + 审计记录是一个原子操作——要么都成功，要么都不做
```

### 三条 PRAGMA 的作用

| PRAGMA | 作用 | 为什么重要 |
|--------|------|-----------|
| `journal_mode=WAL` | 写前日志模式 | 读操作不阻塞写操作，写操作不阻塞读操作 |
| `synchronous=NORMAL` | 降低同步频率 | WAL 模式下安全，显著提升写入性能 |
| `busy_timeout=5000` | 锁等待 5 秒 | 而非立即返回 `SQLITE_BUSY` 错误 |

---

## 7. 数据脱敏策略

### 原则：永远不要返回完整的 User 对象

```typescript
// ❌ 危险：返回所有字段，包括 passwordHash
const user = await prisma.user.findUnique({ where: { id } });

// ✅ 安全：显式 select，只返回需要的数据
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    email: true,
    emailVerified: true,
    name: true,
    graduationClass: true,
    className: true,
    role: true,
    status: true,
    accountStatus: true,
    sessionVersion: true,
    // ⚠️ 刻意不返回 passwordHash, passwordResetTokenHash 等敏感字段
  },
});
```

### 审查操作中的脱敏

```typescript
// AuditLog 写入时的 before/after 快照
before: JSON.stringify({ status: existing.status }),  // 只记录变更字段
after: JSON.stringify({ status }),                     // 不记录密码等敏感数据
```

### 当前敏感列表收口

- 公开/校友 API 使用显式 `select`，未登录或未认证请求不会返回联系方式。
- 管理员用户列表只返回审核所需字段，不返回 `passwordHash`、重置 token、验证 token。
- 活动报名列表和校友修正申请列表使用显式 `select`，避免 Prisma 模型新增字段后被整行带出。
- 管理员触发重发验证邮件、发送密码重置邮件时写入 `AuditLog`，日志只记录 token 重置事件，不记录 token 明文。

---

## 8. 图片上传安全

### 防御层次

```
1. MIME 类型白名单
   └── isImageMime(mime) → image/jpeg | image/png | image/webp

2. 文件大小限制
   └── MAX_UPLOAD_BYTES = 10MB

3. Sharp 重编码（消除恶意 payload）
   └── 所有上传图片强制经过 Sharp 处理：
       .rotate()           // 纠正 EXIF
       .resize(2752×1548)  // 固定尺寸
       .jpeg(q=88)         // 重新编码为 JPEG
   └── 攻击者上传的 "图片马" 中的恶意代码在重编码中被丢弃

4. 原子写入
   └── writeFile(tmpPath) → rename(tmpPath, destPath)
   └── 防止并发读请求获取到半写入的文件

5. 前台展示路径白名单
   └── 后台内容写入只接受 `/uploads/*.jpg|jpeg|png|webp|gif|avif` 或 `/card.jpg`
   └── 拒绝外链、data URI、javascript URI、路径穿越和控制字符
```

> **为什么重编码能防「图片马」？**  
> 攻击者可能将 PHP/JS 代码嵌入 PNG 的 metadata 或尾部。Sharp 的 `jpeg()` 输出是完全重建的 JPEG 文件——原始文件中的任何非图像数据都在这个过程中被丢弃。

---

## 9. CSV 导入防御

```typescript
// src/app/api/admin/alumni/import/route.ts

// 防御点 1: 文件大小硬限制
if (file.size > 2 * 1024 * 1024) {
  return NextResponse.json({ error: "文件过大，请保持在 2MB 以内" }, { status: 400 });
}

// 防御点 2: 最少行数验证
if (lines.length < 2) {
  return NextResponse.json({ error: "至少需要表头行和一行数据" }, { status: 400 });
}

// 防御点 3: 智能列头检测（中英文兼容）
function detectHeaders(fields: string[]): { ... } {
  // 支持 "姓名"/"name", "城市"/"city", "毕业院校"/"university" 等别名
  const headerMap = {
    "姓名": "name", "name": "name",
    "城市": "city", "所在城市": "city", "city": "city",
    // ...
  };
}

// 防御点 4: 逐行字段校验
if (name.length > 50) { errors.push("姓名过长"); continue; }
if (email && email.length > 254 || !email.includes("@")) { ... }

// 防御点 5: 错误上限熔断
if (errors.length >= 20) {
  errors.push(`已达错误上限，第 ${i+1} 行及之后已跳过`);
  break;
}

// 防御点 6: 批量事务写入
await prisma.$transaction(async (tx) => {
  for (...) { await upsertRosterEntry(tx, ...); }
});
```

---

## 10. 安全头与 Cookie 策略

### 当前安全响应头

应用层在 `next.config.mjs` 中统一下发基础安全响应头：

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy-Report-Only: ...
```

说明：

- HSTS 只会被浏览器在 HTTPS 响应上采纳；生产域名必须确保证书有效后再长期启用。
- CSP 当前使用 `Report-Only`，目的是先收集误伤，不阻断现有页面、地图、上传图片和后台操作。
- 第一版 CSP 允许 `self`、`data:`/`blob:` 图片、HTTPS 图片/请求、WebSocket 开发连接，并保留 Next.js 运行所需的 inline/eval 兼容项。后续应逐步收紧。
- Nginx 直出的 `/_next/static/*`、`/uploads/*` 不经过 Next.js，可在 Nginx 侧补充 HSTS 与基础安全头。

### Cookie 配置

```
yc_access_token:
  - httpOnly: true        ← JavaScript 不可读取（防 XSS 窃取）
  - secure: true          ← 仅 HTTPS 传输（生产环境）
  - sameSite: "lax"      ← 防 CSRF（跨站请求不携带）
  - path: "/"             ← 全站可用
  - maxAge: 7 天          ← 与 Token exp 一致
```

### CSRF / 同源写入防护

`src/middleware.ts` 会对非公开 API 的 `POST`、`PUT`、`PATCH`、`DELETE` 请求执行同源校验：

- 优先检查 `Origin`，缺失时回退检查 `Referer`。
- 允许来源包括当前请求 origin、`APP_URL`、反向代理传入的 `x-forwarded-host` / `host`。
- 跨源写请求直接返回 403，再进入具体 API 鉴权前就被拦截。
- 公开认证入口（登录、注册、邮箱验证、密码重置等）仍按各自限流和 payload 限制处理。

该策略与 `sameSite: "lax"` 共同覆盖后台操作、个人资料修改、投稿、活动报名、纠错审核等敏感写入。

### 安全跳转防护

```typescript
// src/lib/auth-utils.ts
export function safeRedirect(value: unknown, fallback = "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||      // 只允许站内相对路径
    value.startsWith("//") ||      // 防协议相对 URL（//evil.com）
    value.includes("\\")           // 防路径穿越
  ) {
    return fallback;
  }
  return value;
}
```

> **为什么检查 `//`？** 攻击者可以利用 `//evil.com` 这种协议相对 URL 进行开放重定向攻击。

---

## 待审计项 (Security Roadmap)

- [x] 应用层开启 CSP Report-Only header
- [x] 应用层开启 HSTS (HTTP Strict Transport Security)
- [x] 对非公开 API 写请求增加 Origin/Referer 同源校验
- [ ] 生产环境通过浏览器控制台或上报日志确认 CSP 无误伤后，切换为正式 `Content-Security-Policy`
- [ ] 添加请求频率异常告警（同上 IP 在多个账号间切换）
- [ ] Admin 操作双因素认证（可选）
- [ ] 定期依赖审计（`npm audit`）

---

<p align="center">
  <sub>Security Document · V2.0 · Last updated: June 2026</sub>
</p>
