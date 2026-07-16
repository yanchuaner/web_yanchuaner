import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, BookOpen, Star, Heart, MessageSquare, Mail, Users, CalendarDays } from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";

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
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="TEACHERS"
          eyebrowIcon={GraduationCap}
          title={<LocalizedText translationKey="contentPages.teachers.title" />}
          description={<LocalizedText translationKey="contentPages.teachers.description" />}
          className="mb-8"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => {
            const Icon = ICON_MAP[s.icon] || BookOpen;
            return (
              <article
                key={s.id}
                className="card group p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                  <Icon size={20} className="text-brand" />
                </div>
                <h3 className="font-heading mt-4 text-base font-semibold text-brand-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-main/60">{s.description}</p>
                <div className="mt-4">
                  {s.href ? (
                    <Link
                      href={s.href}
                      className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand transition hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand focus:outline-none"
                    >
                      {s.actionLabel || <LocalizedText translationKey="contentPages.teachers.detailAction" />}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-line bg-surface/60 px-3 py-1 text-xs text-main/60">
                      {s.note || <LocalizedText translationKey="contentPages.teachers.comingSoon" />}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {sections.length === 0 && (
          <EmptyState icon={GraduationCap} title={<LocalizedText translationKey="contentPages.teachers.empty" />} />
        )}

        <div className="mt-8 rounded-card border border-line bg-surface-muted p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Mail size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-brand-fg"><LocalizedText translationKey="contentPages.teachers.contributeTitle" /></h3>
              <p className="mt-1 text-sm leading-6 text-main/60">
                <LocalizedText translationKey="contentPages.teachers.contributePrefix" />{" "}
                <Link href="/contact" className="mx-1 text-brand underline hover:text-brand-fg transition-colors">
                  <LocalizedText translationKey="contentPages.teachers.contactLink" />
                </Link>
                {" "}<LocalizedText translationKey="contentPages.teachers.contributeSuffix" />
              </p>
              <p className="mt-1 text-xs text-main/60">
                <LocalizedText translationKey="contentPages.teachers.privacyNote" />
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary"><LocalizedText translationKey="common.backHome" /></ButtonLink>
          <ButtonLink href="/contact" variant="ghost"><LocalizedText translationKey="contentPages.teachers.contactLink" /></ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
