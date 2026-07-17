import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function SectionIntro({
  eyebrow,
  icon: Icon,
  title,
  titleId,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  titleId?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-brand">
            {Icon ? <Icon size={15} aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h2 id={titleId} className="break-words font-heading mt-2 text-2xl font-bold text-main md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-main/65 md:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
