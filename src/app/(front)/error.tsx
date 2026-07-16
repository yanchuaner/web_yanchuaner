'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center route-state-brand px-4 text-main">
      <div className="max-w-xl rounded-3xl border border-brand/20 bg-surface/70 p-8 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand/60">SYSTEM ERROR</p>
        <h1 className="mt-3 text-3xl font-semibold text-brand font-heading">页面出错了</h1>
        <p className="mt-3 text-sm leading-6 text-main/70">抱歉，系统遇到了一个错误。请尝试刷新页面或返回首页。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary"
          >
            重试
          </button>
          <Link href="/" className="btn-secondary cursor-pointer">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
