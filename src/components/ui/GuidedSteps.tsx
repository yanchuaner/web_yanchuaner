import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export type GuidedStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function GuidedSteps({ items, className }: { items: GuidedStep[]; className?: string }) {
  return (
    <ol className={cn("grid border-y border-line md:grid-cols-3", className)}>
      {items.map(({ title, description, icon: Icon }, index) => (
        <li
          key={title}
          className="relative px-1 py-6 md:px-6 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-line"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-main/35">0{index + 1}</span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-btn bg-brand/10 text-brand">
              <Icon size={18} aria-hidden="true" />
            </span>
          </div>
          <h3 className="font-heading mt-4 text-base font-semibold text-main">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-main/60">{description}</p>
        </li>
      ))}
    </ol>
  );
}
