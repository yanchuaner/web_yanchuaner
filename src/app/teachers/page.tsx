import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MessageSquare, BookOpen, Star, Heart, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "教师频道",
  description: "燕川中学教师频道 — 教师名录、教研动态、校友联络与服务",
};

const sections = [
  {
    icon: BookOpen,
    title: "教师名录",
    desc: "燕川中学在职及退休教师基本信息（学科、教学特色等），帮助校友了解恩师近况。教师名录由学校或校友志愿者持续补充更新。",
    note: "教师信息收集整理中，欢迎校友提供资料",
  },
  {
    icon: Star,
    title: "名师风采",
    desc: "展示燕川中学优秀教师的先进事迹与教学成就，弘扬尊师重教的校园文化传统。",
    note: "风采内容征集中，欢迎投稿推荐",
  },
  {
    icon: Heart,
    title: "科研与教学成果",
    desc: "学校教学科研成果、公开课活动、课题研究进展等动态信息，让校友了解母校教学质量的不断提升。",
    note: "相关信息收集整理中",
  },
  {
    icon: MessageSquare,
    title: "校友联络",
    desc: "为校友提供一个安全的渠道向恩师表达问候。通过平台留言或邮件，传递对老师的感谢与祝福。",
    href: "/alumni/stories",
    action: "通过燕中故事投稿表达",
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

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map(({ icon: Icon, title, desc, note, href, action }) => (
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
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex items-center rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/20 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus:outline-none"
                  >
                    {action}
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                    {note}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

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
