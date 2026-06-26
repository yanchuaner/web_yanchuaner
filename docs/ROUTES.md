# 路由清单 V2.0

## 权限标记

| 标记 | 说明 |
|------|------|
| 公开 | 无需任何凭据即可访问 |
| 登录用户 | 需要个人账号登录（httpOnly cookie: `yc_access_token`, role=user） |
| 认证校友 | 需要账号已通过校友认证（role=ALUMNI, status=VERIFIED），或管理员 |
| 管理员 | 需要数据库管理员账号登录（role=ADMIN） |

---

## V2.0 新增功能速览

| 功能 | 涉及路由 | 说明 |
|------|----------|------|
| 站内故事投稿 | `POST /api/stories` | 登录用户在站内直接撰写、提交故事，替代旧版邮箱投稿 |
| 投稿状态追踪 | `GET /api/me/posts` | 用户在「我的投稿」查看 PENDING/PUBLISHED/REJECTED/DRAFT 状态 |
| 投稿撤回/删除 | `DELETE /api/stories/[id]` | 作者可在 PENDING/DRAFT 状态下撤回或删除自己的投稿 |
| 管理员审稿队列 | `GET /api/admin/stories/pending` | 管理员查看所有待审核故事（含作者信息） |
| 管理员审稿操作 | `PATCH /api/admin/stories/[id]/review` | 管理员审核通过 (PUBLISHED) 或驳回 (REJECTED)，事务写入 AuditLog |
| Payload 安全限制 | 全局 `readJsonBody` | 所有 API 路由统一校验请求体大小，防止大 payload DOS |

---

## 前台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 公开 | 首页（最新动态、校友寄语） |
| `/login` | 公开 | 普通用户与管理员共用登录页 |
| `/register` | 公开 | 用户注册（用户名、密码、邮箱、姓名、届别、班级） |
| `/verify-email` | 公开 | 邮箱验证（一次性 Token） |
| `/reset-password` | 公开 | 密码重置（一次性 Token） |
| `/about` | 公开 | 学校介绍（航天特色、办学理念、时间线，数据库驱动） |
| `/news` | 公开 | 新闻列表 |
| `/news/[id]` | 公开 | 新闻详情 |
| `/events` | 公开 | 活动列表（含封面图） |
| `/events/[id]` | 公开 | 活动详情与在线报名 |
| `/contact` | 公开 | 联系我们（数据库驱动，管理员可编辑） |
| `/teachers` | 公开 | 教师频道（数据库驱动，管理员可编辑版块） |
| `/students` | 公开 | 在校生资源站首页（数据库驱动，管理员可编辑卡片） |
| `/students/application-guide` | 公开 | 志愿填报参考 |
| `/students/university-insights` | 公开 | 大学与专业观察 |
| `/students/senior-qa` | 公开 | 学长问答 |
| `/students/learning-methods` | 公开 | 学习方法 |
| `/students/alumni-messages` | 公开 | 校友寄语 |
| `/me` | 登录用户 | 个人中心首页（姓名、邮箱、角色、认证状态） |
| `/me/edit` | 登录用户 | 编辑资料（修改用户名、联系方式） |
| `/me/posts` | 登录用户 | 我的投稿列表（显示状态：PENDING/PUBLISHED/REJECTED/DRAFT，支持撤销/删除） |
| `/me/change-password` | 登录用户 | 修改密码（成功后旧会话失效） |
| `/alumni/certificate` | 认证校友 | 电子校友纪念卡（姓名+班级验证，生成专属卡片） |
| `/alumni/university-map` | 认证校友 | 校友大学城市分布地图（Leaflet + 城市聚合 + 校友明细） |
| `/alumni/radar` | 认证校友 | 重定向至 `/alumni/university-map` |
| `/alumni/memories` | 认证校友 | 燕中记忆文化长廊（数据库驱动，16:9 图片展示） |
| `/alumni/stories` | 认证校友 | 燕中故事（数据库驱动 + 站内投稿表单） |
| `/alumni/achievements` | 认证校友 | 校友成就墙（类别筛选，仅展示已发布记录） |
| `/alumni/correction` | 认证校友 | 校友信息修改申请（搜索姓名 → 提交修改） |

> 未登录访问受保护页面时，middleware 自动跳转至 `/login?redirect=<原路径>`。
> 校友数据 API 通过 `requireVerifiedAlumni()` 保护。未登录时返回 401，未通过校友认证时返回 403。

---

## 后台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/admin` | 管理员 | 后台控制面板（统计概览） |
| `/admin/news` | 管理员 | 新闻管理列表 |
| `/admin/news/new` | 管理员 | 新建新闻 |
| `/admin/news/[id]` | 管理员 | 编辑新闻 |
| `/admin/events` | 管理员 | 活动管理列表 |
| `/admin/events/new` | 管理员 | 新建活动 |
| `/admin/events/[id]` | 管理员 | 编辑活动 |
| `/admin/events/[id]/registrations` | 管理员 | 活动报名名单（查看 + CSV 导出） |
| `/admin/alumni` | 管理员 | 校友名单管理（CRUD + CSV 导入/导出） |
| `/admin/alumni-corrections` | 管理员 | 校友信息修改申请审核（筛选、通过/驳回） |
| `/admin/memories` | 管理员 | 燕中记忆管理（CRUD、排序、图片上传） |
| `/admin/stories` | 管理员 | 燕中故事管理（含待审核队列、审核操作） |
| `/admin/achievements` | 管理员 | 校友成就墙管理（CRUD、发布状态、排序） |
| `/admin/teachers` | 管理员 | 教师频道管理（版块 CRUD、排序） |
| `/admin/content` | 管理员 | 页面内容管理（about/contact/students/teachers 统一管理） |
| `/admin/posts` | 管理员 | 投稿管理（旧版 Post 模型） |
| `/admin/users` | 管理员 | 用户管理（用户列表、认证审核、账号操作） |
| `/admin/user-claims` | 管理员 | 旧资料认领审核 |

---

## API 路由

### Payload 安全限制

所有接受 JSON Body 的 API 路由统一通过 `readJsonBody()` 校验请求体大小。该函数位于 `src/lib/auth-utils.ts`，同时检查 `Content-Length` 请求头和实际 `arrayBuffer()` 字节数。超限时返回 `{ error: "PAYLOAD_TOO_LARGE" }`。

| 限制等级 | 大小 | 适用路由 |
|----------|------|----------|
| 基础校验 | 4 KB | `auth/login`, `auth/verify-email`, `auth/resend-verification`, `auth/forgot-password`, `events/[id]`, `test-email`, `admin/users/[id]/actions` |
| 标准默认 | 16 KB | 大多数路由（未显式传参时），如 `auth/register`, `admin/news`, `admin/events`, `admin/alumni`, `admin/memories`, `admin/alumni-corrections/[id]`, `admin/achievements`, `admin/content`, `admin/teachers`, `admin/user-claims/[id]`, `admin/stories/[id]/review`, `admin/posts`, `me/profile`, `me/change-password` |
| 中等容量 | 64 KB | `posts`（旧版投稿：title 200 字 + content 20000 字） |
| 富文本容量 | 512 KB | `stories`（用户投稿）, `admin/stories`（管理员创建/编辑故事） |

---

### 认证 API

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/auth/register` | 公开（限流） | POST | 16 KB | 注册账号（username, password, email, name, graduationClass, className, contact） |
| `/api/auth/login` | 公开（限流） | POST | 4 KB | 用户名/密码登录，返回 httpOnly cookie |
| `/api/auth/logout` | 登录用户 | POST | — | 清除登录 cookie |
| `/api/auth/me` | 登录用户 | GET | — | 获取当前登录用户信息 |
| `/api/auth/verify-email` | 公开 | POST | 4 KB | 一次性 Token 验证邮箱 |
| `/api/auth/resend-verification` | 公开（限流） | POST | 4 KB | 重发邮箱验证邮件 |
| `/api/auth/forgot-password` | 公开（限流） | POST | 4 KB | 申请密码重置邮件 |
| `/api/auth/reset-password` | 公开 | POST | 16 KB | 一次性 Token 重置密码 |
| `/api/auth/graduation-classes` | 公开 | GET | — | 获取去重后的届别列表 |

---

### 公开 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/health` | 公开 | GET | 健康检查 |
| `/api/news` | 公开 | GET | 公开新闻列表 |
| `/api/news/[id]` | 公开 | GET | 新闻详情 |
| `/api/events` | 公开 | GET | 公开活动列表 |
| `/api/events/[id]` | 公开 | GET | 活动详情 |
| `/api/memories` | 公开 | GET | 燕中记忆展品列表（含图片存在性检查） |
| `/api/stories` | 公开 | GET | 燕中故事列表（仅返回 status=PUBLISHED 的故事，按日期降序） |
| `/api/stories` | 登录用户（限流） | POST | **512 KB** | 站内提交故事（status 强制 PENDING，绑定当前用户 authorId） |
| `/api/stories/[id]` | 公开 | GET | 故事详情 |
| `/api/stories/[id]` | 作者本人 | DELETE | 撤回/删除自己的投稿（仅 PENDING/DRAFT 状态可操作） |
| `/api/test-email` | 公开（仅开发调测） | POST | 4 KB | 测试邮件发送通道以确认 Resend API 联调状态 |

> [!NOTE]
> **V2.0 故事投稿工作流**：`/api/stories` 的 GET 和 POST 是两套权限模型。GET 是公开只读（仅已发布），POST 要求登录用户且创建的故事强制 PENDING 状态。作者可在 `/me/posts` 查看投稿状态，管理员通过 `/api/admin/stories/pending` 审核。

---

### 旧版投稿 API

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/posts` | 认证校友或管理员（限流） | POST | 64 KB | 旧版投稿入口（title ≤200, content ≤20000, type: STORY/EVENT/JOB） |

> 旧版 Post 模型投稿接口，新功能建议使用 `/api/stories`。管理员仍可通过 `/admin/posts` 管理旧投稿。

---

### 校友 API（需认证校友或管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/alumni/search` | 认证校友 | GET | 校友搜索（按姓名/届别/标签） |
| `/api/alumni/verify` | 认证校友 | GET | 校友身份验证（姓名+班级） |
| `/api/alumni/map` | 认证校友 | GET | 校友地图数据（姓名+城市聚合） |
| `/api/alumni/city-stats` | 认证校友 | GET | 校友城市聚合统计（含成员明细：姓名、大学、专业、班级） |
| `/api/alumni/correction-requests` | 认证校友 | POST | 提交校友信息修改申请（含限流） |
| `/api/alumni/certificate/upload-bg` | 管理员 | POST | 上传校友证背景图 |

---

### 个人中心 API（登录用户）

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/me/profile` | 登录用户 | GET | — | 获取个人资料 |
| `/api/me/profile` | 登录用户 | PATCH | 16 KB | 修改个人资料（仅可修改用户名和联系方式） |
| `/api/me/posts` | 登录用户 | GET | — | 我的投稿列表（包含 status 状态、tags、创建时间，用于撤稿/删除操作） |
| `/api/me/change-password` | 登录用户 | POST | 16 KB | 修改密码（旧密码验证，sessionVersion 递增使旧会话失效） |

---

### 图片上传 API（管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/upload` | 管理员 | POST | 通用图片上传（新闻/活动封面） |
| `/api/settings/card-bg/upload` | 管理员 | POST | 校友纪念卡默认背景上传（16:9，Sharp 裁切） |

---

### 后台管理 API（管理员）

#### 统计与概览

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/admin/stats` | 管理员 | GET | 后台统计概览 |

#### 新闻管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/news` | 管理员 | GET | — | 新闻列表 |
| `/api/admin/news` | 管理员 | POST | 16 KB | 新建新闻 |
| `/api/admin/news/[id]` | 管理员 | GET | — | 新闻详情 |
| `/api/admin/news/[id]` | 管理员 | PUT | 16 KB | 编辑新闻 |
| `/api/admin/news/[id]` | 管理员 | DELETE | — | 删除新闻 |

#### 活动管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/events` | 管理员 | GET | — | 活动列表 |
| `/api/admin/events` | 管理员 | POST | 16 KB | 新建活动 |
| `/api/admin/events/[id]` | 管理员 | GET | — | 活动详情 |
| `/api/admin/events/[id]` | 管理员 | PUT | 16 KB | 编辑活动 |
| `/api/admin/events/[id]` | 管理员 | DELETE | — | 删除活动 |
| `/api/admin/events/[id]/registrations` | 管理员 | GET | — | 活动报名名单（支持 CSV 导出） |

#### 校友管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/alumni` | 管理员 | GET | — | 校友名单列表 |
| `/api/admin/alumni` | 管理员 | POST | 16 KB | 新增校友 |
| `/api/admin/alumni/[id]` | 管理员 | PUT | 16 KB | 编辑校友信息 |
| `/api/admin/alumni/[id]` | 管理员 | DELETE | — | 删除校友 |
| `/api/admin/alumni/import` | 管理员 | POST | — | CSV 批量导入校友（按 name+graduationClass+className+email 去重） |

#### 校友修改申请审核

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/alumni-corrections` | 管理员 | GET | — | 修改申请列表（支持按状态筛选） |
| `/api/admin/alumni-corrections/[id]` | 管理员 | PATCH | 16 KB | 审核修改申请（通过并应用 / 驳回） |

#### 投稿管理（旧版 Post 模型）

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/posts` | 管理员 | GET | — | 投稿列表 |
| `/api/admin/posts` | 管理员 | POST | 16 KB | 新建投稿 |
| `/api/admin/posts/[id]` | 管理员 | PUT | 16 KB | 编辑投稿 |
| `/api/admin/posts/[id]` | 管理员 | DELETE | — | 删除投稿 |

#### 燕中记忆管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/memories` | 管理员 | GET | — | 展品列表 |
| `/api/admin/memories` | 管理员 | POST | 16 KB | 新建展品 |
| `/api/admin/memories/[id]` | 管理员 | PUT | 16 KB | 编辑展品（支持部分更新） |
| `/api/admin/memories/[id]` | 管理员 | DELETE | — | 删除展品 |

#### 燕中故事管理（V2.0 CMS 工作流）

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/stories` | 管理员 | GET | — | 故事列表（全部状态） |
| `/api/admin/stories` | 管理员 | POST | **512 KB** | 新建故事（管理员直接创建，无需审核） |
| `/api/admin/stories/[id]` | 管理员 | PUT | **512 KB** | 编辑故事内容 |
| `/api/admin/stories/[id]` | 管理员 | DELETE | — | 删除故事 |
| `/api/admin/stories/pending` | 管理员 | GET | — | 🆕 **待审核队列**：获取所有 status=PENDING 的故事（含作者姓名、用户名、邮箱、届别、班级） |
| `/api/admin/stories/[id]/review` | 管理员 | PATCH | 16 KB | 🆕 **审核操作**：设置 status=PUBLISHED 或 REJECTED，事务写入 AuditLog |

> [!IMPORTANT]
> **V2.0 CMS 故事审核工作流**：
> 1. 用户在 `/alumni/stories` 页面通过 `POST /api/stories` 提交故事，状态自动设为 PENDING。
> 2. 管理员在 `/admin/stories` 看到待审核队列（调用 `GET /api/admin/stories/pending`），含作者身份信息。
> 3. 管理员调用 `PATCH /api/admin/stories/[id]/review` 通过或驳回。
> 4. 审核通过后故事状态变为 PUBLISHED，`GET /api/stories` 公开可见。
> 5. 用户在 `/me/posts` 实时查看投稿状态。
> 6. 审核操作在 `auditLog` 表中记录，与故事状态更新在同一 Prisma 事务中执行。

#### 校友成就墙管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/achievements` | 管理员 | GET | — | 成就列表 |
| `/api/admin/achievements` | 管理员 | POST | 16 KB | 新建成就 |
| `/api/admin/achievements/[id]` | 管理员 | PUT | 16 KB | 编辑成就 |
| `/api/admin/achievements/[id]` | 管理员 | DELETE | — | 删除成就 |

#### 页面内容管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/content` | 管理员 | GET | — | 内容列表（?page=xxx 按页面筛选） |
| `/api/admin/content` | 管理员 | POST | 16 KB | 新建内容 |
| `/api/admin/content/[id]` | 管理员 | PUT | 16 KB | 编辑内容 |
| `/api/admin/content/[id]` | 管理员 | DELETE | — | 删除内容 |

#### 教师频道管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/teachers` | 管理员 | GET | — | 版块列表 |
| `/api/admin/teachers` | 管理员 | POST | 16 KB | 新建版块 |
| `/api/admin/teachers/[id]` | 管理员 | PUT | 16 KB | 编辑版块 |
| `/api/admin/teachers/[id]` | 管理员 | DELETE | — | 删除版块 |

#### 用户管理

| 路由 | 权限 | 方法 | Payload 限制 | 说明 |
|------|------|------|-------------|------|
| `/api/admin/users` | 管理员 | GET | — | 用户列表 |
| `/api/admin/users/[id]/actions` | 管理员 | POST | 4 KB | 用户管理操作（见下方操作表） |
| `/api/admin/user-claims` | 管理员 | GET | — | 旧资料认领申请列表 |
| `/api/admin/user-claims/[id]` | 管理员 | GET | — | 认领申请详情 |
| `/api/admin/user-claims/[id]` | 管理员 | PATCH | 16 KB | 审核认领申请 |

### 管理员用户操作 API

`POST /api/admin/users/[id]/actions` 支持以下操作：

| 操作 | action 值 | 说明 |
|------|-----------|------|
| 通过校友认证 | `approve-alumni` | 将用户升为 ALUMNI/VERIFIED，同步联系方式到校友名单 |
| 撤销校友认证 | `reject-alumni` | 将校友降为 GUEST/PENDING |
| 停用账号 | `disable-account` | accountStatus=DISABLED，所有会话失效 |
| 恢复账号 | `enable-account` | accountStatus=ACTIVE |
| 强制退出所有设备 | `logout-all-sessions` | sessionVersion+1，所有旧 token 失效 |
| 提升为管理员 | `grant-admin` | 授予 ADMIN 角色 |
| 撤销管理员 | `revoke-admin` | 撤销 ADMIN 角色（不能撤销自己） |
| 重发验证邮件 | `resend-verification` | 管理员代为触发验证邮件 |
| 发送密码重置邮件 | `send-reset-password` | 管理员代为触发重置邮件 |

所有操作均记录到 AuditLog 表，与业务变更在同一事务中写入。

> [!IMPORTANT]
> **超级管理员 (Root Admin) 防越权机制**
> - 超级管理员唯一邮箱标识：`yanchuaner@yanchuaner.cn`。
> - 当执行 `disable-account`（停用）、`revoke-admin`（撤销管理员）、`reject-alumni`（撤销校友/驳回）和 `approve-alumni`（通过）这些敏感操作时，若目标账号角色已经是 `ADMIN`，系统会严格校验当前操作者是否为超级管理员本人。
> - 非超级管理员（普通管理员）操作同行管理员会直接返回 `403 Forbidden`（提示："权限不足：普通管理员无法停用或撤销其他管理员"）。这防御了同级管理员之间的横向越权攻击。

---

## 认证机制说明

### 用户会话

- Cookie 名：`yc_access_token`
- Token 格式：`HMAC-SHA256(base64url(JSON payload))`，v3
- Payload 包含：用户 ID（userId）、会话版本（sessionVersion）、角色（role: "user" | "admin"）、过期时间（exp）
- sessionVersion 在修改密码、停用账号、强制退出所有设备时递增，旧 token 立即失效

### 权限等级

| 等级 | 登录 | 公开数据 | 校友数据 | 管理后台 |
|------|------|----------|----------|----------|
| 未登录 | 否 | 是 | 否 | 否 |
| 已注册（邮箱已验证） | 是 | 是 | 否 | 否 |
| 已认证校友 | 是 | 是 | 是 | 否 |
| 管理员 | 是 | 是 | 是 | 是 |

### 认证函数

| 函数 | 用途 | 文件 |
|------|------|------|
| `requireAdmin()` | 仅管理员通过，用于 `/api/admin/*` | `src/lib/admin-auth.ts` |
| `requireVerifiedAlumni()` | 已认证校友或管理员通过，用于 `/api/alumni/*` | `src/lib/admin-auth.ts` |
| `requireUser()` | 任何登录用户通过 | `src/lib/admin-auth.ts` |
| `getAuthenticatedUser()` | 获取当前用户信息，未登录返回 null | `src/lib/admin-auth.ts` |
| `requirePageUser()` / `requirePageAdmin()` | 服务端组件鉴权，未登录自动 redirect | `src/lib/admin-auth.ts` |

### 邮箱验证和校友认证

邮箱验证和校友认证是两个独立状态：
- **邮箱验证**（emailVerified）：用户能否登录。通过点击验证邮件中的链接完成。
- **校友认证**（status: VERIFIED）：用户能否访问校友专属内容。注册时姓名+届别+班级+邮箱匹配名册则自动认证，否则由管理员后台审核。

### 未登录或凭据过期

- **页面**：middleware 自动跳转至 `/login?redirect=<原路径>`
- **API**：返回 `{ error: "Unauthorized" }`，HTTP 401

---

## 个人中心

| 路由 | 功能 | 可修改字段 | 只读字段 |
|------|------|------------|----------|
| `/me` | 个人中心首页 | — | 姓名、邮箱、用户名、届别、班级、认证状态 |
| `/me/edit` | 编辑资料 | 用户名、联系方式 | 姓名、邮箱、届别、班级 |
| `/me/posts` | 投稿列表 | — | 标题、正文摘要、标签、状态 (PENDING/PUBLISHED/REJECTED/DRAFT)、创建时间 |
| `/me/change-password` | 修改密码 | 密码 | — |

修改密码后 sessionVersion 递增，所有设备需重新登录。
变更管理员角色、账号状态或密码时，旧会话也会失效。

---

## 页面内容管理说明

### 统一内容管理（`/admin/content`）

通过 `/admin/content` 页面可以管理以下前端页面的内容：

| 页面标识 | 对应页面 | 内容类型 |
|----------|----------|----------|
| `about_features` | `/about` 学校介绍 | 特色卡片（icon + 标题 + 描述） |
| `about_timeline` | `/about` 学校介绍 | 发展历程时间线（年份 + 事件描述） |
| `contact` | `/contact` 联系我们 | 联系信息区块（icon + 标题 + 描述 + 链接） |
| `students` | `/students` 在校生资源站 | 资源卡片（icon + 标题 + 描述 + 跳转链接） |
| `teachers` | `/teachers` 教师频道 | 版块卡片（icon + 标题 + 描述 + 备注 + 链接） |

所有内容数据来自 `ContentSection` 表，以 `page` 字段区分归属，`sortOrder` 控制排序。

### 燕中故事管理（V2.0 CMS 工作流）

`/alumni/stories` 页面现在是完整的站内 CMS 系统：

- **前台**：用户通过站内表单 `POST /api/stories` 直接提交故事，无需邮箱。提交后状态为 PENDING。
- **状态追踪**：用户在 `/me/posts` 查看投稿状态（PENDING 待审 / PUBLISHED 已发布 / REJECTED 已驳回 / DRAFT 草稿）。可撤销或删除自己的 PENDING/DRAFT 投稿。
- **管理员审核**：管理员通过 `/admin/stories` 查看待审核队列（`GET /api/admin/stories/pending`），可逐一审核通过或驳回（`PATCH /api/admin/stories/[id]/review`），操作记录写入 AuditLog。
- **公开展示**：`GET /api/stories` 仅返回 status=PUBLISHED 的故事，支持标签筛选。
- **Payload 安全**：故事正文使用 512 KB 上限的 `readJsonBody`，支持富文本内容。审核操作使用 16 KB 默认限制。

### 旧版 Post 投稿

`/api/posts` 是旧版投稿接口，Post 模型独立于 Story 模型。新功能优先使用 `/api/stories`。管理员仍可通过 `/admin/posts` 管理历史投稿数据。

### 校友成就墙管理（`/admin/achievements`）

校友成就数据来自 `Achievement` 表。管理员可维护校友姓名、届别、成就标题、类别、简介、机构、年份、排序和发布状态；前台 `/alumni/achievements` 仅展示状态为 `PUBLISHED` 的记录，并支持按类别筛选。

### 燕中记忆管理

`/alumni/memories` 页面需登录并通过校友认证。展品数据来自 `MemoryItem` 数据库表，由管理员通过 `/admin/memories` 后台可视化维护（CRUD、排序、图片上传）。上传图片自动裁切为 16:9（2752x1548）。前台页面标记为 `force-dynamic`，管理员更新后刷新即生效。

### 用户管理（`/admin/users`）

管理员可查看用户列表、审核校友认证、停用/恢复账号、强制退出设备、提升/撤销管理员。敏感操作记录到 AuditLog。

---

## force-dynamic 标记的 API 路由

以下 11 个 API 路由文件显式声明 `export const dynamic = 'force-dynamic'`，确保每次请求都重新执行服务端逻辑（不依赖 Next.js 静态缓存）：

| 路由文件 | 原因 |
|----------|------|
| `api/health` | 健康检查需实时反映服务状态 |
| `api/events` | 活动列表需实时反映数据库变更 |
| `api/memories` | 记忆展品列表需实时反映管理员更新 |
| `api/news` | 新闻列表需实时反映数据库变更 |
| `api/stories` | 故事列表需实时反映 CMS 审核状态变更 |
| `api/alumni/verify` | 校友验证需实时数据库查询 |
| `api/alumni/search` | 校友搜索需实时数据库查询 |
| `api/alumni/city-stats` | 城市统计需实时聚合查询 |
| `api/auth/graduation-classes` | 届别列表需实时反映新增注册 |
| `api/admin/stories/pending` | 待审核队列需实时反映新投稿 |
| `api/me/posts` | 用户投稿列表需实时反映个人投稿状态变更 |
