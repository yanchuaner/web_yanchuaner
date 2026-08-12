# AGENTS.md - 燕中校友数字母港

本文件是 Codex/AI coding agent 在本仓库工作的项目级入口说明。进入仓库后先读本文件；涉及具体前端、后台、部署、安全或运维细节时，再读对应 `docs/*.md`。

## 0. 当前局部配置盘点

已发现的本地/代理配置：

- 根目录 `AGENTS.md`：项目级 Codex 约定，本文件应作为当前仓库的主入口。
- `.agents/AGENTS.md`：历史多代理任务产物，重点是后端安全、事务、脱敏准则；`.agents/` 已被 `.gitignore` 忽略，不能当作可提交配置。
- `.claude/CLAUDE.md`：Claude Code 项目说明，内容与旧版根 `AGENTS.md` 接近；`.claude/` 已被忽略，只能作为参考，不应依赖它给 Codex 生效。
- `.claude/settings.json` / `.claude/settings.local.json`：Claude 权限白名单，不是 Codex 配置。
- 未发现 `.codex/` 目录或 Codex 专属项目配置。

本次补齐的缺口：

- 明确 Codex 的配置入口与 `.agents`、`.claude` 的关系。
- 修正真实 App Router 路径：前台在 `src/app/(front)`，后台在 `src/app/(admin)/admin`。
- 修正部署文档路径：使用 `docs/deployment.md`，不是 `docs/DEPLOYMENT_GUIDE.md`。
- 补充数据隐私、禁止提交文件，以及迁移和 seed 必须显式执行的风险说明。
- 补充 Windows/WSL 验证策略、验证降级口径、常用脚本和修改边界。
- 把后端安全准则、UI 令牌、后台 CRUD 模式合并成可执行规则。

## 1. 项目身份

深圳市燕川中学校友会公益数字平台。连接毕业校友、在校生与老师的非官方、无盈利站点，即将开源共建。

- 线上站点：https://yanchuaner.cn
- GitHub：https://github.com/yanchuaner/web_yanchuaner
- 域名备案：粤ICP备2026024784号-2

## 2. 技术栈

| 层 | 选型 | 当前版本/说明 |
| --- | --- | --- |
| 框架 | Next.js App Router，`output: "standalone"` | 15.5.19 |
| 语言 | TypeScript | 5.9.x |
| ORM | Prisma + `@prisma/adapter-better-sqlite3` | 7.8.x |
| 数据库 | SQLite | 本地 `prisma/dev.db`，生产 `/var/www/alumni-site/data/prod.db` |
| 样式 | Tailwind CSS + 语义设计令牌 | 3.4.x |
| 地图 | Leaflet + react-leaflet | 1.9.4 / 4.2.x |
| 图像 | Sharp | 上传自动裁切/重编码 |
| 图标 | lucide-react | 优先复用 |
| 鉴权 | HMAC-SHA256 + httpOnly cookie | cookie 名 `yc_access_token` |
| 部署 | systemd + Nginx + Let's Encrypt | 详见 `docs/deployment.md` |

## 3. 先读什么

按任务选择最小必要文档：

- 项目概览与脚本：`README.md`
- 贡献流程与提交规范：`CONTRIBUTING.md`
- 前端 UI、设计令牌、组件约定：`docs/ui-guide.md`
- 架构、请求生命周期、缓存与限流：`docs/architecture.md`
- 安全边界与隐私：`SECURITY.md`、`docs/security.md`
- 本地开发、数据库、脚本、运维：`docs/operations-guide.md`
- 部署：`docs/deployment.md`
- 路由/API 清单：`docs/ROUTES.md`
- 故障排查：`docs/TROUBLESHOOTING.md`

工作前先读相关代码，不要只按文档猜。

## 4. 真实项目结构

```text
src/
├── app/
│   ├── layout.tsx                 # 根布局、全局 metadata、AuthProvider、星空背景、Toaster
│   ├── globals.css                # 设计令牌 :root + Tailwind 组件层
│   ├── (front)/                   # 前台路由组，不出现在 URL 中
│   │   ├── layout.tsx             # Header + footer
│   │   ├── page.tsx               # 首页
│   │   ├── alumni/                # 校友空间
│   │   ├── students/              # 在校生资源站
│   │   ├── me/                    # 个人中心
│   │   └── ...
│   ├── (admin)/
│   │   ├── layout.tsx             # 后台壳，`'use client'` 第一行，`force-dynamic`
│   │   └── admin/                 # 后台实际 URL 前缀 `/admin`
│   └── api/                       # REST API
├── components/
│   ├── ui/                        # PageShell/GlassCard/PageHeader/Button/Badge/EmptyState 等
│   ├── admin/                     # CrudManager/AdminPageShell/AdminBreadcrumb
│   ├── Header.tsx                 # 前台顶栏
│   ├── MobileNav.tsx              # 主导航 NAV_GROUPS
│   ├── JoinRequestModal.tsx       # 入轨联络舱与 JoinTriggerButton
│   └── JoinModalProvider.tsx      # 弹窗 context
├── hooks/
│   └── useResource.ts             # 后台 CRUD 数据层 Hook
├── lib/                           # db/auth/cache/rate-limit/image/tags/email 等
└── middleware.ts                  # 路由中间件
```

重要提醒：路由组目录 `(front)`、`(admin)` 不会进入 URL。不要把它们写进 `href`。

## 5. 最高优先级红线

除非用户明确要求并说明风险，否则不要修改：

| 禁区 | 路径/范围 | 原因 |
| --- | --- | --- |
| 后端 API | `src/app/api/**` | 数据契约、鉴权和服务端逻辑 |
| 数据库 schema | `prisma/schema.prisma` | 数据模型和生产数据兼容 |
| 数据库连接 | `src/lib/db.ts` | SQLite/WAL/Prisma 连接底层 |
| 鉴权核心 | `src/lib/admin-auth.ts`、`src/lib/verify-token.ts`、`src/middleware.ts` | 安全边界 |
| Cookie 名/逻辑 | 所有 `yc_access_token` 相关代码 | 登录态核心 |
| 路由 URL | 文件夹名、`href`、公开 API 路径 | SEO、外链和前后端契约 |
| 真实数据和凭据 | `.env`、`*.db`、`public/uploads/`、`alumni_roster.csv` | 隐私与安全 |

如必须触碰红线，先停下来说明原因、影响和验证方案。

## 6. 默认可改范围

优先把普通需求限定在这些位置：

- `src/components/**`：UI 组件外观、结构、交互。
- `src/app/(front)/**/page.tsx`：前台页面布局和文案，不改 URL 和数据契约。
- `src/app/(admin)/admin/**/page.tsx`：后台页面 UI，数据层遵循 `useResource`。
- `src/app/globals.css`：设计令牌和 CSS 组件类。
- `tailwind.config.ts`：Tailwind 语义映射、圆角、阴影、字体。
- `docs/**`、`README.md`、`CONTRIBUTING.md`：文档。

保持改动小而集中。不要顺手重排无关文件、重命名路由或做大范围格式化。

## 7. UI 与设计令牌

颜色、圆角、阴影的单一来源：

- CSS 变量：`src/app/globals.css` 的 `:root`
- Tailwind 映射：`tailwind.config.ts`

新代码规则：

- 使用语义类名：`text-brand`、`bg-brand/10`、`text-brand-fg`、`bg-surface`、`bg-surface-muted`、`text-accent`、`border-line`。
- 不新增裸写十六进制色值、`bg-white`、`text-gray-*`、`text-slate-*` 等浅色硬编码类名。旧代码有兼容覆盖器，新代码不要继续扩大技术债。
- 按钮优先用 `Button` / `ButtonLink`，状态标签用 `Badge`，空状态用 `EmptyState`，页面容器用 `PageShell` + `GlassCard` + `PageHeader`。
- 图标优先使用 `lucide-react`。
- 修改前台导航只改 `src/components/MobileNav.tsx` 的 `NAV_GROUPS`，不要改渲染和已有 `href`。
- 修改后台导航只改 `src/app/(admin)/layout.tsx` 的 `NAV_SECTIONS` 或 `segmentLabels`，不要改登出 API。

前台内容页推荐骨架：

```tsx
import { PageShell, GlassCard, PageHeader, EmptyState } from "@/components/ui";

export default function MyPage() {
  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader eyebrow="LABEL" title="标题" description="描述" />
        <EmptyState title="暂无数据" />
      </GlassCard>
    </PageShell>
  );
}
```

## 8. 后台 CRUD 约定

后台管理页必须优先使用 `useResource` 数据层；标准 CRUD 页再接 `CrudManager`。

```tsx
const res = useResource<MyType>({
  endpoint: "/api/admin/xxx",
  listKey: "items",
});
```

规则：

- 不在后台页面里手写重复的 `fetch('/api/admin/...')` CRUD 状态机。
- 标准表单/列表使用 `CrudManager`。
- 图片上传、图标选择、排序、Tab 等特殊 UI 可以自写，但数据加载和 CRUD 仍接 `useResource`。
- 参考标准页：`src/app/(admin)/admin/stories/page.tsx`、`src/app/(admin)/admin/achievements/page.tsx`。
- 参考特殊页：`src/app/(admin)/admin/memories/page.tsx`、`src/app/(admin)/admin/content/page.tsx`、`src/app/(admin)/admin/teachers/page.tsx`。

## 9. 后端与安全准则

如果任务确实需要碰后端，必须遵守：

- 所有 `/api/admin/*` 必须经过 `requireAdmin()` 或等价管理员校验。
- 不信任客户端传来的 `userId`、`authorId`、`role`，用户身份必须来自服务端 session/token。
- 防 IDOR：修改/删除用户资源时，数据库条件必须包含资源归属，例如 `where: { id, authorId: currentUserId }`。
- POST/PUT/PATCH 请求体必须使用 `readJsonBody` 或现有等价工具限制大小，并对字段 trim、类型检查、长度约束。
- 列表查询用显式 `select`，只返回 UI 需要的字段，禁止泄露 `passwordHash`、token、敏感联系方式等。
- 涉及 `UserClaimRequest`、`AuditLog`、`WhitelistRoster` 导入、故事审核等关联写入时使用 `prisma.$transaction`。
- 管理员关键操作必须写 `AuditLog`。
- 邮件统一走 `src/lib/email.ts`；邮件链接用 `APP_URL`，不要从 request host 拼生产链接。
- CSV/名册去重维度遵循 `name + graduationClass + className + email`。

## 10. 数据与隐私

本项目可能包含真实校友数据。默认按敏感数据处理：

- 不提交 `.env`、`.env.*`、`credentials.local.json`、`*.db`、`*.sqlite*`、`public/uploads/`、`alumni_roster.csv`、`source_alumni.json`、`logs/`、`coverage/`。
- 不用本地 `prisma/dev.db` 覆盖生产 `prod.db`。
- 不在日志、文档、PR 描述中粘贴真实手机号、邮箱、token、密码哈希、SESSION_SECRET。
- 直接操作数据库前先备份；生产数据库禁止无备份直接写。
- 测试数据优先用 seed 脚本或假数据。

## 11. 常用命令

开发：

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

验证：

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run smoke
```

数据库和脚本：

```bash
npm run seed
npm run seed-all
npm run create-admin
npm run db:studio
npm run update-list
```

注意：

- `npm run build` 实际执行 `prisma generate && next build`，不会迁移或播种数据库。迁移使用 `npm run db:migrate:deploy`，种子使用 `npm run seed` 或 `npm run seed-all`，生产执行前必须备份。
- 生产构建和部署必须在 WSL/Linux 中执行。Windows 本机可以做 `tsc`、`lint` 和开发服务，但不要把 Windows 下的 `next build` 结果当生产结论。
- `npm run smoke` 需要本地服务和 `SMOKE_BASE_URL`、账号密码等环境变量。

## 12. 必须验证什么

代码修改后按风险选择验证，默认目标是：

```bash
npx tsc --noEmit
npm run lint
npm run build
```

如果验证被环境限制阻塞，必须在回复中说明：

- 哪条命令没跑或失败。
- 阻塞原因，例如缺 `.env`、Windows 不适合生产 build、数据库不可写、缺管理员账号。
- 已完成的替代检查，例如只跑了 `tsc`、`lint`、静态读回、局部页面 smoke。

文档-only 修改通常不需要完整构建，但仍应读回确认内容和路径准确。

## 13. Next.js 构建避坑

- Client Component 的 `'use client'` 必须是文件第一行，放在任何 `export const dynamic` 之前。
- 使用 `useSearchParams()` 的全局组件必须在 Suspense 边界内，尤其是根布局或跨页面组件。
- `force-dynamic` 不会从 layout 自动继承到子 page。不要用给每个页面乱加声明掩盖根因。
- 本项目依赖 API、数据库和上传，不支持 `output: "export"` 静态导出。
- `better-sqlite3` 已配置为 Server Components 外部包；不要随意改 `next.config.mjs` 的 standalone/experimental 配置。

## 14. Git 与工作区

- 当前仓库可能已有用户未提交改动。修改前看 `git status --short`，不要回滚不是你写的变更。
- `AGENTS.md` 当前需要作为项目级说明纳入仓库；`.agents/` 和 `.claude/` 按 `.gitignore` 继续作为本地资料。
- 分支统一使用 `feat/`、`fix/`、`docs/`、`refactor/`、`chore/`，不使用 `codex/*` 或其他自定义前缀。
- 提交信息遵循 Conventional Commits，例如 `docs: update agent guidance`。

## 15. 成功标准

完成任务时应能清楚说明：

- 改了哪些文件和为什么。
- 是否触碰红线；若触碰，风险和验证是什么。
- 跑了哪些检查，结果如何。
- 如未能完整验证，下一步最可靠的检查是什么。

先做最小正确改动，再验证。不要为了“顺手优化”扩大范围。
