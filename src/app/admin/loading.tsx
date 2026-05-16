export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      {/* Radar pulse animation */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-400/20" />
        <div className="absolute inset-2 animate-ping rounded-full border-2 border-cyan-400/30" style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-4 animate-ping rounded-full border-2 border-cyan-400/40" style={{ animationDelay: '0.6s' }} />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-400/40">
          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
        </div>
      </div>
      <p className="mt-6 animate-pulse text-lg font-medium tracking-wider text-cyan-300/70">
        Establishing Command Link...
      </p>
      <p className="mt-2 text-sm text-slate-300">正在建立控制链路</p>
    </div>
  );
}
