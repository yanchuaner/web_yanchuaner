# 燕川校友数字母港 — 架构文档

> 版本: 3.1 | 最后更新: 2026-04-29
> 框架: Next.js 14.2.30 + React 18.3 + TypeScript 5.9 + Tailwind CSS 3.4
> 数据库: SQLite (better-sqlite3) + Prisma 7.8
> 部署: Docker → 华为云 ECS | 域名: yanchuaner.cn

---

## 1. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.2.30 |
| UI | React | 18.3.1 |
| 样式 | Tailwind CSS | 3.4 |
| 语言 | TypeScript | 5.9 |
| 数据库 | SQLite (better-sqlite3) | 12.9 |
| ORM | Prisma | 7.8 |
| 图标 | Lucide React | 0.542 |
| 地图 | Leaflet + react-leaflet | 1.9.4 |
| 搜索 | Fuse.js | 7.3 |
| 缓存 | Redis (ioredis) | 可选 |

---

## 2. 项目结构

```
aerospace-alumni-site/
├── next.config.mjs         # standalone + 性能优化 + 安全头
├── tailwind.config.ts      # 紫色色板 + Poppins/Open Sans + MASTER.md tokens
├── tsconfig.json           # strict, path alias @/*
├── Dockerfile              # 多阶段构建
├── docker-compose.yml      # 华为云部署
├── .env                    # DATABASE_URL + ACCESS_PASSWORD
├── .env.example            # 环境变量模板
├── prisma/
│   └── schema.prisma       # 6 个数据模型
├── src/
│   ├── middleware.ts        # 路由中间件: 保护 /admin + /api/admin
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # 根布局: Gatekeeper, 导航, 页脚 (紫色主题)
│   │   ├── page.tsx        # 首页 (Community/Forum Landing)
│   │   ├── globals.css     # 802行 CSS: 紫色社区主题 + 动画
│   │   ├── loading.tsx     # 全局加载 (紫色主题)
│   │   ├── error.tsx       # 全局错误 (紫色主题)
│   │   ├── not-found.tsx   # 404 (紫色主题)
│   │   ├── robots.ts       # SEO robots.txt
│   │   ├── sitemap.ts      # SEO sitemap.xml
│   │   ├── about/          # 学校介绍 (静态)
│   │   ├── news/           # 新闻公告
│   │   ├── events/         # 校友活动
│   │   ├── teachers/       # 教师频道 (静态)
│   │   ├── students/       # 在校生资源 (静态)
│   │   ├── admin/          # 管理后台
│   │   │   ├── page.tsx    # 仪表盘
│   │   │   ├── users/      # 用户管理
│   │   │   └── posts/      # 内容审核
│   │   ├── alumni/         # 校友专区
│   │   │   ├── radar/      # 通讯录检索
│   │   │   ├── stories/    # 校友故事
│   │   │   ├── memories/   # 校园记忆
│   │   │   └── certificate/# 电子纪念卡
│   │   └── api/            # API 路由
│   │       ├── health/     # GET /api/health (健康检查)
│   │       ├── auth/       # 认证 API
│   │       │   └── verify/ # POST /api/auth/verify (服务端口令验证)
│   │       ├── join/       # POST /api/join (申请加入)
│   │       ├── upload/     # POST /api/upload (图片上传)
│   │       ├── news/       # GET /api/news (新闻列表)
│   │       ├── events/     # GET/POST /api/events (活动+报名)
│   │       ├── posts/      # POST /api/posts (内容投稿)
│   │       ├── admin/      # 管理API (受 middleware 保护)
│   │       └── alumni/     # 校友API (map, search)
│   ├── components/          # 共享组件
│   │   ├── Gatekeeper.tsx  # 口令门禁 (调用服务端 API 验证)
│   │   ├── MobileNav.tsx   # 响应式导航 (Esc关闭 + 焦点锁定)
│   │   ├── AlumniMap.tsx   # 校友地图 (Leaflet)
│   │   ├── AlumniSearch.tsx# 校友搜索
│   │   ├── JoinRequestModal.tsx # 加入弹窗 (Esc关闭 + 焦点锁定 + aria)
│   │   ├── MessageOrbit.tsx# 首页星星消息
│   │   ├── StarMarquee.tsx # 跑马灯
│   │   └── UUIDCompat.tsx  # crypto.randomUUID polyfill
│   ├── lib/                 # 工具库
│   │   ├── db.ts           # Prisma 客户端
│   │   ├── cache.ts        # Redis 缓存封装
│   │   └── redis.ts        # Redis 连接
│   └── data/                # 静态数据
│       ├── alumni_encrypted.ts  # Base64 校友名单
│       ├── stories.json     # 校友故事
│       ├── starMessages.ts  # 星星消息
│       └── memoriesGallery.json # 记忆画廊
├── scripts/                 # 工具脚本
│   ├── seed_content.js      # 种子数据 (新闻/活动)
│   └── seed_whitelist.js    # 白名单种子
└── design-system/            # UI UX Pro Max 设计系统
    └── 燕川校友数字母港/
        └── MASTER.md
```

---

## 3. 路由表 (32 路由)

| 路由 | 类型 | 渲染方式 | 说明 |
|------|------|----------|------|
| `/` | 页面 | static (○) | 首页 Community Landing |
| `/about` | 页面 | static (○) | 学校介绍 |
| `/news` | 页面 | static (○) | 新闻列表 |
| `/news/[id]` | 页面 | dynamic (ƒ) | 新闻详情 |
| `/events` | 页面 | static (○) | 活动列表 |
| `/events/[id]` | 页面 | dynamic (ƒ) | 活动详情+报名 |
| `/teachers` | 页面 | static (○) | 教师频道 |
| `/students` | 页面 | static (○) | 在校生资源 |
| `/admin` | 页面 | static (○) | 管理后台 (受 middleware 保护) |
| `/admin/users` | 页面 | static (○) | 用户管理 |
| `/admin/posts` | 页面 | static (○) | 内容审核 |
| `/alumni/radar` | 页面 | static (○) | 校友通讯录 |
| `/alumni/stories` | 页面 | static (○) | 校友故事 |
| `/alumni/memories` | 页面 | static (○) | 校园记忆 |
| `/alumni/certificate` | 页面 | static (○) | 电子纪念卡 |
| `/robots.txt` | API | static (○) | SEO |
| `/sitemap.xml` | API | static (○) | SEO |
| `/api/health` | API | dynamic (ƒ) | 健康检查 |
| `/api/auth/verify` | API | dynamic (ƒ) | **新增**: 服务端口令验证 |
| `/api/upload` | API | dynamic (ƒ) | **新增**: 图片上传 |
| `/api/news` | API | dynamic (ƒ) | 新闻列表 API |
| `/api/news/[id]` | API | dynamic (ƒ) | 新闻详情 API |
| `/api/events` | API | dynamic (ƒ) | 活动列表 API |
| `/api/events/[id]` | API | dynamic (ƒ) | 活动详情+报名 API |
| `/api/join` | API | dynamic (ƒ) | 加入申请 API |
| `/api/posts` | API | dynamic (ƒ) | 内容投稿 API |
| `/api/alumni/map` | API | dynamic (ƒ) | 校友地图 API |
| `/api/alumni/search` | API | dynamic (ƒ) | 校友搜索 API |
| `/api/admin/stats` | API | dynamic (ƒ) | 管理统计 API (受 middleware 保护) |
| `/api/admin/users` | API | dynamic (ƒ) | 用户管理 API (受 middleware 保护) |
| `/api/admin/posts` | API | dynamic (ƒ) | 内容管理 API (受 middleware 保护) |

---

## 4. 数据模型 (Prisma)

```prisma
model User              // 用户: id, name, contact, identityCode, role, status
model WhitelistRoster   // 白名单: id, name, graduationClass, tags
model Post              // 文章: id, title, content, type, status, authorId
model News              // 新闻: id, title, summary, content, imageUrl, status, publishedAt
model Event             // 活动: id, title, summary, content, location, eventDate, endDate, maxAttendees
model EventRegistration // 报名: id, eventId, name, contact, message
```

---

## 5. 认证流程 (v3.0 服务端重构)

```
用户访问 → Gatekeeper 客户端检查 localStorage token (快速路径)
  ├─ 无有效 token → 显示口令输入框
  │   └─ 输入口令 → POST /api/auth/verify (服务端 SHA-256 验证)
  │       ├─ 失败 → 返回 401 + 错误提示
  │       └─ 成功 → 服务端设置 httpOnly cookie + 客户端设置 localStorage → 刷新页面
  └─ 有有效 token → 显示网站内容

管理后台保护:
  用户访问 /admin/* 或 /api/admin/*
    → middleware 检查 httpOnly cookie (yc_access_token)
      ├─ 无 token 或过期 → API: 返回 401 JSON | 页面: 重定向到 /
      └─ 有效 → 放行
```

**关键组件:**
- `src/middleware.ts`: 路由中间件, 保护 `/admin/*` 和 `/api/admin/*`
- `src/app/api/auth/verify/route.ts`: 服务端口令验证, 密码通过环境变量 `ACCESS_PASSWORD` 配置
- `Gatekeeper.tsx`: 客户端组件, 调用 API 验证, 不再硬编码密码
- Token: 7天有效期, httpOnly cookie (服务端) + localStorage (客户端快速检查)

**安全改进 (v3.0 vs v2.0):**
- ❌ 旧版: 密码 `iloveyanchuan!` 和 SHA-256 哈希硬编码在客户端 JS
- ✅ 新版: 密码仅存储在服务端 `.env`, 客户端通过 API 验证
- ❌ 旧版: 管理后台无服务端鉴权
- ✅ 新版: middleware 拦截所有 `/admin/*` 路由验证 httpOnly cookie

---

## 6. 样式系统 (v3.0 MASTER.md 设计规范)

**设计理念**: 紫色社区主题 (Light Purple Community)
- 背景: `#FAF5FF` → `#F3E8FF` → `white` (浅紫→白)
- 主色: `#7C3AED` (紫色/primary)
- 辅色: `#A78BFA` (淡紫/secondary)
- CTA: `#22C55E` (绿色/cta)
- 文字: `#4C1D95` (深紫/text)

**设计系统来源**: `design-system/燕川校友数字母港/MASTER.md`

**核心 CSS 类:**
```css
.btn-primary         → MASTER.md 主按钮 (绿色 CTA, 200ms transition)
.btn-secondary       → MASTER.md 次按钮 (紫色边框)
.card                → MASTER.md 卡片 (浅紫背景, hover 阴影)
.input               → MASTER.md 输入框 (focus 紫色 ring)
.modal / .modal-overlay → MASTER.md 弹窗
.cosmic-card         → 紫色玻璃拟态卡片 (保留流光边框动画)
.glass-card-base     → 通用毛玻璃卡片 (白色半透明)
.cosmic-focus        → 无障碍紫色 focus ring
.cosmic-btn          → 悬浮缩放按钮 (紫色阴影)
.glass               → 毛玻璃背景
```

**动画层** (保留自 v2.0, 色彩改为紫色调):
- `starfield` (紫色星空点阵)
- `meteor-layer` (紫色流星)
- `nebula-drift-cyan / nebula-drift-purple` (紫色星云漂移)
- `home-breath-stars` (首页呼吸星星)
- `home-meteor` (首页紫色流星)
- `animate-fade-in-up` (交错入场)
- `animate-pulse-glow` (呼吸发光, 紫色)
- `animate-marquee` (跑马灯)
- `gate-shake` (错误抖动)

**字体:**
- 标题: Poppins (class: `font-heading`)
- 正文: Open Sans + Noto Sans SC (class: `font-sans`)

**CSS 自定义属性 (Tokens):**
```css
:root {
  --color-primary: #7C3AED;
  --color-secondary: #A78BFA;
  --color-cta: #22C55E;
  --color-background: #FAF5FF;
  --color-text: #4C1D95;
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px; --space-2xl: 48px; --space-3xl: 64px;
  --shadow-sm / --shadow-md / --shadow-lg / --shadow-xl
}
```

---

## 7. 构建配置

```javascript
// next.config.mjs
{
  output: "standalone",
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 768, 1024, 1440, 1920],
  },
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    optimizePackageImports: ["lucide-react"],
  },
  headers() → 安全响应头 (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
}
```

**部署**: Docker 多阶段构建 → `docker compose up -d`

---

## 8. 变更记录 (v3.0 → v3.1 极限性能优化)

| 日期 | 变更 | 详情 |
|------|------|------|
| 04-29 | ⚡ RSC 架构重构 | 首页、新闻、活动列表与详情页全面剥离 `use client`，转为 Server Component 直连 Prisma，消除 fetch 瀑布流 |
| 04-29 | 🗜️ 数据减负 | 移除 `alumni_encrypted.ts` (Base64 巨型客户端炸弹)，雷达与证书页全面改用服务端 API (`/api/alumni/search` 与 `verify`) |
| 04-29 | 🚀 字体渲染提速 | 废除 `globals.css` 中的 `@import` 阻塞加载，启用 Next.js 原生 `next/font/google` (Zero CLS) |
| 04-29 | 🛡️ CSS/GPU 防暴雷 | 移除全局星空动画上的 `will-change: transform`，引入 `contain: content` 与 `content-visibility: auto`，大幅降低显存占用与 Layout 计算 |
| 04-29 | 📦 数据库防击穿 | 为 Prisma 的 Status、Role 等高频字段添加 `@@index`，并用 `getCachedOrFetch` (Redis) 阻断高频 API (如地图与首页 Dashboard) 对 SQLite 的直接全表扫描 |
| 04-29 | ⏳ Suspense 流式 | 首页拆分 `LatestUpdatesSection` 并引入 React `<Suspense>` 边界，实现流式渲染 (Streaming) |

---

## 9. 图片上传

**接口**: `POST /api/upload`

**限制**:
- 格式: JPEG, PNG, WebP, GIF
- 大小: 最大 5MB
- 存储: `public/uploads/`
- 返回: `{ url: "/uploads/filename.jpg", filename: "..." }`

---

## 10. 环境变量

```bash
# .env 必需配置
DATABASE_URL="file:./dev.db"        # SQLite 数据库路径
ACCESS_PASSWORD="iloveyanchuan!"    # 校友入口口令 (生产环境务必修改！)

# 可选配置
SITE_URL="https://yanchuaner.cn"    # 站点 URL
REDIS_URL="redis://localhost:6379"  # Redis 缓存 (可选)
```

---

## 11. 开发命令

```bash
npm run dev          # 开发服务器 (0.0.0.0:3000)
npm run build        # 生产构建 (standalone, 26 页面)
npm run start        # 生产服务器
npm run lint         # ESLint 检查
node scripts/seed_content.js  # 填充新闻/活动种子数据
```
