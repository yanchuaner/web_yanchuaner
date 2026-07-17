import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "./cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  info: "border-brand/20 bg-brand/10 text-brand-fg",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

const ICONS: Record<Tone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

export function FormStatus({
  tone = "info",
  title,
  description,
  className,
}: {
  tone?: Tone;
  title: string;
  description?: string;
  className?: string;
}) {
  const Icon = ICONS[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border px-4 py-3 text-left text-sm leading-6",
        TONE_CLASS[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-0.5 opacity-75">{description}</p> : null}
      </div>
    </div>
  );
}
