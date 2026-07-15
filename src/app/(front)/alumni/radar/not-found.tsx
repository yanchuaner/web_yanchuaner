import Link from 'next/link';

export default function RadarNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_40%),linear-gradient(to_bottom,#020617,#0f172a)] px-4 text-slate-100">
      <div className="max-w-xl rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl">
        <p className="text-xs tracking-[0.2em] text-cyan-200/70">校友地图</p>
        <h1 className="mt-3 text-3xl font-semibold text-cyan-100">没有找到对应校友</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">当前条件下没有匹配的校友信息。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]">返回首页</Link>
          <Link href="/alumni/stories" className="rounded-full border border-cyan-300/30 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]">浏览燕中故事</Link>
        </div>
      </div>
    </main>
  );
}
