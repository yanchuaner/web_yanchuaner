import Link from 'next/link';

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center route-state-brand px-4 text-main">
      <div className="max-w-xl rounded-3xl border border-brand/20 bg-surface/70 p-8 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-brand/60">404 NOT FOUND</p>
        <h1 className="mt-3 text-3xl font-semibold text-brand font-heading">页面未找到</h1>
        <p className="mt-3 text-sm leading-6 text-main/70">您访问的页面不存在或已被移除。</p>
        <div className="mt-6">
          <Link href="/" className="btn-primary inline-block cursor-pointer">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
