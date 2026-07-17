import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Tone = "brand" | "neutral" | "success" | "warning" | "info" | "danger";

const TONES: Record<Tone, string> = {
  brand: "border-brand/20 bg-brand/10 text-brand",
  neutral: "border-line bg-surface text-main/70",
  success: "border-success/20 bg-success/10 text-success dark:text-success",
  warning: "border-warning/20 bg-warning/10 text-warning dark:text-warning",
  info: "border-info/20 bg-info/10 text-info dark:text-info",
  danger: "border-danger/20 bg-danger/10 text-danger dark:text-danger",
};

/**
 * 标签胶囊。替代各处手写的类别 / 状态小标签。
 */
export function Badge({
  children,
  tone = "brand",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono font-semibold tracking-wider uppercase",
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
