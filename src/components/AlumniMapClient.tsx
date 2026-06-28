"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

const AlumniMap = dynamic(() => import("@/components/AlumniMap"), {
  ssr: false,
  loading: () => (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/30 shadow-sm">
      <Skeleton className="h-80 w-full rounded-none" />
      <div className="flex min-h-[44px] items-center gap-2 border-t border-line bg-surface/40 px-4 py-3">
        <Skeleton variant="circle" className="h-4 w-4 shrink-0" />
        <Skeleton variant="text" className="h-3 w-full max-w-56" />
      </div>
    </div>
  ),
});

export default function AlumniMapClient() {
  return <AlumniMap />;
}
