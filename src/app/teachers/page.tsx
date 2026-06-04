import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, BookOpen, Star, Heart, MessageSquare, Mail, Users, CalendarDays } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "教师频道",
  description: "燕川中学教师频道 — 教师名录、教研动态、校友联络与服务",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, Star, Heart, MessageSquare, GraduationCap, Users, Mail, CalendarDays,
};

export default async function TeachersPage() {
  const sections = await prisma.contentSection.findMany({
    where: { page: 'teachers' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <header className="mb-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
            <GraduationCap size={14} /> TEACHERS
          </p>
          <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">教师频道</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
            致燕川中学的每一位教师 — 这里是与校友保持联结、分享教育成果、感受桃李芬芳的数字窗口。
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => {
            const Icon = ICON_MAP[s.icon] || BookOpen;
            return (
              <article
                key={s.id}
                className="card group p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                  <Icon size={20} className="text-[#7C3AED]" />
                </div>
                <h3 className="font-heading mt-4 text-base font-semibold text-[#4C1D95]">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{s.description}</p>
                <div className="mt-4">
                  {s.href ? (
                    <Link
                      href={s.href}
                      className="inline-flex items-center rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/20 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus:outline-none"
                    >
                      {s.actionLabel || '查看详情'}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                      {s.note || '敬请期待'}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-400">
            <GraduationCap size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">教师频道内容正在搭建中，敬请期待。</p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF] p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <Mail size={20} className="text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-[#4C1D95]">补充教师资料</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                如果您是燕川中学在职或退休教师，或了解某位教师的信息，欢迎通过
                <Link href="/contact" className="mx-1 text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                  联系我们
                </Link>
                页面提供资料。所有信息经确认后发布。
              </p>
              <p className="mt-1 text-xs text-gray-500">
                为保护个人隐私，本平台不公开未经确认的教师手机号、邮箱等敏感联系方式。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary inline-flex items-center gap-2 text-sm">
            返回首页
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
          >
            联系我们
          </Link>
        </div>
      </div>
    </section>
  );
}
