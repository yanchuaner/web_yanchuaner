import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, CalendarDays, Shield, ArrowLeft, BookOpen, Star, Heart, Users, School, GraduationCap } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "联系我们",
  description: "燕中校友数字母港 — 联系方式、投稿说明、合作邀请与免责声明",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, Star, Heart, MessageSquare, Mail, Shield, Users, School, CalendarDays, GraduationCap,
};

export default async function ContactPage() {
  const sections = await prisma.contentSection.findMany({
    where: { page: 'contact' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
          <Mail size={14} /> CONTACT
        </p>
        <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">联系我们</h1>
        <p className="mt-2 text-sm leading-7 text-gray-700 md:text-base">
          这里是燕中校友数字母港的联系窗口。我们欢迎每一位校友的参与与支持。
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((s) => {
            const Icon = ICON_MAP[s.icon] || Mail;
            return (
              <div key={s.id} className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                    <Icon size={20} className="text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-[#4C1D95]">{s.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{s.description}</p>
                    {s.note && <p className="mt-1 text-sm leading-6 text-gray-600">{s.note}</p>}
                    {s.href === '/alumni/stories' ? (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <Link href={s.href} className="text-sm text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                          {s.actionLabel || '查看详情'}
                        </Link>
                        <Link href="/alumni/achievements?submit=1" className="text-sm text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                          前往校友成就投稿
                        </Link>
                      </div>
                    ) : s.href ? (
                      <Link href={s.href} className="mt-1 inline-block text-sm text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                        {s.actionLabel || '查看详情'}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-400">
            <Mail size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">联系信息正在整理中，敬请期待。</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
