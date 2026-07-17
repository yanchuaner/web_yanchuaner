# UI 开发指南

本文面向参与前端共建的开发者，说明页面应如何复用现有设计系统、接入双主题与双语、控制动画生命周期，以及如何验证移动端。完整组件目录与设计契约见 [ui-system.md](./ui-system.md)。

## 1. 基本原则

1. 颜色、阴影和表面只使用语义令牌，不写固定浅色、固定深色或十六进制色值。
2. 固定界面文案必须同时写入 `src/locales/zh.json` 与 `src/locales/en.json`。
3. 基础 UI 不拉取业务数据；页面和业务组件负责组合数据与交互。
4. 页面先在 390px 移动端成立，再扩展桌面布局。
5. 动效必须有明确状态含义，并在离屏、后台页或减少动态效果时停止。

## 2. 单一来源

| 范围 | 文件 |
| --- | --- |
| 亮暗主题变量 | `src/app/globals.css` 的 `:root` 与 `.dark` |
| Tailwind 语义映射 | `tailwind.config.ts` |
| 主题与语言状态 | `src/components/ThemeAndLocaleProvider.tsx` |
| 中英字典 | `src/locales/zh.json`、`src/locales/en.json` |
| 基础组件出口 | `src/components/ui/index.ts` |
| 机器可读组件目录 | `src/components/ui/catalog.ts` |
| 组件分层与动效预算 | `docs/ui-system.md` |

`layout.tsx` 中的防闪烁脚本会在 React hydration 前恢复主题；不要在页面里自行读取 `localStorage` 或维护第二套主题状态。

## 3. 语义令牌

常用 Tailwind 类：

```tsx
bg-app                // 页面背景
bg-surface            // 主表面
bg-surface-muted      // 次级表面
text-main             // 主文本
text-brand            // 品牌强调
border-line           // 自适应边框
text-success          // 成功状态
text-warning          // 待处理状态
text-danger           // 错误或危险操作
text-info             // 中性信息提示
shadow-sm             // 静态表面
shadow-md             // 悬停或抬升状态
shadow-lg             // 弹窗和浮层
```

禁止新增：

```tsx
bg-white
text-gray-700
dark:bg-slate-900
bg-[#101020]
style={{ color: "#ffffff" }}
```

Canvas、Leaflet 或像素处理无法使用 Tailwind 时，调用 `themeRgb("--brand-rgb", alpha)` 读取同一组 CSS 变量。

## 4. 双语接入

客户端组件通过 Context 读取翻译：

```tsx
"use client";

import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export function Example() {
  const { t } = useThemeAndLocale();
  return <button aria-label={t("common.close")}>{t("common.close")}</button>;
}
```

规则：

- 路由、图标和类型可以保持静态，展示文字在渲染阶段调用 `t()`。
- ARIA label、title、空状态、错误信息和按钮文案同样需要翻译。
- 管理员发布的新闻、活动、故事等业务内容保持原文，不由界面字典自动翻译。
- 英文缺键回退中文只是容错；提交前必须同时补齐两份字典。
- 隐私、合规和免责声明集中在 `/privacy`，内容页不重复大段声明。

## 5. 基础组件

统一从 `@/components/ui` 导入：

```tsx
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FormStatus,
  GlassCard,
  PageHeader,
  PageShell,
  ResponsiveTabs,
  SectionIntro,
  Skeleton,
} from "@/components/ui";
```

| 场景 | 组件 |
| --- | --- |
| 页面最大宽度与留白 | `PageShell` |
| 页面 H1、说明与右侧动作 | `PageHeader` |
| 叙事区块标题 | `SectionIntro` |
| 独立内容卡片 | `GlassCard` |
| 命令与导航 | `Button`、`ButtonLink` |
| 状态与分类 | `Badge` |
| 空、错、提交和加载状态 | `EmptyState`、`ErrorState`、`FormStatus`、`Skeleton` |
| 移动端可滚动的选项组 | `ResponsiveTabs` |

页面区段不应全部包装成卡片。首页等叙事页面优先使用全宽内容带、边界线和留白，仅为独立条目、表单或工具使用卡片。

## 6. 页面骨架

```tsx
import { GlassCard, PageHeader, PageShell } from "@/components/ui";

export default function ExamplePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="SECTION"
        title="页面标题"
        description="一句话说明当前页面的任务。"
      />
      <GlassCard className="mt-6 p-5 sm:p-6">
        页面内容
      </GlassCard>
    </PageShell>
  );
}
```

如果页面需要响应语言切换，标题和说明应放进客户端展示组件；Server Component 保留数据库查询、缓存和权限判断，并通过可序列化 props 或 ReactNode 插槽组合。

## 7. 导航与后台

- 前台导航分组维护在 `src/components/MobileNav.tsx`。
- 前台壳由 `Header`、`MobileNav`、`SiteFooter` 组成。
- 后台导航维护在 `src/app/(admin)/layout.tsx`。
- 后台页面使用 `AdminPageShell`、`AdminBreadcrumb`、`AdminPagination` 和 `AdminQuickAction`。
- 标准后台 CRUD 优先使用 `useResource` 与 `CrudManager`，不要在页面重复实现 fetch 状态机。

## 8. Canvas 与动画

持续动画至少满足：

- 使用 `requestAnimationFrame`，并保存当前 id。
- `document.hidden` 时取消帧循环。
- `IntersectionObserver` 判定离屏时取消帧循环。
- `prefers-reduced-motion: reduce` 下绘制静态最终状态。
- 卸载时清理帧、observer、事件监听器和定时器。
- Canvas DPR 上限应受控，避免高分屏无上限放大像素成本。

参考实现：`CelestialSphere`、`AlumniSignalField`、`InteractiveStarfield`、`ChannelTV`。

## 9. 移动端要求

- 至少验证 `390x844` 与常规桌面宽度。
- 页面不得产生横向滚动；长英文允许换行。
- 点击目标最小高度 44px。
- 弹窗和抽屉使用动态视口高度与 safe-area。
- 固定视觉必须使用 `aspect-ratio`、`min/max-width` 或稳定高度，避免 hydration 后跳动。
- 英文导航较长时使用分组菜单，不强行把所有入口塞入单行。

## 10. 提交前验证

```bash
npx tsc --noEmit
npm run lint
npm run audit:ui-tokens
npm run audit:i18n-shells
```

涉及 Canvas、主题、导航或响应式布局时，还应实际检查亮色、暗色、中英文和移动端。生产构建使用：

```bash
npm run build:check:wsl
```
