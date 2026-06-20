# 认证系统重构 + 个人中心实施方案（优化版）

## 一、项目目标

### 当前状态

燕川中学校友数字母港目前使用共享口令 Gatekeeper 保护全站，没有真正的个人账号体系。

现有 `User` 表主要保存 Join 流程产生的姓名、联系方式、身份申请内容、校友角色、审核状态和投稿关联，没有用户名、密码、邮箱和独立的账号状态。

### 本次目标

将共享口令升级为个人账号体系，增加：

- 用户注册、邮箱验证和个人登录
- 忘记密码与密码重置
- 个人中心和我的投稿
- 老用户资料认领
- 管理后台账号管理
- 完整的页面和 API 权限保护

同时保留现有内容、页面风格和主要业务功能。

### 已确认的产品决策

- 邮件服务使用 Resend。
- 共享访问口令最终完全下线。
- 只有首页 `/` 和关于页 `/about` 对游客公开。
- 登录、注册、验证邮箱、重置密码页面允许游客访问。
- 「入轨联络舱」标题保持不变，功能改为注册入口。
- 「加入我们」文案保持不变，按钮跳转注册页面。
- 老用户可以发起旧资料认领，但不能只凭姓名和届别直接取得账号。

---

## 二、统一账号规则

### 2.1 区分三种状态

系统必须区分：

1. **账号状态**
   - `ACTIVE`：账号可以使用
   - `DISABLED`：账号被管理员停用

2. **邮箱状态**
   - `emailVerified = null`：邮箱未验证
   - `emailVerified != null`：邮箱已验证

3. **校友认证状态**
   - `PENDING`：等待认证
   - `VERIFIED`：认证通过
   - `REJECTED`：认证未通过

邮箱验证只能证明用户拥有该邮箱，不能证明用户是某位校友。

### 2.2 登录和访问规则

| 用户状态 | 可以登录 | 可以访问 |
|---|---:|---|
| 邮箱未验证 | 否 | 公开页面、邮箱验证、重发邮件 |
| 邮箱已验证、校友认证待审核 | 是 | 普通账号功能 |
| 邮箱已验证、校友认证通过 | 是 | 普通功能和校友隐私功能 |
| 校友认证被拒绝 | 是 | 普通账号功能，不开放校友隐私数据 |
| 账号被停用 | 否 | 旧登录也立即失效 |

> 校友认证被拒绝不等于封禁账号。需要禁止用户登录时，管理员应单独停用账号。

### 2.3 权限层级

- 游客：只能访问公开页面。
- 普通用户：邮箱已验证并登录。
- 已认证校友：普通用户权限 + 校友隐私功能。
- 管理员：登录后默认进入 `/admin` 管理后台，同时可以访问 `/me/*` 个人中心和所有已认证校友功能。

`User.role`（GUEST / ALUMNI / ADMIN）决定 Token 中的登录角色：ADMIN 映射为 `"admin"`，GUEST 和 ALUMNI 映射为 `"user"`。登录后通过查询数据库获得最新角色、校友认证状态和 `accountStatus`。

任何角色变化（包括提升为管理员、取消管理员、GUEST 与 ALUMNI 之间变化）都必须同时增加 `sessionVersion`，使旧 Token 立即失效。不能只修改数据库角色而继续允许旧 Token 使用。

---

## 三、安全原则

### 3.1 页面跳转不等于权限保护

`AuthProvider` 只负责显示用户状态、控制导航和改善跳转体验，不能作为真正的权限控制。

真正的保护必须在服务端：

- middleware 拦截未登录的页面请求。
- 每个敏感 API 再次检查权限。
- `/api/me/*` 检查当前用户身份。
- `/api/admin/*` 检查管理员身份。
- 校友搜索、地图和通讯录等接口检查校友认证状态。

### 3.2 登录状态支持强制失效

User 增加 `sessionVersion`。普通用户 Token 包含：

- `userId`
- 登录角色
- `sessionVersion`
- 过期时间

服务端鉴权时同时检查数据库账号状态和 `sessionVersion`。

以下操作增加 `sessionVersion`，让所有旧 Token 失效：

- 修改密码
- 重置密码
- 管理员停用账号
- 管理员执行“退出所有设备”
- 用户角色发生任何变化
- 发现账号安全风险

### 3.3 一次性 Token 不明文保存

邮箱验证 Token 和密码重置 Token：

- 邮件中发送原始随机 Token。
- 数据库只保存 Token 的 SHA-256 哈希。
- Token 使用密码学安全随机数生成，建议至少 32 字节。
- 使用后立即清除。
- 生成新 Token 时旧 Token 自动失效。

建议字段：

- `emailVerifyTokenHash`
- `passwordResetTokenHash`

### 3.4 输入规则

- 用户名和邮箱先 `trim`，再转小写保存。
- 用户名长度 3～32 个字符。
- 用户名只允许字母、数字、下划线和短横线。
- 密码长度 8～64 个字符。
- 所有请求字段设置最大长度。
- bcrypt cost 固定为 12。
- 服务端使用字段白名单，不允许客户端任意更新数据库字段。

---

## Phase 0：数据盘点与迁移准备

正式修改 Schema 前完成：

1. 备份生产数据库和上传文件。
2. 统计现有 User 总数、重名数、联系方式为空数和投稿关联数。
3. 确认现有 User 没有独立届别字段的问题。
4. 制定旧数据认领规则。
5. 准备迁移回滚方案。

### 旧数据限制

当前 Join 流程没有把届别单独写入 User，所以现在不能直接使用：

```text
User.name + User.graduationClass
```

认领已有记录。迁移脚本可以整理已有数据，但不能自动猜测无法确认的信息。

### 迁移脚本

新增 `scripts/migrate_users.ts`：

- 扫描旧 User。
- 标记可能重复的记录。
- 输出待人工核对 CSV。
- 输出没有联系方式、无法自动认领的记录。
- 不自动生成弱密码。
- 不自动合并同名记录。

---

## Phase 1：数据库和基础设施

### 1.1 新依赖

`package.json` 新增：

- `bcryptjs`
- `resend`

先确认 `bcryptjs` 当前版本是否已经内置类型，只有确实需要时才增加 `@types/bcryptjs`。

### 1.2 User 模型扩展

**文件**：[prisma/schema.prisma](prisma/schema.prisma)

计划增加：

```prisma
username                   String?   @unique
passwordHash               String?
email                      String?   @unique
emailVerified              DateTime?
emailVerifyTokenHash       String?
emailVerifyExpiresAt       DateTime?
passwordResetTokenHash     String?
passwordResetExpiresAt     DateTime?
graduationClass            String?
className                  String?
accountStatus              String    @default("ACTIVE")
sessionVersion             Int       @default(0)
claimedAt                  DateTime?
mergedIntoUserId           String?
mergedIntoUser             User?     @relation("UserMerged", fields: [mergedIntoUserId], references: [id])
mergedUsers                User[]    @relation("UserMerged")

auditLogs                  AuditLog[]         @relation("AuditLogAdmin")
claimRequests              UserClaimRequest[] @relation("ClaimRequestClaimant")
oldUserClaimRequests       UserClaimRequest[] @relation("ClaimRequestOldUser")
reviewedClaimRequests      UserClaimRequest[] @relation("ClaimRequestReviewer")
```

说明：

- 新认证字段暂时允许为空，兼容旧 User。
- `status` 继续表示校友认证状态。
- `accountStatus` 表示账号是否允许登录。
- `role` 取值扩展为 `GUEST / ALUMNI / ADMIN`。管理员对应数据库中的一条 User 记录，Token 中包含 `userId`，可以正常访问 `/me/*`。
- `mergedIntoUserId` 只用于旧 User，记录它最终合并到了哪个新账号。
- Prisma 的每个命名关系都必须在 User 模型中声明对应的反向关系，否则 Schema 校验和迁移会失败。
- 为 Token 哈希、邮箱验证状态和届别增加必要索引。

### 1.3 审计日志模型

新增 `AuditLog`，记录管理员敏感操作的完整链路：

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  action     String   // "approve-alumni" | "reject-alumni" | "disable-account" | "enable-account" | "logout-all-sessions" | "approve-claim" | "reject-claim"
  targetType String   // "User" | "UserClaimRequest"
  targetId   String
  adminId    String
  admin      User     @relation("AuditLogAdmin", fields: [adminId], references: [id])
  before     String?  // 操作前 JSON 快照
  after      String?  // 操作后 JSON 快照
  createdAt  DateTime @default(now())
}
```

审计要求：

- 账号停用、启用、校友认证审批/驳回、认领审批/驳回、退出所有设备 —— 全部写入 AuditLog。
- 审计写入与业务操作在同一事务中完成，不允许只完成操作但漏写日志。
- AuditLog 只能由服务端写入，不存在任何公开或用户可调的创建入口。
- `before` 和 `after` 只能保存经过字段白名单过滤的业务状态，禁止保存密码哈希、邮箱验证 Token 哈希、密码重置 Token 哈希、Cookie、完整登录 Token、`SESSION_SECRET` 或其他密钥。
- 审计日志页面不得展示上述敏感字段，服务端日志也不能输出原始 Token。

### 1.4 旧资料认领申请模型

新增 `UserClaimRequest`，作为“旧资料认领申请单”：

```prisma
model UserClaimRequest {
  id              String    @id @default(uuid())
  claimantUserId  String
  claimant        User      @relation("ClaimRequestClaimant", fields: [claimantUserId], references: [id])
  oldUserId       String?
  oldUser         User?     @relation("ClaimRequestOldUser", fields: [oldUserId], references: [id])
  description     String?
  status          String    @default("PENDING")
  adminNote       String?
  reviewedById    String?
  reviewedBy      User?     @relation("ClaimRequestReviewer", fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

关系说明：

- `claimant`：提出申请的当前用户。
- `oldUser`：管理员选择的被认领旧 User（审批前可为空）。
- `reviewedBy`：执行审核的管理员。

约束：

- 同一新账号同一时间只能有一条 `PENDING` 申请，在应用层校验（SQLite 不支持部分唯一索引 `WHERE status='PENDING'`）。
- 已合并的旧 User（`mergedIntoUserId` 非空）不能再次作为 `oldUserId`，在认领事务中校验。
- 认领申请不能由客户端直接指定 `status` 或 `reviewedById`。

### 1.5 环境变量

**文件**：[.env.example](.env.example)

新增：

```env
APP_URL="https://yanchuaner.cn"
RESEND_API_KEY="re_xxxxxx"
RESEND_FROM_EMAIL="燕中数字母港 <noreply@yanchuaner.cn>"
```

要求：

- 邮件链接只使用受信任的 `APP_URL`。
- 不根据用户请求中的 Host 拼接邮件链接。
- 新系统稳定上线后再移除旧共享口令配置。
- 切换期间保留回滚能力。

### 1.6 邮件工具

新增 [src/lib/email.ts](src/lib/email.ts)，提供：

- `sendVerificationEmail`
- `sendPasswordResetEmail`

邮件发送失败时：

- 账号可以保留。
- API 返回 `emailSent: false`。
- 页面不能显示“验证邮件已发送”。
- 页面显示“账号已创建，但邮件发送失败，请稍后重新发送”。

---

## Phase 2：统一认证核心

### 2.1 Token v3

**文件**：[src/lib/verify-token.ts](src/lib/verify-token.ts)

Token Payload 包含：

```text
v
role
userId
sessionVersion
exp
```

- Token 统一包含 `userId`，管理员也不例外。
- 管理员对应数据库中的一条 User 记录，`role = "ADMIN"`。
- 管理员可以访问 `/me/*` 个人中心，按常规 `userId` 查询。
- 不再签发 `access` 共享口令 Token。

### 2.2 服务端鉴权函数

扩展或拆分 [src/lib/admin-auth.ts](src/lib/admin-auth.ts)：

- `requireAdmin`
- `requireUser`
- `requireVerifiedAlumni`
- `getAuthenticatedUser`

`requireUser` 必须检查：

- User 是否存在
- `accountStatus` 是否为 `ACTIVE`
- 邮箱是否已验证
- Token 的 `sessionVersion` 是否和数据库一致

### 2.3 middleware

**文件**：[src/middleware.ts](src/middleware.ts)

采用公开白名单，而不是只保护 `/me` 和 `/admin`。

公开页面：

- `/`
- `/about`
- `/login`
- `/register`
- `/verify-email`
- `/reset-password`
- `/admin/login`

公开基础路径：

- Next.js 静态资源
- 图片和上传资源
- favicon、robots、sitemap
- 必需的公开认证 API
- 健康检查接口

其他页面默认需要登录。

当前项目使用 SQLite，middleware 不直接连接 Prisma/SQLite 查询用户状态。权限采用三层保护：

1. **middleware**
   - 只检查 Cookie 是否存在。
   - 检查 Token 签名、有效期和基本角色。
   - 未登录时完成第一层跳转。
2. **受保护页面的服务端 layout 或服务端页面守卫**
   - 调用统一的 `requirePageUser` 或 `requirePageAlumni`。
   - 查询数据库，检查账号状态、邮箱状态、校友认证状态和 `sessionVersion`。
   - 不满足条件时在服务端重定向，避免先输出隐私内容再跳转。
3. **API**
   - 每个接口独立查询数据库并检查最新权限。
   - 不相信客户端传入的角色、用户 ID 或认证状态。

`AuthProvider` 只负责界面展示，不属于安全检查层。

不使用“路径中含点号”判断静态资源。

### 2.4 首个管理员和旧管理员迁移

新增只能由服务器维护人员执行的脚本：

`scripts/create_admin.ts`

并在 `package.json` 增加命令：

```text
npm run create-admin
```

脚本负责：

- 输入管理员用户名、邮箱和密码。
- 使用和普通用户相同的规范化与密码哈希规则。
- 创建 `role = "ADMIN"`、`accountStatus = "ACTIVE"` 的 User。
- 标记管理员邮箱为已验证，或要求管理员完成邮箱验证。
- 如果管理员用户名或邮箱已存在，拒绝重复创建。
- 不在日志中输出明文密码。

迁移顺序：

1. 保留旧环境变量管理员入口。
2. 执行 `npm run create-admin` 创建第一个数据库管理员。
3. 使用新管理员完成后台登录、权限和个人中心测试。
4. `/admin/login` 改为调用新的 `/api/auth/login`；管理员登录成功后默认跳转 `/admin`，普通用户登录成功后按安全的站内 `redirect` 或默认首页跳转。
5. 确认新管理员可用后，关闭旧 `/api/auth/verify` 管理员登录。
6. 最后移除 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD_HASH`。

安全要求：

- 公开注册 API 永远不接收或写入 `role`、`accountStatus`、`emailVerified`。
- 普通用户不能将自己提升为管理员。
- 管理员角色只能通过服务器脚本或受保护的管理员操作创建。
- 创建管理员、提升管理员或取消管理员权限时，都必须增加目标用户的 `sessionVersion`。

---

## Phase 3：注册、验证和旧资料认领

### 3.1 注册页面

新增 [src/app/register/page.tsx](src/app/register/page.tsx)。

字段：

- 用户名、密码、确认密码
- 真实姓名、届别、班级
- 邮箱
- 联系方式（可选，认领旧资料时可能需要）

届别下拉只返回去重后的届别，不能向前端发送完整校友名单。

新增：

`GET /api/auth/graduation-classes`

### 3.2 注册 API

新增 [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts)。

流程：

1. 校验请求大小和字段格式。
2. 校验密码和确认密码一致。
3. 规范化用户名和邮箱。
4. 校验用户名和邮箱唯一性。
5. bcrypt 哈希密码。
6. 创建新 User 记录。如果用户勾选了认领旧资料，标记为待管理员核对。
7. 生成邮箱验证 Token。
8. 数据库只保存 Token 哈希。
9. 发送验证邮件。
10. 返回账号创建结果和真实邮件发送状态。

唯一性检查和写入使用事务，并处理数据库唯一约束冲突。

### 3.3 白名单匹配

注册时姓名和届别匹配 WhitelistRoster 后，**自动通过校友认证**（`status = "VERIFIED"`, `role = "ALUMNI"`）。

- 延续旧 Join API 的自动匹配逻辑。
- 新系统额外要求邮箱验证后才能登录，已比旧系统更安全。
- 发现冒名注册时，管理员可随时通过 `reject-alumni` 撤销认证。

### 3.4 旧资料认领

旧 User 的届别信息混在 `identityCode` 自由文本中，无法靠代码自动提取和匹配。**认领不实现自动匹配。**

流程：

1. 注册时，用户勾选「我曾通过入轨联络舱提交过申请」。
2. 注册成功后创建一条 `UserClaimRequest`，进入管理员人工核对队列。
3. 管理员在后台查看新账号资料，并搜索、选择可能对应的旧 User。
4. 管理员确认归属后执行认领。
5. 已认领记录不能被第二个账号再次认领。

管理员只能选择符合全部条件的旧 User：

- `username` 为空。
- `email` 为空。
- `passwordHash` 为空。
- `mergedIntoUserId` 为空。
- 确认来自旧 Join 流程，而不是当前正在使用的正式账号。

后台搜索候选记录时默认只展示符合上述条件的 User，不能让管理员随意选择一个正在使用的账号进行合并。

认领通过时，在同一个数据库事务中完成：

1. 再次确认申请仍为 `PENDING`。
2. 再次确认旧 User 仍满足全部可认领条件，并且尚未被合并。
3. 将旧 User 的所有 `Post.authorId` 更新为新账号 ID。
4. 将旧 User 的 `claimedAt` 设为当前时间。
5. 将旧 User 的 `mergedIntoUserId` 设为新账号 ID。
6. 将旧 User 的 `accountStatus` 设为 `DISABLED`，避免旧记录以后被当作可登录账号使用。
7. 将认领申请设为 `APPROVED`，记录管理员和审核时间。

如果其中任何一步失败，整个事务回滚，不能只转移一部分投稿。

为防止两个管理员同时批准同一旧 User，事务中的最终更新必须带上“仍未合并”的条件；如果实际更新数量为 0，则说明该旧 User 已被其他操作占用，本次审批失败并提示管理员刷新。

认领被拒绝时，只更新申请状态和管理员备注，不修改旧 User 或投稿。

### 3.5 邮箱验证

新增 [src/app/api/auth/verify-email/route.ts](src/app/api/auth/verify-email/route.ts)：

- 对传入 Token 做 SHA-256。
- 使用 Token 哈希查找 User。
- 检查过期时间。
- 设置 `emailVerified`。
- 清除 Token 哈希和过期时间。
- 重复点击已使用链接时显示友好结果。

### 3.6 重发验证邮件

新增 [src/app/api/auth/resend-verification/route.ts](src/app/api/auth/resend-verification/route.ts)：

- 无论邮箱是否存在，都返回相同提示。
- 单 IP 和单邮箱都限流。
- 设置发送冷却时间。
- 新 Token 生成后旧 Token 失效。
- 已验证邮箱不重复发送。

---

## Phase 4：登录、退出和密码重置

### 4.1 登录页面

新增 [src/app/login/page.tsx](src/app/login/page.tsx)，支持：

- 用户名和密码登录
- 跳转注册和忘记密码
- 邮箱未验证时引导重发验证邮件
- 安全的 `redirect` 参数

`redirect` 只接受站内相对路径，防止跳转到恶意网站。

### 4.2 登录 API

新增 [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)。

登录成功前检查：

- 用户存在
- 密码正确
- 账号为 `ACTIVE`
- 邮箱已验证

失败提示统一使用“用户名或密码错误”。只有密码正确但邮箱未验证时，才返回专门的邮箱验证状态。

Cookie 设置：

- `httpOnly`
- 生产环境 `secure`
- `sameSite=lax`
- `path=/`
- 明确有效期

### 4.3 退出

继续使用 `POST /api/auth/logout`，只接受 POST 并清除 Cookie。

### 4.4 忘记密码

新增 [src/app/api/auth/forgot-password/route.ts](src/app/api/auth/forgot-password/route.ts)：

- 无论邮箱是否存在，都返回相同结果。
- 对 IP 和邮箱同时限流。
- 数据库只保存重置 Token 哈希。
- 发送失败不向外泄露账号是否存在。

### 4.5 重置密码

新增 [src/app/api/auth/reset-password/route.ts](src/app/api/auth/reset-password/route.ts)。

成功后：

- 更新密码哈希。
- 清除重置 Token。
- 增加 `sessionVersion`。
- 所有旧设备退出登录。

---

## Phase 5：现有页面和 API 权限改造

这是关键阶段，不能只修改页面跳转。

### 5.1 页面权限

隐私页面 = 除公开页面和 `/me` 之外的所有页面。已认证校友才能访问。

**公开页面（游客可访问）：**

- `/` 首页
- `/about` 关于
- `/login` 登录
- `/register` 注册
- `/verify-email` 邮箱验证
- `/reset-password` 忘记/重置密码
- `/admin/login` 管理员登录

**权限总表：**

| 路由 | 游客 | 普通用户（已登录未认证） | 已认证校友 | 管理员 |
|---|---:|---:|---:|---:|
| 公开页面 | 允许 | 允许 | 允许 | 允许 |
| `/me/*` | 拒绝 | 允许 | 允许 | 允许 |
| 其他所有页面（隐私） | 拒绝 | 拒绝 | 允许 | 允许 |
| `/admin/*` | 拒绝 | 拒绝 | 拒绝 | 允许 |

**隐私页面完整清单：**

- `/news`、`/news/[id]` — 新闻
- `/events`、`/events/[id]` — 活动
- `/contact` — 联系
- `/teachers` — 教师频道
- `/students/*` — 学生资源
- `/alumni/radar` — 校友通讯录/地图
- `/alumni/certificate` — 电子校友证
- `/alumni/memories` — 燕中记忆
- `/alumni/stories` — 校友故事
- `/alumni/achievements` — 成就墙
- `/alumni/correction` — 资料修正

> 隐私页面不区分「普通内容」和「校友隐私」——全部属于隐私，只有已认证校友可以访问。

### 5.1.1 公开首页的数据边界

游客可以访问首页 `/`，但首页只能展示：

- 网站介绍
- 关于项目的公开说明
- 登录和注册入口
- 不包含隐私数据的静态宣传内容

游客首页不能查询、渲染或在 HTML 中预先输出：

- 新闻标题、摘要或正文
- 活动标题、摘要或详情
- 校友故事、回忆、成就
- 校友地图、通讯录、证书等业务数据

当前首页的“最新新闻和活动”模块必须按登录权限处理：

- 游客访问首页时不执行新闻和活动数据库查询，也不输出相关数据。
- 已认证校友和管理员登录后才加载该模块。
- 普通用户已登录但校友认证未通过时，也不能加载该模块。

不能采用“先在服务端输出数据，再用 CSS 或客户端组件隐藏”的方式。

### 5.2 API 权限清单

按照当前产品决定，API 权限直接确定如下：

| API | 权限 |
|---|---|
| `/api/health` | 公开 |
| `/api/auth/login` | 公开 |
| `/api/auth/register` | 公开 |
| `/api/auth/verify-email` | 公开 |
| `/api/auth/resend-verification` | 公开，但按 IP 和邮箱限流 |
| `/api/auth/forgot-password` | 公开，但按 IP 和邮箱限流 |
| `/api/auth/reset-password` | 公开，但限流 |
| `/api/auth/graduation-classes` | 公开，只返回去重届别 |
| `/api/auth/logout` | 已登录用户或管理员 |
| `/api/auth/me` | 已登录用户或管理员 |
| `/api/me/*` | 已登录用户或管理员，只能操作自己 |
| `/api/news/*` | 已认证校友 |
| `/api/events/*` | 已认证校友，包括活动报名 |
| `/api/stories` | 已认证校友 |
| `/api/memories` | 已认证校友 |
| `/api/posts` | 已认证校友，投稿绑定当前用户 |
| `/api/alumni/*` | 已认证校友 |
| `/api/alumni/correction-requests` | 已认证校友 |
| `/api/alumni/certificate/*` | 已认证校友 |
| `/api/upload` | 管理员 |
| `/api/settings/*` | 管理员 |
| `/api/admin/*` | 管理员 |
| 其他未列出的新 API | 默认拒绝，明确权限后才能开放 |

补充规则：

- GET 接口也必须鉴权，不能认为“只读就安全”。
- 页面权限和 API 权限保持一致。
- 管理员可以访问校友隐私 API（与已认证校友权限相同），用于前台页面预览和内容核对。
- 限流窗口统一使用毫秒，例如 `60_000` 表示 60 秒。
- 生产环境必须配置 Redis 限流；内存限流只作为本地开发降级方案。

### 5.3 投稿归属改造

**文件**：[src/app/api/posts/route.ts](src/app/api/posts/route.ts)

登录后投稿：

- 从 Token 获取当前 `userId`。
- 直接写入 `authorId`。
- 不根据客户端提交的 `authorContact` 猜测作者。
- 不再创建匿名占位 User。

旧投稿保留原有 `authorId`，直到管理员批准认领。批准后通过数据库事务把旧投稿的 `authorId` 转为新账号 ID，随后才会出现在“我的投稿”。

### 5.4 搜索引擎同步

同步修改：

- [src/app/sitemap.ts](src/app/sitemap.ts)
- [src/app/robots.ts](src/app/robots.ts)
- [src/app/layout.tsx](src/app/layout.tsx) 的 robots metadata

要求：

- sitemap 只保留公开页面。
- 登录后页面设置 `noindex`。
- 不再向搜索引擎提交新闻、活动和校友私有页面。

---

## Phase 6：AuthProvider、导航和个人中心

### 6.1 AuthProvider

新增 [src/components/AuthProvider.tsx](src/components/AuthProvider.tsx)：

- 调用 `/api/auth/me` 获取用户。
- 提供 `user`、`isLoggedIn`、`isLoading`。
- 控制导航栏登录状态。
- 处理友好的客户端跳转。

它不承担真正的服务端权限判断。

### 6.2 根布局和导航

修改：

- [src/app/layout.tsx](src/app/layout.tsx)
- [src/components/MobileNav.tsx](src/components/MobileNav.tsx)

登录后显示用户名、个人中心和退出登录；未登录显示登录和注册。

### 6.3 当前用户 API

新增 [src/app/api/auth/me/route.ts](src/app/api/auth/me/route.ts)。

只返回：

- id、username、name、email
- emailVerified
- graduationClass、className
- 校友认证状态

不返回密码哈希、Token 哈希、`sessionVersion` 和其他内部安全字段。

### 6.4 个人中心

页面：

- `/me`
- `/me/edit`
- `/me/posts`
- `/me/change-password`

API：

- `GET/PATCH /api/me/profile`
- `GET /api/me/posts`
- `POST /api/me/change-password`

规则：

- 只使用 Token 中的当前用户 ID。
- 客户端不能传入其他 `userId`。
- 用户名和邮箱第一版不可直接修改。
- 修改姓名或届别时，如果参与校友认证，应重新审核或记录审计信息。
- 修改密码后增加 `sessionVersion`。

---

## Phase 7：「入轨联络舱」改造

### 7.1 保留内容

- 标题保持「入轨联络舱」。
- 视觉样式保持不变。
- 「加入我们」文案保持不变。

### 7.2 行为调整

- 副标题改为「注册校友账号，加入数字母港」。
- 点击入口跳转 `/register`。
- 可以通过查询参数预填姓名、届别和联系方式。
- 注册页面重新校验全部参数，不信任 URL 预填数据。

### 7.3 旧 Join API

[src/app/api/join/route.ts](src/app/api/join/route.ts) 不应长期保持可写，否则用户可以绕过新注册流程继续创建旧式 User。

过渡方式：

1. 前端停止调用。
2. 短期返回迁移提示或 `410 Gone`。
3. 确认没有旧客户端使用后删除。

只添加 `DEPRECATED` 注释但继续允许写入，不是安全的兼容方案。

---

## Phase 8：管理后台

### 8.1 用户管理

增加：

- 用户名、邮箱、邮箱验证状态
- 账号状态、校友认证状态
- 届别、班级、注册时间
- 是否已认领旧资料

新增“旧资料认领审核”页面：

- 查看待审核 `UserClaimRequest`。
- 查看申请人的新账号资料。
- 搜索并选择对应的旧 User。
- 查看旧 User 当前关联的投稿数量。
- 批准前再次提示将要转移的投稿数量。
- 支持批准、拒绝和填写管理员备注。

建议新增：

- `src/app/admin/user-claims/page.tsx`
- `src/app/api/admin/user-claims/route.ts`
- `src/app/api/admin/user-claims/[id]/route.ts`

### 8.2 管理员操作

使用独立 action API：

`POST /api/admin/users/[id]/actions`

允许：

- `approve-alumni`
- `reject-alumni`
- `disable-account`
- `enable-account`
- `logout-all-sessions`
- `resend-verification`
- `send-reset-password`
- `approve-claim`
- `reject-claim`
- `grant-admin`
- `revoke-admin`

管理员不能通过通用 PATCH 直接写入密码哈希、邮箱验证时间、Token 哈希或 `sessionVersion`。这些字段只能由固定服务端流程修改。

`approve-claim` 必须调用专门的认领事务，不允许前端分别调用多个 PATCH 模拟转移。

`grant-admin` 和 `revoke-admin` 必须在修改角色的同一事务中增加目标用户的 `sessionVersion`，使其所有旧 Token 立即失效，并写入 `AuditLog`。

### 8.3 审计记录

所有管理员敏感操作必须写入 `AuditLog` 表（Phase 1.3），与业务操作在同一事务中完成：

- `approve-alumni` / `reject-alumni` — 校友认证审批
- `disable-account` / `enable-account` — 账号停用/恢复
- `logout-all-sessions` — 强制退出所有设备
- `approve-claim` / `reject-claim` — 旧资料认领审批
- `grant-admin` / `revoke-admin` — 管理员角色授予或取消

每条记录包含：操作人、目标类型、目标 ID、经过脱敏和字段白名单过滤的操作前后快照、时间戳。不可删除或修改。

角色变化、账号状态变化和强制退出操作必须同时增加目标用户的 `sessionVersion`。

---

## Phase 9：切换、清理与上线

### 9.1 上线顺序

1. 备份数据库。
2. 执行 Schema 迁移。
3. 部署新认证 API，暂时保留旧 Gatekeeper。
4. 完成注册、验证和登录测试。
5. 完成敏感 API 的服务端鉴权。
6. 更新 sitemap 和 robots。
7. 切换根布局，启用个人账号登录。
8. 观察日志和邮件发送情况。
9. 稳定后移除 Gatekeeper 和共享口令配置。

### 9.2 最终清理

- 删除 [src/components/Gatekeeper.tsx](src/components/Gatekeeper.tsx)。
- 移除 `ACCESS_PASSWORD` 和 `ACCESS_PASSWORD_HASH`。
- 删除旧 `access` Token 逻辑。
- 关闭旧 Join API 写入。
- 更新冒烟测试、部署文档和运维文档。

### 9.3 安全响应头

至少增加：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

后续评估 Content Security Policy。

---

## 四、主要文件清单

### 新增认证页面和 API

- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/resend-verification/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/graduation-classes/route.ts`

### 新增个人中心和后台文件

- `src/components/AuthProvider.tsx`
- `src/app/me/layout.tsx`
- `src/app/me/page.tsx`
- `src/app/me/edit/page.tsx`
- `src/app/me/posts/page.tsx`
- `src/app/me/change-password/page.tsx`
- `src/app/api/me/profile/route.ts`
- `src/app/api/me/posts/route.ts`
- `src/app/api/me/change-password/route.ts`
- `src/app/api/admin/users/[id]/actions/route.ts`
- `src/app/admin/user-claims/page.tsx`
- `src/app/api/admin/user-claims/route.ts`
- `src/app/api/admin/user-claims/[id]/route.ts`
- `scripts/migrate_users.ts`
- `scripts/create_admin.ts`

### 必须检查或修改的现有文件

- `prisma/schema.prisma`
- `.env.example`
- `package.json`
- `src/lib/verify-token.ts`
- `src/lib/admin-auth.ts`
- `src/middleware.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/LatestUpdatesSection.tsx`
- `src/components/MobileNav.tsx`
- `src/components/JoinRequestModal.tsx`
- `src/app/api/posts/route.ts`
- `src/app/api/join/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/app/admin/login/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `scripts/smoke-test.js`

---

## 五、测试和验收

### 5.1 自动化测试重点

- 未登录不能访问受保护页面和敏感 API。
- 普通用户不能访问管理 API。
- 未认证校友不能访问校友隐私 API。
- 修改密码后旧 Token 失效。
- 管理员停用账号后旧 Token 失效。
- 邮箱验证和密码重置 Token 只能使用一次。
- 过期 Token 无法使用。
- 用户不能读取或修改其他用户数据。
- 投稿绑定当前登录用户。
- 认领通过后旧投稿全部转到新账号。
- 认领事务失败时，旧 User、投稿和申请状态都不发生部分修改。
- 同一旧 User 不能被重复认领。
- 普通注册接口不能创建 `ADMIN`。
- 管理员角色被授予或取消后，旧 Token 立即失效。
- middleware 通过但数据库账号已停用时，服务端页面和 API 仍然拒绝访问。
- 游客访问首页时，响应中不包含新闻、活动或其他隐私业务数据。
- 认领接口不能选择已有用户名、邮箱或密码的正式账号作为旧 User。
- AuditLog 的前后快照不包含密码哈希、Token 哈希、Cookie 或密钥。
- Prisma Schema 校验通过，所有命名关系都有对应反向关系。
- 恶意 redirect 参数不能跳转站外。

### 5.2 端到端流程

1. 新用户注册。
2. 邮件发送成功和失败。
3. 重发验证邮件。
4. 邮箱验证和登录。
5. 待认证普通用户权限。
6. 管理员认证校友。
7. 已认证校友访问隐私功能。
8. 旧资料认领成功、冲突和人工审核。
9. 认领批准后验证旧投稿转移到新账号。
10. 修改资料、查看历史投稿。
11. 修改密码并验证旧设备退出。
12. 忘记密码和重置密码。
13. 使用初始化脚本创建首个管理员。
14. 验证管理员登录后默认进入 `/admin`，并可以访问 `/me/*`。
15. 管理员角色授予、取消后验证旧 Token 失效。
16. 管理员停用、恢复账号和退出所有设备。

### 5.3 上线前检查

- 数据库已备份并在副本上演练迁移。
- Resend 域名验证完成。
- `APP_URL` 配置正确。
- `SESSION_SECRET` 足够随机。
- 已成功创建并测试数据库管理员账号。
- 旧环境变量管理员入口只在新管理员验证成功后关闭。
- 所有限流窗口使用毫秒，例如 `60_000` 表示 60 秒。
- 生产环境 Redis 限流可用。
- Prisma Schema 已执行格式化和校验，命名关系完整。
- sitemap 只包含公开页面。
- robots 和 metadata 不索引私有页面。
- Gatekeeper 冒烟测试已更新。
- 日志不输出密码和原始 Token。

---

## 六、最终验收标准

- 游客只能访问首页、关于页和认证相关页面。
- 游客首页不查询、不渲染新闻、活动或其他受保护业务数据。
- 所有敏感数据都由服务端鉴权保护。
- 邮箱验证和校友认证是两个独立状态。
- 不能只凭姓名和届别直接冒领旧账号。
- 修改密码或停用账号后，旧登录立即失效。
- 邮件发送失败时不会错误提示“发送成功”。
- 投稿始终绑定当前登录用户。
- 管理员敏感操作全部写入 AuditLog，与业务操作同一事务，不可删除或修改。
- AuditLog 快照经过脱敏，不保存密码、Token、Cookie 或密钥。
- 认领通过后，旧投稿通过事务完整转移到新账号。
- 第一个管理员可以通过服务器脚本安全创建。
- middleware、服务端页面和 API 形成三层权限保护。
- 管理员登录后默认进入 `/admin`，同时可以访问 `/me/*` 和已认证校友功能。
- 任何角色变化都会增加 `sessionVersion`，旧权限 Token 立即失效。
- 每一个现有 API 都已按照权限表完成鉴权。
- 管理员不能通过通用接口直接修改安全字段。
- 私有页面不会继续出现在 sitemap 中。
- 新闻、活动、地图、证书、回忆墙和后台功能在正确权限下正常运行。
