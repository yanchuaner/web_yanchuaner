import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, School, Building2, HelpCircle, GraduationCap, Sparkles,
  ChevronRight, Mail, Star, Heart, MessageSquare, Users, Globe2, MapPin, Rocket
} from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "在校生资源站 | Student Resource Hub",
  description: "燕中校友数字母港 — 面向在校生和家长的升学参考、大学观察、学习方法、学长问答与校友寄语汇总",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, School, Building2, HelpCircle, GraduationCap, Sparkles, Star, Heart, MessageSquare, Users, Globe2, MapPin, Rocket, Mail,
};

export default async function StudentsPage() {
  const cards = await prisma.contentSection.findMany({
    where: { page: 'students' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="STUDENTS"
          eyebrowIcon={BookOpen}
          title={<LocalizedText translationKey="contentPages.students.title" />}
          description={<LocalizedText translationKey="contentPages.students.description" />}
          className="mb-8"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = ICON_MAP[c.icon] || BookOpen;
            const href = c.href || '#';

            return (
              <Link
                key={c.id}
                href={href}
                className="group relative overflow-hidden rounded-card border border-brand/15 bg-gradient-to-br from-brand/10 to-brand/5 p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
                  <Icon size={22} className="text-brand" />
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-brand-fg">{c.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-fg/70">{c.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand transition group-hover:gap-1.5">
                  <LocalizedText translationKey="contentPages.students.enter" /> <ChevronRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>

        {cards.length === 0 && (
          <EmptyState icon={BookOpen} title={<LocalizedText translationKey="contentPages.students.empty" />} />
        )}

        <div className="mt-10 rounded-card border border-brand/10 bg-surface/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Mail size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-brand-fg"><LocalizedText translationKey="contentPages.students.contributeTitle" /></h3>
              <p className="mt-1.5 text-sm leading-6 text-brand-fg/70">
                <LocalizedText translationKey="contentPages.students.contributePrefix" />{" "}
                <Link href="/alumni/stories" className="text-brand underline hover:text-brand-soft transition-colors">
                  <LocalizedText translationKey="contentPages.students.storiesLink" />
                </Link>{" "}
                <LocalizedText translationKey="contentPages.students.contributeMiddle" />{" "}
                <Link href="/contact" className="text-brand underline hover:text-brand-soft transition-colors">
                  <LocalizedText translationKey="contentPages.students.contactLink" />
                </Link>{" "}
                <LocalizedText translationKey="contentPages.students.contributeSuffix" />
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary"><LocalizedText translationKey="common.backHome" /></ButtonLink>
          <ButtonLink href="/contact" variant="ghost"><LocalizedText translationKey="contentPages.students.contactLink" /></ButtonLink>
        </div>
      </GlassCard>
    </PageShell>
  );
}
