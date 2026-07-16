import Link from 'next/link';

export default function AlumniNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center route-state-info px-4 text-main/60">
      <div className="max-w-xl rounded-3xl border border-info/20 bg-surface/60 p-8 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs tracking-[0.2em] text-info">页面未找到</p>
        <h1 className="mt-3 text-3xl font-semibold text-info">这里暂时没有内容</h1>
        <p className="mt-3 text-sm leading-6 text-main/60">你访问的校友空间页面不存在或已被移除。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-info px-5 py-2.5 text-sm font-medium text-main/60 transition hover:bg-info cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong">
            返回首页
          </Link>
          <Link href="/alumni/radar" className="rounded-full border border-info/30 px-5 py-2.5 text-sm text-info transition hover:bg-info/10 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong">
            前往校友地图
          </Link>
        </div>
      </div>
    </main>
  );
}
