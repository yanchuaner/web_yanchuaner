import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, CalendarDays, Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "联系我们",
  description: "燕中校友数字母港 — 联系方式、投稿说明、合作邀请与免责声明",
};

export default function ContactPage() {
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
          <div className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                <Mail size={20} className="text-[#7C3AED]" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-[#4C1D95]">联系邮箱</h2>
                <p className="mt-1 text-sm text-gray-600">
                  网站相关事宜、技术反馈、内容建议：
                </p>
                <a
                  href="mailto:yanchuan_alumni@163.com"
                  className="mt-1 inline-block text-sm text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors"
                >
                  yanchuan_alumni@163.com
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                <MessageSquare size={20} className="text-[#7C3AED]" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-[#4C1D95]">投稿说明</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  欢迎校友分享燕中故事、校园记忆、成长经历或给学弟学妹的建议。
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  投稿请通过{" "}
                  <Link href="/alumni/stories" className="text-[#7C3AED] underline hover:text-[#4C1D95] transition-colors">
                    燕中故事
                  </Link>{" "}
                  页面提交，或发送邮件至联系邮箱。所有内容经审核后发布。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                <CalendarDays size={20} className="text-[#7C3AED]" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-[#4C1D95]">活动合作</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  如果您有意发起或组织校友活动（校友聚会、返校日、线上分享等），请联系我们：
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  <li>通过联系邮箱说明活动构思与计划</li>
                  <li>提供活动时间、地点、规模等基本信息</li>
                  <li>我们将在审核后在平台发布活动信息</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Shield size={20} className="text-amber-700" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-amber-800">免责声明</h2>
                <p className="mt-1 text-sm leading-6 text-amber-700">
                  燕中校友数字母港是由校友个人发起和维护的公益项目，非深圳市燕川中学官方平台。
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                  <li>本平台不以任何形式盈利，所有服务免费向校友开放</li>
                  <li>平台上的校友信息由用户自行提交，未经逐一核实</li>
                  <li>平台内容仅供参考，不构成任何官方声明或承诺</li>
                  <li>如发现信息有误或涉及侵权，请通过联系邮箱告知</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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
