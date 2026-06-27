import { GlassCard, PageShell, Skeleton, SkeletonText } from "@/components/ui";

export default function Loading() {
  return (
    <PageShell className="min-h-[70vh]">
      <GlassCard className="p-6 md:p-8" as="section">
        <div className="space-y-8" aria-busy="true" aria-live="polite">
          <div className="space-y-4">
            <Skeleton variant="text" className="h-3 w-24" />
            <Skeleton variant="text" className="h-10 w-full max-w-xl" />
            <SkeletonText lines={2} className="max-w-2xl" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border border-line bg-surface/40 p-5"
              >
                <Skeleton variant="circle" className="h-10 w-10" />
                <Skeleton variant="text" className="mt-5 h-5 w-3/4" />
                <SkeletonText lines={3} className="mt-4" />
              </div>
            ))}
          </div>

          <div className="rounded-card border border-line bg-surface/30 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <Skeleton variant="text" className="h-5 w-48" />
                <Skeleton variant="text" className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-10 w-32 rounded-btn" />
            </div>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}
