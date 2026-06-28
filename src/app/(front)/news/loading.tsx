import { Newspaper } from "lucide-react";
import { GlassCard, PageHeader, PageShell, Skeleton, SkeletonText } from "@/components/ui";

export default function NewsLoading() {
  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="NEWS"
          eyebrowIcon={Newspaper}
          title="新闻公告"
          description="学校动态、校友会公告与平台资讯"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2" aria-busy="true" aria-live="polite">
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} as="article" className="p-5">
              <Skeleton variant="text" className="h-6 w-28" />
              <Skeleton variant="text" className="mt-4 h-6 w-4/5" />
              <SkeletonText lines={2} className="mt-4" />
              <Skeleton variant="text" className="mt-5 h-5 w-24" />
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    </PageShell>
  );
}
