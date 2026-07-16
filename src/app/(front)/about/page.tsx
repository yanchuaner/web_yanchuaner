import type { Metadata } from "next";
import {
  Globe2, GraduationCap, MapPin, Rocket, Users, Building2, History,
  BookOpen, Star, Heart, MessageSquare, Mail, Shield, School
} from "lucide-react";
import prisma from "@/lib/db";
import { PageShell, GlassCard, ButtonLink } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "学校介绍 - 深圳市燕川中学",
  description: "了解深圳市新安中学（集团）燕川中学的办学历史、航天科技特色与校园文化。",
};

const ICON_MAP: Record<string, any> = {
  BookOpen, Star, Heart, MessageSquare, GraduationCap, Mail, Shield, Users, School, Building2, Globe2, MapPin, Rocket, History,
};

export default async function AboutPage() {
  const features = await prisma.contentSection.findMany({
    where: { page: 'about_features' },
    orderBy: { sortOrder: 'asc' },
  });

  const timelineEvents = await prisma.contentSection.findMany({
    where: { page: 'about_timeline' },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <PageShell>
      <GlassCard className="p-8 text-center flex flex-col items-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs text-brand">
          <History size={14} />
          <LocalizedText translationKey="about.memberSchool" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-brand-fg md:text-5xl"><LocalizedText translationKey="about.schoolName" /></h1>
        <p className="mt-4 text-lg text-brand md:text-xl font-medium"><LocalizedText translationKey="about.tagline" /></p>
        <p className="mt-6 max-w-3xl mx-auto text-sm leading-7 text-main/60 md:text-base">
          <LocalizedText translationKey="about.description" />
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <ButtonLink href="/alumni/radar" variant="primary"><LocalizedText translationKey="about.directoryAction" /></ButtonLink>
          <ButtonLink href="/" variant="secondary"><LocalizedText translationKey="common.backHome" /></ButtonLink>
        </div>
      </GlassCard>

      {features.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = ICON_MAP[f.icon] || BookOpen;
            return (
              <GlassCard key={f.id} as="article" className="p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon size={22} className="text-brand" />
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-brand-fg">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-main/60">{f.description}</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {timelineEvents.length > 0 && (
        <GlassCard className="mt-8 p-6 md:p-8">
          <h2 className="font-heading text-2xl font-bold text-brand-fg"><LocalizedText translationKey="about.timelineTitle" /></h2>
          <div className="mt-8 space-y-0">
            {timelineEvents.map((t, idx) => (
              <div key={t.id} className="relative flex gap-6 pb-6">
                {idx < timelineEvents.length - 1 && (
                  <div className="absolute left-[19px] top-10 h-full w-0.5 bg-brand/10" />
                )}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/5 shadow-sm">
                  <span className="text-xs font-bold text-brand">{(t.yearLabel || '').slice(2)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-bold text-brand/70 tracking-wider">{t.yearLabel || ''}</span>
                  <p className="mt-1 text-sm text-main/60 leading-relaxed">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </PageShell>
  );
}
