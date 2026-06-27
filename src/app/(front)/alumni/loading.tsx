import { GlassCard, PageShell, Skeleton, SkeletonText } from "@/components/ui";

export default function AlumniLoading() {
  return (
    <PageShell size="wide" className="min-h-[60vh]">
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <GlassCard className="p-5 md:p-6" as="section">
          <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Skeleton variant="text" className="h-8 w-64 max-w-full" />
              <Skeleton variant="text" className="h-4 w-40 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton variant="circle" className="h-10 w-10" />
              <Skeleton className="h-10 w-24 rounded-btn" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <GlassCard key={index} className="p-6" as="article">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circle" className="h-16 w-16" />
                  <div className="space-y-2">
                    <Skeleton variant="text" className="h-5 w-32" />
                    <Skeleton variant="text" className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton variant="text" className="h-6 w-16" />
              </div>

              <SkeletonText lines={3} className="mt-6" />

              <div className="mt-6 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-btn" />
                <Skeleton className="h-6 w-24 rounded-btn" />
                <Skeleton className="h-6 w-16 rounded-btn" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
