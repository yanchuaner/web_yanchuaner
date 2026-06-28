# UI 开发指南 V2.0（贡献者必读）

> 面向参与共建的校友开发者。读完本指南，你将能**安全地**修改页面外观，而不会误触数据流、鉴权与 API 等核心逻辑。
>
> 一句话原则：**改外观动组件和设计令牌；改数据动 Hook 和 API。两者互不交叉。**

---

## 目录

1. [V2.0 主题：星云紫琉璃深色模式](#1-v20-主题星云紫琉璃深色模式)
2. [设计令牌字典（颜色 / 圆角 / 阴影 / 字体）](#2-设计令牌字典)
3. [CSS 组件类速查](#3-css-组件类速查)
4. [核心 UI 组件速查表](#4-核心-ui-组件速查表)
5. [前台内容页标准骨架](#5-前台内容页标准骨架)
6. [导航信息架构](#6-导航信息架构)
7. [后台 CRUD 架构（useResource + CrudManager）](#7-后台-crud-架构)
8. [V2.0 组合框模式（CityCombobox）](#8-v20-组合框模式)
9. [新手避坑指南：如何安全改样式](#9-新手避坑指南如何安全改样式)
10. [常见任务速查（我想改 X，该动哪个文件）](#10-常见任务速查)

---

## 1. V2.0 主题：星云紫琉璃深色模式

V2.0 全站采用了**深空琉璃质感**设计语言——"Starry Purple Dark Glassmorphism"。不是传统的白底黑字，而是一套深邃的紫黑宇宙主题。

### 1.1 视觉特征

| 特征 | 说明 |
|------|------|
| **页面底色** | 宇宙深空黑 `#03010b`（`--color-background`） |
| **卡片表面** | 暗紫磨砂玻璃 `rgba(13, 9, 36, 0.65)`（`--color-surface`），叠加 `backdrop-blur-xl` |
| **主色** | 柔和紫 `#A78BFA`（`--color-brand`） |
| **辅助色** | 亮紫 `#C084FC`（`--color-brand-soft`） |
| **CTA 色** | 翠绿 `#22C55E`（`--color-cta`） |
| **文本色** | 极淡紫白 `#F5F3FF`（`--color-text`） |
| **描边** | 紫色半透明 `rgba(167, 139, 250, 0.15)`（`--color-line`） |

### 1.2 环境视觉效果

V2.0 主题包含多层次的动态环境效果，由 `globals.css` 统一管理：

- **星云漂浮背景** — `body::before` / `body::after`：两个大型径向渐变光斑，缓慢漂移，营造星云漫游感。
- **流星扫尾** — `.meteor-layer`：两根渐变光线周期扫过屏幕，极低频率触发。
- **噪声纹理** — `.noise-overlay`：SVG 噪点叠加层（opacity 0.03），增加胶片质感。
- **星辰呼吸** — `home-breath-stars-*`：首页专用多图层星点渐变透明度动画。
- **交互星野** — `InteractiveStarfield` 组件：Canvas 粒子系统，鼠标靠近时粒子排斥，隐喻校友间的引力联结。

### 1.3 性能优化原则

- 移动端（`max-width: 768px`）**自动禁用** `body::before`、`body::after`、流星层、星野层等 CPU 密集型动画，保证滚动流畅。
- 所有持续动画元素已移除 `will-change`，避免 GPU 内存泄漏。
- 用户开启 `prefers-reduced-motion: reduce` 时，**全局关闭**所有环境动画和入场过渡。

### 1.4 暗色模式兼容覆盖器

`globals.css` 末尾的 "Cosmic Dark Mode Utility Overrides" 区块，负责**劫持**全站硬编码的 Tailwind 浅色类名（如 `bg-white`、`text-gray-700`、`.bg-amber-50` 等），自动映射为深色主题色。这意味着即使某些旧组件或第三方 UI 写了浅色类名，无需逐一修改也能在深色背景上正确显示。

> **设计意图**：这份覆盖器是「渐进式」策略——新代码请直接用语义令牌，旧代码由覆盖器兜底。**不要在页面里写新的 `bg-white` 或 `text-gray-700`。**

---

## 2. 设计令牌字典

全站颜色是**单一来源**的：定义在 `src/app/globals.css` 的 `:root` 作为 CSS 自定义属性，并通过 `tailwind.config.ts` 暴露为语义化 Tailwind 类名。

**请永远使用语义令牌，不要在代码里裸写十六进制色值（如 `#7C3AED`）。**

### 2.1 颜色令牌映射表

| 语义令牌 | CSS 变量 | 实际色值 | 含义与用途 |
|----------|----------|----------|-----------|
| `brand` | `--brand-rgb` | `#A78BFA` 柔和紫 | 主色：链接、图标、强调 |
| `brand-soft` | `--brand-soft-rgb` | `#C084FC` 亮紫 | 辅助色、柔和边框 |
| `brand-fg` | `--brand-fg-rgb` | `#F5F3FF` 淡紫白 | 主文本色（标题/正文） |
| `accent` | `--accent-rgb` | `#22C55E` 绿 | CTA 行动号召 |
| `surface` | `--surface-rgb` | `rgba(13,9,36,0.65)` 暗紫磨砂 | 卡片表面 |
| `surface-muted` | `--surface-muted-rgb` | `#03010B` 深空黑 | 页面背景 |
| `line` | `--color-line` | `rgba(167,139,250,0.15)` | 统一描边色 |

### 2.2 用法示例

```tsx
text-brand          // 主色文字（淡紫）
text-brand-fg       // 正文色（淡紫白）
bg-brand/10         // 主色 10% 透明背景
bg-brand/20         // 主色 20% 透明背景
border-brand/20     // 主色 20% 透明边框
border-line         // 统一描边
bg-surface          // 卡片表面（磨砂暗紫）
bg-surface-muted    // 页面底色（深空黑）
text-accent         // CTA 绿
```

> **透明度修饰符**（`/10`、`/20`、`/30` 等）仅在 RGB 通道定义的令牌上有效（`brand`、`brand-soft`、`brand-fg`、`accent`、`surface`、`surface-muted`），因为这些令牌底层使用 `rgb(var(--xxx-rgb) / <alpha-value>)` 格式。`line` 令牌无此能力（它是固定透明度的 CSS 变量）。

### 2.3 圆角令牌

| 类名 | 值 | 用途 |
|------|-----|------|
| `rounded-btn` | 12px | 按钮 |
| `rounded-card` | 16px | 卡片（等价 `rounded-2xl`） |
| `rounded-modal` | 20px | 浮层弹窗 / 下拉面板 |

### 2.4 阴影令牌（仅 3 级）

| 类名 | 对应 CSS 变量 | 用途 |
|------|-------------|------|
| `shadow-sm` | `--shadow-sm` | 静态卡片 |
| `shadow-md` | `--shadow-md` | 悬停态（带紫色调） |
| `shadow-lg` | `--shadow-lg` | 浮层 / 弹窗（带紫色调） |

> 系统内还有一个 `--shadow-xl` 变量用于极端浮层场景（如侧边栏），但不作为 Tailwind 类名暴露，勿在页面中硬编码 box-shadow。

### 2.5 字体令牌

| 类名 | 字体栈 | 用途 |
|------|--------|------|
| `font-sans` | `'Open Sans', 'Noto Sans SC', system-ui, ...` | 正文、UI 文本 |
| `font-heading` | `'Poppins', 'Noto Sans SC', system-ui, ...` | 标题 (h1-h6) |

> 字体的全局应用由 `globals.css` 的 `@layer base` 统一处理——`body` 自动使用 `font-sans`，`h1-h6` 自动使用 `font-heading`。手动指定只在需要覆盖默认行为的场景才需要。

---

## 3. CSS 组件类速查

以下 CSS 类定义在 `src/app/globals.css` 的 `@layer components` 中，可直接用于任何元素。

### 3.1 毛玻璃卡片

| 类名 | 说明 |
|------|------|
| `.glass-card-base` | 基础毛玻璃卡片：`rounded-card` + 半透明暗紫背景 + `backdrop-blur-xl` + 紫色描边。悬停时上浮 2px + 微缩放 + 描边加亮。内置 `focus-visible` 环。 |
| `.glass-card-premium` | 高级毛玻璃卡片：更深的 backdrop-blur (16px) + 鼠标追踪光斑效果（`::before` 伪元素跟随 `--mouse-x`/`--mouse-y`）+ 悬停上浮 4px。**这是 `GlassCard` 组件实际使用的类。** |
| `.glass-card-glow` | 配合 `.glass-card-premium` 的内部高亮光斑层（需手动放置 `<div>` 作为子元素）。`GlassCard` 组件已自动处理。 |

### 3.2 按钮

| 类名 | 说明 |
|------|------|
| `.btn-primary` | 主按钮：绿色背景（`--color-cta`）、白色文字、悬停上浮 + 透明度变化 |
| `.btn-secondary` | 次要按钮：透明背景 + 紫色描边 + 紫色文字、悬停上浮 + 紫色微背景 |

> **优先使用 `Button` / `ButtonLink` 组件**，它们包含更完整的 variant 支持（primary/secondary/ghost/danger）和内置的 focus ring。仅在无法使用组件的特殊场景（如第三方库集成）才直接使用 CSS 类。

### 3.3 卡片与表单

| 类名 | 说明 |
|------|------|
| `.card` | 通用卡片：页面底色背景 + `rounded-card` (16px) 圆角 + 阴影 + 悬停效果（上浮 + 阴影增强）。使用 `contain: content` 进行性能隔离。 |
| `.input` | 统一输入框：暗色背景 `rgba(4,1,13,0.5)` + 紫色描边 + 内边距。聚焦时描边变亮 + 紫色光晕 ring。 |
| `.cosmic-card` | 首页特效卡片：渐变流光描边（`::before` 伪元素，悬停时显示）+ 底部高光（`::after`）+ 上浮动画。 |

### 3.4 动画类

| 类名 | 说明 |
|------|------|
| `.animate-fade-in-up` | 上滑淡入入场动画（0.7s cubic-bezier） |
| `.animate-pulse-glow` | 紫光呼吸脉冲动画（3s 循环） |
| `.animate-float-star` | 星点漂浮动画（20s 线性循环） |
| `.animate-marquee` | 垂直滚动跑马灯（30s，悬停暂停） |
| `.announcement-marquee-track` | 水平公告滚动（30s，悬停暂停） |
| `.stagger-grid` | 子元素交错入场容器（为 6 个子元素设置递增 delay） |
| `.gate-shake` | 口令门卫抖动动画（0.36s） |

---

## 4. 核心 UI 组件速查表

所有基础组件位于 `src/components/ui/`，统一从 `@/components/ui` 导入。

```tsx
import {
  PageShell, GlassCard, PageHeader, SectionHeader,
  Button, ButtonLink, Badge, EmptyState,
  DisclaimerBanner, RevealSection, InteractiveStarfield
} from "@/components/ui";
```

| 组件 | 作用 | 关键 props |
|------|------|-----------|
| `PageShell` | 页面外层容器（最大宽度 + 留白） | `size`: `"narrow"` (max-w-3xl) / `"default"` (max-w-6xl) / `"wide"` (max-w-7xl) |
| `GlassCard` | 高级毛玻璃卡片（内置鼠标追踪光斑） | `as`: `"div"` / `"article"` / `"section"`，`className` |
| `PageHeader` | 页头：胶囊标签 + H1 + 描述（内置入场动画） | `eyebrow`、`eyebrowIcon`、`title`、`description`、`action` |
| `SectionHeader` | 区块标题：图标 + H2 + 右侧操作区 | `icon`、`title`、`action` |
| `Button` | 按钮（`<button>`） | `variant`: `"primary"` / `"secondary"` / `"ghost"` / `"danger"`，`size`: `"sm"` / `"md"`，`icon` |
| `ButtonLink` | 链接样式按钮（Next `Link`） | 同上 + `href` |
| `Badge` | 标签胶囊 | `tone`: `"brand"` / `"neutral"` / `"success"` / `"warning"` / `"info"` / `"danger"`，`icon` |
| `EmptyState` | 空状态占位（虚线框 + 图标 + 文案） | `icon`、`title`、`description`、`action` |
| `DisclaimerBanner` | 琥珀色免责声明横幅 | `title`（可选，有标题时显示盾牌图标 + 结构化布局），`withIcon` |
| `RevealSection` | 滚动入场包装组件 | `direction`: `"up"` / `"left"` / `"right"` / `"scale"`，`delay`（秒） |
| `InteractiveStarfield` | Canvas 粒子星野（交互式，鼠标排斥） | 无 props（自动全屏覆盖） |

### 4.1 `cn()` 工具函数

位置：`src/components/ui/cn.ts`。零依赖的类名合并函数，按条件拼接 Tailwind 类名：

```tsx
import { cn } from "@/components/ui/cn";

cn("base-class", isActive && "text-brand", className);  // falsy 值自动过滤
```

### 4.2 `RevealSection` 滚动入场

`RevealSection` 基于原生 `IntersectionObserver`（`useInView` Hook），零轮询依赖。包裹任意内容即可在滚入视口时播放上滑淡入动画。

```tsx
<RevealSection>
  <GlassCard>第一张卡片</GlassCard>
</RevealSection>

<RevealSection direction="left" delay={0.2}>
  <GlassCard>第二张卡片（从左侧滑入，延迟 0.2s）</GlassCard>
</RevealSection>
```

`PageHeader` 组件内部已默认包裹 `RevealSection`，无需额外处理。

### 4.3 按钮 Variant 参考

| variant | 视觉效果 | 典型用途 |
|---------|---------|---------|
| `primary` | 翠绿背景 + 白色文字 + 悬停绿光 drop-shadow + 上浮 | 主要 CTA、表单提交 |
| `secondary` | 透明背景 + 紫色描边 + 紫色文字 + 悬停紫光 + 上浮 | 次要动作、返回 |
| `ghost` | 无边框 + 紫色文字 + 悬停紫色微背景 | 轻量操作（如表格行内编辑） |
| `danger` | 玫瑰红文字 + 悬停玫瑰红微背景 | 删除、撤销等破坏性操作 |

---

## 5. 前台内容页标准骨架

一个标准前台内容页长这样——声明式、零"面条类名"：

```tsx
import { Mail } from "lucide-react";
import { PageShell, GlassCard, PageHeader, SectionHeader, ButtonLink, EmptyState } from "@/components/ui";

export default function MyPage() {
  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="CONTACT"
          eyebrowIcon={Mail}
          title="联系我们"
          description="一句话描述这个页面。"
          action={<ButtonLink href="/" variant="secondary">返回首页</ButtonLink>}
        />

        {/* 内容区域 */}
        <SectionHeader icon={Mail} title="联系方式" />

        {/* 空数据回退 */}
        <EmptyState icon={Mail} title="暂无数据" description="还没有内容，敬请期待。" />
      </GlassCard>
    </PageShell>
  );
}
```

### 5.1 卡片内分隔

在 `GlassCard` 内部使用多个区块时，推荐用 `border-line` 上边框分隔，配合 `pt-6 mt-6`：

```tsx
<GlassCard className="p-6 md:p-8">
  <PageHeader ... />
  {/* 第一个区块 */}
  <section>
    <SectionHeader ... />
    ...
  </section>
  {/* 第二个区块 */}
  <section className="border-t border-line pt-6 mt-6">
    <SectionHeader ... />
    ...
  </section>
</GlassCard>
```

---

## 6. 导航信息架构

### 6.1 前台主导航

位置：`src/components/MobileNav.tsx`。

导航结构由 `NAV_GROUPS` 数组驱动——修改菜单项只需改这个数组，渲染逻辑无需变动。

```tsx
// 结构定义（简化示意）
NAV_GROUPS = [
  { label: "校友空间", items: [星空通讯录, 电子校友证, 校友成就墙, 燕中故事, 燕中记忆] },
  { label: "校园资讯", items: [新闻公告, 校友活动] },
  { label: "资源",     items: [在校生资源站, 教师频道] },
  { label: "关于",     items: [学校介绍, 联系我们] },
];
```

**桌面端**：4 组 Mega Menu 下拉面板，悬停展开，每个菜单项带有图标 + 描述文字。
**移动端**：分组抽屉（Portal 渲染），汉堡按钮触发，路由切换自动关闭，Esc 关闭，背景滚动锁定。

### 6.2 后台侧边栏

位置：`src/app/(admin)/layout.tsx`。

由 `NAV_SECTIONS` 数组驱动，分 4 组：

```tsx
NAV_SECTIONS = [
  { heading: "概览",     items: [控制面板] },
  { heading: "审核",     items: [用户审核, 旧资料认领, 故事审核, 内容审核, 信息修改申请] },
  { heading: "内容运营", items: [新闻管理, 活动管理, 燕中故事, 校友成就墙, 燕中记忆] },
  { heading: "站点配置", items: [教师频道, 页面内容, 校友名单] },
];
```

- 当前激活项：紫色发光背景 (`bg-brand/15`) + 左侧高亮竖条 + 加粗文字
- 桌面：固定左侧 264px 宽度
- 移动端：可折叠侧边栏，顶部有汉堡按钮触发

### 6.3 路由匹配逻辑

导航的"当前激活"判断逻辑统一为：`pathname === href` 或 `pathname.startsWith(href + "/")`。对于 `/admin` 根路由使用 `exact: true` 精确匹配，避免所有后台子页面都将它标记为激活。

---

## 7. 后台 CRUD 架构

后台管理页遵循**统一架构**：数据层与 UI 层彻底分离。

```
useResource (数据层)  ←—— 只管 fetch/状态，对接 /api/admin/*
      +
CrudManager (UI 层)   ←—— 只管表单/列表渲染，零 fetch
```

### 7.1 `useResource` 数据 Hook

位置：`src/hooks/useResource.ts`。封装 `列表加载 + 增/改/删 + loading/saving/error`。

```ts
const res = useResource<Story>({
  endpoint: "/api/admin/stories",   // 集合端点
  listKey: "stories",               // 列表响应里数组的字段名
  listQuery: "page=teachers",       // 可选：列表查询串
  createDefaults: { page: "x" },    // 可选：创建时附加的固定字段
  autoLoad: true,                   // 可选：是否挂载时自动加载（默认 true）
});

res.items       // T[]           数据数组
res.loading     // boolean       列表加载中
res.saving      // boolean       增/改进行中
res.error       // string        错误信息
res.setError    // (msg) => void 设置/清空错误
res.create(payload)      // POST   endpoint        → Promise<boolean>
res.update(id, payload)  // PUT    endpoint/:id    → Promise<boolean>
res.remove(id)           // DELETE endpoint/:id    → Promise<boolean>
res.reload()             // 手动重新加载列表
```

### 7.2 `CrudManager` 通用管理组件

位置：`src/components/admin/CrudManager.tsx`。字段配置驱动——声明字段列表，自动渲染表单 + 列表项。最适合「纯文本/下拉表单 + 列表」的页面。

支持的字段类型：`text`、`textarea`、`date`、`number`、`select`、`url`。

完整示例见 `src/app/(admin)/admin/stories/page.tsx` 和 `src/app/(admin)/admin/achievements/page.tsx`：

```tsx
const FIELDS: FieldConfig[] = [
  { name: "title",    label: "标题",   required: true },
  { name: "category", label: "类别",   type: "select", options: [...] },
  { name: "body",     label: "正文",   type: "textarea", fullWidth: true },
];

export default function MyAdminPage() {
  const res = useResource<MyType>({ endpoint: "/api/admin/xxx", listKey: "items" });

  return (
    <CrudManager<MyType>
      title="数据管理"
      fields={FIELDS}
      items={res.items}
      loading={res.loading}
      saving={res.saving}
      error={res.error}
      setError={res.setError}
      onCreate={res.create}
      onUpdate={res.update}
      onDelete={res.remove}
      toForm={(item) => ({ title: item.title, category: item.category, ... })}
      toPayload={(form) => ({ ...form })}  // 可选：表单 → API payload 转换
      validate={(form) => form.title ? null : "标题不能为空"}
      renderItem={(item) => <><strong>{item.title}</strong><p>{item.category}</p></>}
    />
  );
}
```

**CrudManager Props 完整清单**：

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | 是 | 页面标题 |
| `subtitle` | `string` | 否 | 副标题 |
| `fields` | `FieldConfig[]` | 是 | 表单字段配置 |
| `items` | `T[]` | 是 | 数据列表 |
| `loading` / `saving` | `boolean` | 是 | 加载/保存状态 |
| `error` / `setError` | `string` / `(msg) => void` | 是 | 错误信息 |
| `onCreate` / `onUpdate` / `onDelete` | 函数 | 是 | CRUD 操作回调 |
| `toForm` | `(item: T) => FormValues` | 是 | 记录 → 表单初始值 |
| `toPayload` | `(form: FormValues) => Record<string, unknown>` | 否 | 表单值 → API payload 转换 |
| `validate` | `(form: FormValues) => string \| null` | 否 | 返回 null 表示通过，返回字符串阻止提交 |
| `renderItem` | `(item: T) => ReactNode` | 是 | 列表项左侧信息区渲染 |
| `emptyHint` / `deleteConfirm` | `string` | 否 | 空列表提示 / 删除确认文案 |

### 7.3 特殊页面：只接 useResource 数据层，自写 UI

当页面有**特殊交互**（图片上传、图标选择器、排序拖拽、Tab 切换），`CrudManager` 表达不了，这时**只接入 `useResource` 数据层**，UI 自己写。

参考实现：

| 页面 | 路径 | 特殊交互 |
|------|------|---------|
| 燕中记忆 | `src/app/(admin)/admin/memories/page.tsx` | 图片 16:9 上传 + 图标选择器 + 排序 |
| 页面内容 | `src/app/(admin)/admin/content/page.tsx` | Tab 切换（`listQuery` 随 Tab 变化） |
| 教师频道 | `src/app/(admin)/admin/teachers/page.tsx` | 图标选择器 + 排序 |

这些页面用 `res.update(a.id, { sortOrder })` 实现排序、用 `/api/upload` 实现上传——**数据流仍由 `useResource` 统一托管，架构保持一致。**

---

## 8. V2.0 组合框模式

V2.0 引入了**组合框（Combobox）**模式，用于"可搜索筛选的下拉选择"场景。典型实现在 `src/app/(front)/me/edit/page.tsx`（个人资料编辑页）的 `CityCombobox` 组件。

### 8.1 设计模式

组合框 = 文本输入框 + 可搜索下拉列表。用户可以直接输入值，也可以从过滤后的下拉列表中选取。它解决了传统 `<select>` 在选项数量多时不便搜索的痛点。

### 8.2 核心行为

```
输入框（text input）
  ├─ 输入时 → 过滤选项列表 → 显示匹配项
  ├─ 聚焦时 → 展开下拉列表
  ├─ 点击选项 → 填入选中值 → 关闭列表
  └─ 点击外部 → 关闭列表
```

### 8.3 标准实现模板

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface ComboboxProps {
  options: string[];
  defaultValue: string;
  name: string;          // 隐藏 input 的 name，提交表单用
  placeholder?: string;
}

function Combobox({ options, defaultValue, name, placeholder }: ComboboxProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部默认值变化时同步
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // 过滤逻辑
  const filtered = query.trim() === ""
    ? options
    : options.filter((opt) =>
        opt.toLowerCase().includes(query.toLowerCase().trim())
      );

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mt-1" ref={containerRef}>
      {/* 隐藏字段：确保表单提交时携带选中值 */}
      <input type="hidden" name={name} value={query} />

      <input
        type="text"
        className="input w-full text-xs focus:border-brand/50"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-brand/15 bg-[#05030e]/95 backdrop-blur-2xl py-1 text-xs shadow-lg">
          {filtered.length === 0 ? (
            <li className="py-2 px-3 text-brand-fg/40">
              未找到匹配项，可直接保存当前输入
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt}
                className="cursor-pointer py-2 px-3 hover:bg-brand/15 hover:text-brand text-brand-fg transition"
                onClick={() => { setQuery(opt); setIsOpen(false); }}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
```

### 8.4 使用场景

| 场景 | 数据来源 | 说明 |
|------|---------|------|
| 城市选择 | 静态常量 `MAJOR_CITIES`（100+ 城市） | `me/edit` 中的 `CityCombobox` |
| 学校搜索 | API 数据 | 未来可按相同模式扩展为异步搜索 |
| 标签输入 | 预定义标签集 | 用户可输入自定义标签，也可从推荐中选择 |

### 8.5 与传统 `<select>` 的选择原则

| 场景 | 推荐方案 |
|------|---------|
| 选项 < 10 个，无需搜索 | 原生 `<select>` + `.input` 类名 |
| 选项 10-50 个，需要搜索 | 组合框 |
| 选项 > 50 个或来自 API | 组合框 + 异步搜索（未来扩展） |

---

## 9. 新手避坑指南：如何安全改样式

### 9.1 可以放心做的事

- 修改 `src/components/ui/*` 里组件的 Tailwind 类名（改全站外观）
- 修改 `src/app/globals.css` 的 `:root` 颜色变量（改主题色）
- 在页面里替换组件、调整布局、增删展示元素
- 用语义令牌替换页面里残留的硬编码十六进制色
- 修改 `tailwind.config.ts` 的令牌映射（如调整 `rounded-btn` 的值）

### 9.2 绝对不要碰的红线

| 禁区 | 路径 | 原因 |
|------|------|------|
| 后端 API | `src/app/api/**` | 数据契约与服务端逻辑 |
| 数据库模型 | `prisma/schema.prisma` | 改动会破坏数据结构 |
| 数据库连接 | `src/lib/db.ts` | 底层连接 |
| 鉴权校验 | `yc_access_token` 相关、`src/lib/verify-token.ts`、`src/lib/admin-auth.ts`、`middleware.ts` | 安全机制，改错会导致越权 |
| 路由地址 | 任何 `href` / 文件夹名 | 改 URL 会导致死链、破坏 SEO 与外部引用 |

### 9.3 改 CRUD 页时的注意点

- 改**外观**：只动 `CrudManager` 的 `renderItem`、`FIELDS` 配置、或页面 JSX。
- **不要**在页面里手写 `fetch('/api/...')`——数据交给 `useResource`。
- **不要**改 `useResource` 的 `endpoint`/`listKey` 去指向别的接口，除非你清楚 API 契约。
- 迁移老页面时，**务必保留原有特殊逻辑**（如图片上传链路、排序、Tab 切换）。

### 9.4 暗色主题兼容注意事项

- **不要新增** `bg-white`、`text-gray-700`、`text-slate-800` 等浅色硬编码类名。虽然覆盖器会兜底，但这是技术债。
- **不要新增**硬编码十六进制色值如 `bg-[#7C3AED]`、`text-[#4C1D95]`。使用语义令牌 `bg-brand`、`text-brand-fg`。
- 状态标签（待审核/已通过/已驳回）使用 `Badge` 组件的 `tone` prop，不要硬编码 `bg-amber-*`、`bg-emerald-*` 等。
- 表单输入框统一使用 `.input` CSS 类，覆盖器已为其配置了暗色主题样式。

### 9.5 改完后必须自检

```bash
npx tsc --noEmit     # 类型检查，必须零报错
npm run lint         # 代码规范，必须零警告
```

两项都通过，才能提交 PR。

---

## 10. 常见任务速查

| 我想…… | 该动的文件 |
|--------|-----------|
| 改全站主色 / 主题色 | `src/app/globals.css` 的 `:root` 部分（改 `--color-primary`、`--color-cta` 等，以及对应的 `*-rgb` 变量） |
| 改卡片/按钮的统一外观 | `src/components/ui/GlassCard.tsx` / `src/components/ui/Button.tsx` |
| 改毛玻璃效果参数 | `src/app/globals.css` 的 `.glass-card-base` / `.glass-card-premium` 类 |
| 改圆角/阴影/字体的全站值 | `tailwind.config.ts` 的 `borderRadius` / `boxShadow` / `fontFamily` |
| 改顶部导航的分组或菜单项 | `src/components/MobileNav.tsx` 的 `NAV_GROUPS` 数组 |
| 改后台侧边栏分组或菜单项 | `src/app/(admin)/layout.tsx` 的 `NAV_SECTIONS` 数组 |
| 改面包屑标签文字 | `src/app/(admin)/layout.tsx` 的 `segmentLabels` 对象 |
| 改某个内容页的文案/布局 | 对应 `src/app/**/page.tsx` |
| 新增一个后台 CRUD 页 | 仿照 `src/app/(admin)/admin/stories/page.tsx`（useResource + CrudManager） |
| 新增一个有特殊交互的后台页 | 仿照 `src/app/(admin)/admin/memories/page.tsx`（仅 useResource + 自定义 UI） |
| 新增一个组合框选择器 | 仿照 `src/app/(front)/me/edit/page.tsx` 的 `CityCombobox` |
| 新增一个前台内容页 | 仿照第 5 节的标准骨架，复制 `PageShell` + `GlassCard` + `PageHeader` 结构 |
| 添加新的全局动画 | `src/app/globals.css` 添加 `@keyframes` 和对应的工具类 |
| 改某页的数据来源 | 找到对应 `/api/**`——但这是后端，**需与维护者确认** |

---

## 附录 A：文件路径索引

| 关注点 | 路径 |
|--------|------|
| 设计令牌：CSS 变量 | `src/app/globals.css` (`:root`) |
| 设计令牌：Tailwind 映射 | `tailwind.config.ts` |
| CSS 组件类 | `src/app/globals.css` (`@layer components`) |
| UI 基础组件 | `src/components/ui/` (9 个文件) |
| 类名合并工具 | `src/components/ui/cn.ts` |
| 前台主导航 | `src/components/MobileNav.tsx` |
| 后台侧边栏 + 面包屑 | `src/app/(admin)/layout.tsx` |
| useResource Hook | `src/hooks/useResource.ts` |
| CrudManager 组件 | `src/components/admin/CrudManager.tsx` |
| RevealSection / useInView | `src/components/ui/RevealSection.tsx` / `src/hooks/useInView.ts` |
| 组合框参考实现 | `src/app/(front)/me/edit/page.tsx` (`CityCombobox`) |
| 标准后台 CRUD 参考 | `src/app/(admin)/admin/stories/page.tsx` |
| 特殊后台页参考 | `src/app/(admin)/admin/memories/page.tsx` |

---

## 附录 B：交互星野组件使用

`InteractiveStarfield` 是一个全屏 Canvas 粒子系统，通常放置在根布局的最顶层：

```tsx
// 在 layout.tsx 或页面中
<InteractiveStarfield />
```

特性：
- 45 个粒子在屏幕内缓慢漂移
- 鼠标靠近时粒子排斥（repel radius 130px）
- 近距离粒子间半透明连线（connection distance 120px），隐喻校友联结
- `mixBlendMode: screen` 叠加，`pointer-events: none` 不干扰交互
- 自动响应窗口 resize

> 注意：此组件依赖 Canvas API，仅在 Client Component 中可用。已在 `layout.tsx` 中全局引入。

---

有疑问？先看同类页面的现有实现，照着写最稳妥。欢迎共建，玩得开心。
