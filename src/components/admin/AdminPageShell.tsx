/**
 * 后台页面统一骨架：标题区（标题 / 描述 / 右侧操作）+ 内容区。
 * 面包屑由后台全局布局统一渲染，避免页面重复显示。
 * 让所有后台页保持一致的版式，新贡献者无需重复书写标题排版。
 */
export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  /** 右上角操作区（如「新建」按钮） */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 max-w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-brand-fg">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-brand-fg/60">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
