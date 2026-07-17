import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, CalendarDays, Shield, ArrowLeft, BookOpen, Star, Heart, Users, School, GraduationCap } from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "联系我们",
  description: "燕中校友数字母港 — 联系方式、投稿说明与合作邀请",
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
    <PageShell size="narrow">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="CONTACT"
          eyebrowIcon={Mail}
          title={<LocalizedText translationKey="contentPages.contact.title" />}
          description={<LocalizedText translationKey="contentPages.contact.description" />}
        />

        <div className="mt-8 space-y-6">
          {sections.map((s) => {
            const Icon = ICON_MAP[s.icon] || Mail;
            return (
              <div key={s.id} className="rounded-card border border-line bg-surface/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Icon size={20} className="text-brand" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-brand-fg">{s.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-main/60">{s.description}</p>
                    {s.note && <p className="mt-1 text-sm leading-6 text-main/60">{s.note}</p>}
                    {s.href === '/alumni/stories' ? (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <Link href={s.href} className="text-sm text-brand underline hover:text-brand-fg transition-colors">
                          {s.actionLabel || <LocalizedText translationKey="contentPages.contact.detailAction" />}
                        </Link>
                        <Link href="/alumni/achievements" className="text-sm text-brand underline hover:text-brand-fg transition-colors">
                          <LocalizedText translationKey="contentPages.contact.achievementAction" />
                        </Link>
                      </div>
                    ) : s.href ? (
                      s.href.startsWith('mailto:') ? (
                        <a href={s.href} className="mt-1 inline-block text-sm text-brand underline hover:text-brand-fg transition-colors">
                          {s.actionLabel || <LocalizedText translationKey="contentPages.contact.detailAction" />}
                        </a>
                      ) : (
                        <Link href={s.href} className="mt-1 inline-block text-sm text-brand underline hover:text-brand-fg transition-colors">
                          {s.actionLabel || <LocalizedText translationKey="contentPages.contact.detailAction" />}
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <EmptyState
            icon={Mail}
            title={<LocalizedText translationKey="contentPages.contact.empty" />}
            className="mt-8"
          />
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary" icon={ArrowLeft}>
            <LocalizedText translationKey="common.backHome" />
          </ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
