import Link from "next/link";
import { Send } from "lucide-react";

export function JoinTriggerButton() {
  return (
    <Link
      href="/register"
      aria-label="前往注册校友账号"
      className="group flex min-h-[168px] flex-col items-center justify-center rounded-card border border-purple-500/30 bg-[#0f0a1d]/60 px-5 py-6 text-center shadow-[0_0_20px_rgba(168,85,247,0.1)] backdrop-blur-lg transition-all duration-300 touch-manipulation hover:-translate-y-0.5 hover:scale-[1.02] hover:border-purple-400/60 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 group-hover:bg-purple-500/25 group-hover:text-purple-200 group-hover:shadow-[0_0_28px_rgba(168,85,247,0.3)]">
        <Send size={24} aria-hidden="true" />
      </span>
      <p className="font-heading mt-4 text-base font-semibold text-gray-100">
        入轨联络舱
      </p>
      <p className="mt-1 text-xs text-purple-300/80">
        注册校友账号，加入数字母港
      </p>
    </Link>
  );
}
