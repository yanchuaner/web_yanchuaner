import { cn } from "./cn";

type SkeletonVariant = "block" | "text" | "circle";

const VARIANTS: Record<SkeletonVariant, string> = {
  block: "rounded-card",
  text: "h-4 rounded-full",
  circle: "rounded-full",
};

export function Skeleton({
  className,
  variant = "block",
}: {
  className?: string;
  variant?: SkeletonVariant;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-brand/10", VARIANTS[variant], className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
