export type UIComponentCategory =
  | "foundation"
  | "layout"
  | "navigation"
  | "content"
  | "feedback"
  | "motion"
  | "experience";

export type UIComponentDefinition = {
  name: string;
  category: UIComponentCategory;
  purpose: string;
  client: boolean;
  motion: "none" | "entry" | "state" | "ambient";
};

export const UI_COMPONENT_CATALOG: readonly UIComponentDefinition[] = [
  { name: "cn", category: "foundation", purpose: "条件类名合并", client: false, motion: "none" },
  { name: "PageShell", category: "layout", purpose: "页面宽度与响应式留白", client: false, motion: "none" },
  { name: "GlassCard", category: "content", purpose: "主题感应的玻璃表面", client: true, motion: "state" },
  { name: "PageHeader", category: "content", purpose: "页面级标题与操作区", client: false, motion: "entry" },
  { name: "SectionHeader", category: "content", purpose: "紧凑区块标题", client: true, motion: "none" },
  { name: "SectionIntro", category: "content", purpose: "叙事区块导语", client: false, motion: "none" },
  { name: "GuidedSteps", category: "content", purpose: "流程与使用说明", client: false, motion: "none" },
  { name: "Button", category: "navigation", purpose: "命令按钮", client: false, motion: "state" },
  { name: "ButtonLink", category: "navigation", purpose: "导航型按钮", client: false, motion: "state" },
  { name: "Badge", category: "content", purpose: "状态与分类标签", client: false, motion: "none" },
  { name: "ResponsiveTabs", category: "navigation", purpose: "移动优先的视图切换", client: true, motion: "state" },
  { name: "EmptyState", category: "feedback", purpose: "空数据反馈", client: false, motion: "none" },
  { name: "ErrorState", category: "feedback", purpose: "错误反馈与重试", client: false, motion: "none" },
  { name: "FormStatus", category: "feedback", purpose: "表单提交反馈", client: false, motion: "none" },
  { name: "Skeleton", category: "feedback", purpose: "稳定尺寸的加载占位", client: false, motion: "state" },
  { name: "SkeletonText", category: "feedback", purpose: "文本加载占位", client: false, motion: "state" },
  { name: "RevealSection", category: "motion", purpose: "一次性滚入视口动画", client: true, motion: "entry" },
  { name: "InteractiveStarfield", category: "motion", purpose: "交互式环境星野", client: true, motion: "ambient" },
  { name: "BashTerminal", category: "experience", purpose: "字符输入与连接演示", client: true, motion: "state" },
  { name: "ChannelTV", category: "experience", purpose: "频道切换与静态噪声演示", client: true, motion: "state" },
];
