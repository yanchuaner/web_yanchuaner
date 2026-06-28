"use client";

import { useEffect } from "react";
import { ErrorState, GlassCard, PageShell } from "@/components/ui";

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("News page error:", error);
  }, [error]);

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <ErrorState
          title="公告暂时无法加载"
          description="新闻公告列表遇到了一点问题，请稍后重试。"
          onRetry={reset}
        />
      </GlassCard>
    </PageShell>
  );
}
