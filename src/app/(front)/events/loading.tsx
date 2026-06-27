import { CalendarDays } from "lucide-react";
import { GlassCard, PageHeader, PageShell, Skeleton, SkeletonText } from "@/components/ui";

export default function EventsLoading() {
  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="EVENTS"
          eyebrowIcon={CalendarDays}
          title="校友活动"
          description="返校聚会、线上讲座、校友交流活动的信息与报名"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2" aria-busy="true" aria-live="polite">
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} as="article" className="p-5">
              <Skeleton className="aspect-video w-full" />
              <Skeleton variant="text" className="mt-4 h-6 w-20" />
              <Skeleton variant="text" className="mt-4 h-6 w-4/5" />
              <SkeletonText lines={3} className="mt-4" />
              <div className="mt-5 flex justify-end">
                <Skeleton className="h-11 w-full rounded-btn sm:w-32" />
              </div>
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    </PageShell>
  );
}
