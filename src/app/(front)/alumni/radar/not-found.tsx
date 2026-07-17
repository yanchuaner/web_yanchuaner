import Link from 'next/link';

export default function RadarNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center route-state-info px-4 text-main/60">
      <div className="max-w-xl rounded-3xl border border-info/20 bg-surface/60 p-8 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs tracking-[0.2em] text-info">校友地图</p>
        <h1 className="mt-3 text-3xl font-semibold text-info">没有找到对应校友</h1>
        <p className="mt-3 text-sm leading-6 text-main/60">当前条件下没有匹配的校友信息。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-info px-5 py-2.5 text-sm font-medium text-main/60 transition hover:bg-info cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong">返回首页</Link>
          <Link href="/alumni/stories" className="rounded-full border border-info/30 px-5 py-2.5 text-sm text-info transition hover:bg-info/10 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong">浏览燕中故事</Link>
        </div>
      </div>
    </main>
  );
}
