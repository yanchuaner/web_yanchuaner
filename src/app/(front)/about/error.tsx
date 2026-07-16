"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-card border border-danger/25 bg-danger/10 p-8 text-center backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-danger">
          加载异常
        </p>
        <p className="mt-3 text-sm leading-6 text-main/70">
          页面内容暂时无法加载，请稍后重试。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-btn border border-danger/25 bg-surface px-4 py-2 text-sm text-danger transition hover:bg-danger/10 cursor-pointer"
          >
            重试
          </button>
          <Link href="/" className="btn-secondary text-sm">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
