# 燕中校友数字母港 UI System

最后更新：2026-07-17

本文是当前前端 UI 的规范入口。目标是让亮暗主题、中英双语、移动端和动效遵循同一套组件契约，而不是由页面各自维护。

## 1. 体验原则

参考 `sui-xiang.com` 的可取之处，但按校友公益平台的任务重新组织：

1. **一个持续主视觉**：入场与首页共享“旋转星体”视觉语言。点击进入后，星体缩放并向首页主视觉位置移动，首页内容同步揭示。
2. **一屏一个信息任务**：首页只承担主视觉、核心入口、动态、校友信号与生态导览；真实城市地图只保留在认证后的目录页面，平台定位、访问规则和治理说明集中在 `/ecosystem`。
3. **状态动效代替装饰堆叠**：打字、频道雪花、按钮反馈用于解释状态；普通内容只做一次性滚入。
4. **移动端先成立**：所有固定视觉都有最大宽度、比例和安全区约束；复杂动画离屏或页面隐藏后停止。
5. **文字解释功能，而非解释界面**：文档和页面说明回答“平台是什么、谁能使用、如何参与”，不描述按钮颜色或动画本身。

## 2. 单一来源

| 范围 | 单一来源 | 使用方式 |
| --- | --- | --- |
| 颜色、阴影、表面 | `src/app/globals.css` | CSS 变量 |
| Tailwind 语义类 | `tailwind.config.ts` | `bg-app`、`text-main`、`bg-surface`、`text-brand` |
| UI 组件出口 | `src/components/ui/index.ts` | 统一从 `@/components/ui` 导入 |
| 组件机器可读目录 | `src/components/ui/catalog.ts` | `UI_COMPONENT_CATALOG` |
| 中英文案 | `src/locales/zh.json`、`src/locales/en.json` | `t("path.to.key")` |
| 主题与语言状态 | `ThemeAndLocaleProvider` | `useThemeAndLocale()` |

页面不得新增 `bg-white`、`text-gray-*`、数值色值或只适配单一主题的表面色。CRT、Canvas、地图等特殊渲染同样必须读取设备或场景语义令牌。

## 3. 组件分层

### Foundation / Layout

| 组件 | 用途 |
| --- | --- |
| `cn` | 条件类名合并 |
| `PageShell` | 页面宽度、水平与垂直留白 |
| `GlassCard` | 主题感应玻璃表面 |
| `PageHeader` | 页面级 H1、描述与操作 |
| `SectionHeader` | 紧凑区块标题 |
| `SectionIntro` | 叙事区块的 eyebrow、标题、说明与操作 |
| `GuidedSteps` | 三步流程、访问规则和新手说明 |

### Commands / Navigation

| 组件 | 用途 |
| --- | --- |
| `Button` | 当前页面命令 |
| `ButtonLink` | 导航到其他页面的命令 |
| `ResponsiveTabs` | 视图或内容集合切换 |
| `Badge` | 状态与分类，不承担命令 |

### Feedback

| 组件 | 用途 |
| --- | --- |
| `EmptyState` | 空数据 |
| `ErrorState` | 错误与重试 |
| `FormStatus` | 表单提交状态 |
| `Skeleton` / `SkeletonText` | 固定尺寸加载占位 |

### Motion / Experience

| 组件 | 动效级别 | 运行约束 |
| --- | --- | --- |
| `RevealSection` | entry | 进入视口一次 |
| `InteractiveStarfield` | ambient | 页面隐藏和离屏时停止 |
| `CelestialSphere` | ambient | 页面隐藏和离屏时停止 |
| `CelestialEntrance` | transition | 每个浏览器会话最多一次 |
| `BashTerminal` | state | 进入视口后播放，定时器必须清理 |
| `ChannelTV` | state | 雪花限帧，关机只绘制一帧 |

## 4. 功能组件归属

这些组件不是基础 UI，不应放进 `src/components/ui`：

| 域 | 组件 |
| --- | --- |
| 全局壳 | `Header`、`MobileNav`、`SiteFooter`、`AuthProvider`、`ThemeAndLocaleProvider` |
| 首页组合 | `HomeClientPage`、`CosmicBackground`、`MessageOrbit`、`AlumniSignalField`、`CommunityTeamShowcase` |
| 生态说明 | `EcosystemClientPage`、`CelestialSphere` |
| 校友地图 | `CityMapRenderer`、`AlumniSearch` |
| 业务操作 | `JoinTriggerButton`、`EventRegistrationForm`、`LatestUpdatesSection` |
| 星空体验 | `StarfieldExperience`、`ConstellationEmblem`、`RocketWorkshop` |
| 后台管理 | `AdminPageShell`、`AdminBreadcrumb`、`AdminPagination`、`AdminQuickAction`、`AdminDashboardClient`、`CrudManager` |

基础 UI 只负责视觉与交互契约；业务组件可以组合基础 UI，但基础 UI 不得导入 Prisma、API 或业务数据。

## 5. 动效预算

- 同一视口最多保留一个主要持续动画，首页为 `CelestialSphere`。
- 入场动画建议 180-700ms；场景转场最多 1100ms。
- 打字和频道雪花属于短时状态反馈，不得在不可见时运行。
- `requestAnimationFrame` 必须同时受 `document.hidden` 与 `IntersectionObserver` 控制。
- 所有 `setTimeout`、`setInterval`、observer 和事件监听器必须在卸载时释放。
- `prefers-reduced-motion: reduce` 下取消位移、循环和闪动，只保留最终状态。

## 6. 主题契约

亮暗模式只允许改变语义变量，不允许组件读取主题后维护两套散落颜色。

```tsx
<section className="border border-line bg-surface/70 text-main shadow-sm" />
```

通用状态使用 `success`、`warning`、`danger`、`info`；设备和地图分别使用 `device-*`、`map-*`：

```tsx
<span className="bg-success/10 text-success" />
<section className="bg-device-bg text-device-fg" />
```

Canvas 或 Leaflet 无法使用 Tailwind 类时，通过 `themeRgb("--brand-rgb", alpha)` 读取同一变量。不得在绘制代码中保存十六进制或数值 `rgb/rgba`。

提交前运行 `npm run audit:ui-tokens`。该检查对 `src/app/globals.css` 之外的十六进制、数值颜色函数和 Tailwind 固定色板零容忍。

## 7. i18n 契约

- 路由、组件类型和图标保持静态；展示文字使用翻译 key。
- 新增首页或全局 UI 文案时，必须同时更新 `zh.json` 与 `en.json`。
- 不在静态常量里调用 `t()`；在组件渲染阶段解析。
- ARIA label、空状态、错误反馈和按钮 title 同样需要双语。
- 英文缺键会回退中文，但回退只用于容错，不是交付标准。
- 隐私、合规和免责声明统一维护在 `/privacy`；内容页不得复制大段声明或使用警告色制造重复提示。
- 登录、后台外壳、控制台和共享后台组件必须通过 `npm run audit:i18n-shells`，禁止重新写入中文展示字面量。
- 后台服务端页面只查询数据；需要响应语言切换的展示层通过客户端组件插槽接收可序列化数据。

## 8. 移动端验收

每次新增 UI 至少验证 `390x844` 和常规桌面视口：

- 无水平溢出，长英文不遮挡相邻内容。
- 交互目标最小高度 44px。
- 抽屉和弹窗使用 `100dvh` 与 safe-area。
- Canvas 使用固定内部尺寸与响应式 CSS 尺寸，不因 hydration 改变布局。
- 页面首屏仍露出下一段内容或明确的向下入口。

## 9. 新组件准入

新增组件前按顺序判断：

1. 现有组件加 prop 能否表达？可以则不要新增。
2. 是否至少会被两个页面使用，或代表明确的全局交互契约？否则留在业务组件内。
3. 是否同时支持亮暗、中英、键盘、移动端和 reduced motion？不满足则不得加入 UI 层。
4. 加入后更新 `index.ts`、`catalog.ts` 和本文档。
