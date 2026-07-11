import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import { InteractiveStarfield } from "@/components/ui";

export const metadata: Metadata = {
  title: "燕中星港",
  description: "燕中校友数字母港航天主题彩蛋页面",
  robots: { index: false, follow: false },
};

export default function StarfieldPage() {
  return (
    <main id="main" className="relative flex min-h-[100dvh] overflow-hidden bg-surface-muted text-brand-fg">
      <InteractiveStarfield />
      <Link
        href="/"
        className="absolute left-5 top-5 z-10 inline-flex min-h-11 items-center gap-2 rounded-btn border border-line bg-surface/70 px-4 text-sm text-brand backdrop-blur-md"
      >
        <ArrowLeft size={16} />
        返回指挥中心
      </Link>
      <div className="relative z-10 m-auto flex flex-col items-center px-6 text-center">
        <Rocket size={52} className="text-brand" aria-hidden="true" />
        <h1 className="mt-5 font-heading text-3xl font-bold">燕中星港</h1>
        <p className="mt-3 text-sm text-brand-fg/60">航天主题彩蛋预留区域</p>
      </div>
    </main>
  );
}
