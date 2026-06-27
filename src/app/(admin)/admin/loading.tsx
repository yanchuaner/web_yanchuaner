import { Skeleton, SkeletonText } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="rounded-card border border-line bg-surface/50 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton variant="text" className="h-8 w-56 max-w-full" />
            <Skeleton variant="text" className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-btn" />
            <Skeleton className="h-10 w-28 rounded-btn" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-card border border-line bg-surface/40 p-5">
            <Skeleton variant="circle" className="h-11 w-11" />
            <Skeleton variant="text" className="mt-5 h-6 w-24" />
            <Skeleton variant="text" className="mt-3 h-8 w-32" />
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line bg-surface/40 p-5">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border-b border-line pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
            >
              <div className="w-full max-w-lg">
                <Skeleton variant="text" className="h-5 w-40" />
                <SkeletonText lines={2} className="mt-3" />
              </div>
              <Skeleton className="h-9 w-24 rounded-btn" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
