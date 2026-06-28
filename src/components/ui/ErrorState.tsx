import { AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "./Button";
import { cn } from "./cn";

export function ErrorState({
  title = "加载失败",
  description = "内容暂时无法加载，请稍后重试。",
  retryLabel = "重试",
  onRetry,
  homeHref = "/",
  homeLabel = "返回首页",
  className,
}: {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/20 px-5 py-14 text-center text-brand-fg/70",
        className,
      )}
      role="alert"
    >
      <AlertCircle size={44} className="text-brand/60" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-lg font-semibold text-brand-fg">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-brand-fg/60">
        {description}
      </p>
      <div className="mt-5 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        {onRetry ? (
          <Button type="button" variant="primary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        <ButtonLink href={homeHref} variant="secondary">
          {homeLabel}
        </ButtonLink>
      </div>
    </div>
  );
}
