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
  tone = "default",
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  titleId?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "default" | "narrative";
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className={cn(
            "inline-flex items-center gap-2 text-xs font-semibold uppercase",
            tone === "narrative" ? "text-narrative-route" : "text-brand",
          )}>
            {Icon ? <Icon size={15} aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className={cn(
            "mt-2 break-words text-2xl md:text-3xl",
            tone === "narrative"
              ? "font-heritage font-semibold leading-tight text-narrative-fg"
              : "font-heading font-bold text-main",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn(
            "mt-3 text-sm leading-7 md:text-base",
            tone === "narrative" ? "text-narrative-muted" : "text-main/65",
          )}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
