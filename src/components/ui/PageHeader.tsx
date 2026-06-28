import type { LucideIcon } from "lucide-react";
import { RevealSection } from "./RevealSection";

/**
 * 页面页头：胶囊标签（eyebrow）+ 主标题 + 描述。
 * 替代 15 个内容页逐字复制的「胶囊标签 + H1 + 描述」结构。
 * 内置滚动入场动画（上滑淡入）。
 *
 * @example
 * <PageHeader eyebrow="CONTACT" eyebrowIcon={Mail} title="联系我们" description="..." />
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  action,
  className,
}: {
  /** 胶囊里的英文小标签，如 "CONTACT" */
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  /** 右侧操作区（如「返回首页」按钮） */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <RevealSection className={className}>
      <header
        className="flex flex-col items-start justify-between gap-4 sm:flex-row"
      >
        <div className="w-full min-w-0 sm:flex-1">
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
              {EyebrowIcon ? <EyebrowIcon size={14} aria-hidden="true" /> : null}
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full justify-stretch sm:w-auto sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {action}
          </div>
        ) : null}
      </header>
    </RevealSection>
  );
}
