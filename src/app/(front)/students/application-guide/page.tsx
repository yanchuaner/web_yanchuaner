import type { Metadata } from "next";
import { ArrowLeft, BookOpen, AlertTriangle } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink } from "@/components/ui";
import { guideCards } from "@/data/studentResources";

export const metadata: Metadata = {
  title: "志愿填报参考",
  description: "燕中校友数字母港 — 高考志愿填报参考信息，帮助在校生和家长理解分数、位次、专业与院校选择的思考框架",
};

export default function ApplicationGuidePage() {
  return (
    <PageShell size="default">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="APPLICATION GUIDE"
          eyebrowIcon={BookOpen}
          title="志愿填报参考"
          description="帮助在校生和家长理解高考志愿填报的核心概念与思考框架。所有信息仅供参考，具体填报请以官方发布为准。"
        />

        {/* Risk Alert — 星空暗色 */}
        <div className="mt-6 rounded-card border border-danger/20 bg-danger/5 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10">
              <AlertTriangle size={18} className="text-danger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-danger">风险提示</h3>
              <p className="mt-1 text-xs leading-6 text-danger">
                不存在「保证录取」的内部渠道，所有正规录取都通过考试院系统。不要轻信「低分上名校」等虚假宣传，谨防志愿填报诈骗。提交前反复核对院校代码和专业代码，保留所有填报截图和确认信息。
              </p>
            </div>
          </div>
        </div>

        {/* Guide Cards — 星空暗色 */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guideCards.map((card) => (
            <div key={card.title} className="rounded-card border border-brand/10 bg-surface/50 p-5">
              <h3 className="font-heading text-base font-semibold text-brand-fg">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-brand-fg/70">{card.summary}</p>
              <ul className="mt-3 space-y-2">
                {card.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-5 text-brand-fg/60">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/40" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/students" variant="secondary" icon={ArrowLeft}>返回资源站</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">联系我们</ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
