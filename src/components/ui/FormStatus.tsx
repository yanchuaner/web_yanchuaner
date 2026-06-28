import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "./cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  info: "border-brand/20 bg-brand/10 text-brand-fg",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-300",
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
