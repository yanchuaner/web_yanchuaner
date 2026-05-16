import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MessageSquare, Users, BookOpen, Star, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "教师频道",
  description: "燕川中学教师频道 — 教师名录、教研动态、校友联络与服务",
};

const sections = [
  {
    icon: Users,
    title: "教师名录",
    desc: "收录燕川中学在职教师基本信息（姓名、学科、教学特色），方便校友了解恩师近况。教师名录由学校或校友志愿者维护更新。",
    cta: "功能开发中",
    soon: true,
  },
  {
    icon: BookOpen,
    title: "教研动态",
    desc: "展示学校教学科研成果、公开课活动、课题研究进展，让校友了解母校教学质量的持续提升。",
    cta: "功能开发中",
    soon: true,
  },
  {
    icon: MessageSquare,
    title: "校友联络",
    desc: "为校友提供一个安全的渠道向恩师表达问候。通过平台留言或邮件，传递对老师的感谢与祝福。",
    cta: "通过燕川故事投稿表达",
    soon: false,
    href: "/alumni/stories",
  },
  {
    icon: Star,
    title: "名师风采",
    desc: "展示燕川中学优秀教师的先进事迹与教学成就，弘扬尊师重教的校园文化传统。",
    cta: "功能开发中",
    soon: true,
  },
  {
    icon: Heart,
    title: "感恩墙",
    desc: "校友们可以在这里写下对老师的感谢与回忆。每一条留言都是对教育工作者最好的激励。",
    cta: "功能开发中",
    soon: true,
  },
];

export default function TeachersPage() {
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, desc, cta, soon, href }) => (
            <article
              key={title}
              className="card group p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                <Icon size={20} className="text-[#7C3AED]" />
              </div>
              <h3 className="font-heading mt-4 text-base font-semibold text-[#4C1D95]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">{desc}</p>
              <div className="mt-4">
                {soon ? (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    {cta}
                  </span>
                ) : (
                  <Link href={href || "#"}
                    className="inline-flex items-center rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/20 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus:outline-none"
                  >
                    {cta}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center">
          <p className="text-sm leading-7 text-amber-800">
            教师频道正在逐步完善中。欢迎各科老师通过校友群联系我们，提供信息或建议。
          </p>
        </div>

        <Link href="/" className="mt-6 btn-secondary">
          返回首页
        </Link>
      </div>
    </section>
  );
}
