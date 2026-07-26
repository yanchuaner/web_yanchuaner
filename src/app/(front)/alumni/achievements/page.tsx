import type { Metadata } from "next";
import {
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  FlaskConical,
  GraduationCap,
  HandHeart,
  Sparkles,
} from "lucide-react";
import prisma from "@/lib/db";
import {
  ACHIEVEMENT_CATEGORIES,
  type AchievementCategory,
} from "@/lib/achievements";
import { formatGraduationClass } from "@/lib/identity-fields";

import {
  PageShell,
  GlassCard,
  PageHeader,
  ButtonLink,
  Badge,
  EmptyState,
} from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "校友成就墙 | Alumni Achievements",
  description: "记录燕川中学校友在升学、科研、职业、创业与公益领域的成长足迹",
};

const CATEGORY_ICONS = {
  ACADEMIC: GraduationCap,
  RESEARCH: FlaskConical,
  CAREER: BriefcaseBusiness,
  ENTREPRENEURSHIP: Building2,
  PUBLIC_SERVICE: HandHeart,
  OTHER: Award,
} satisfies Record<AchievementCategory, typeof Award>;

const CATEGORY_TONES = {
  ACADEMIC: "brand",
  RESEARCH: "info",
  CAREER: "success",
  ENTREPRENEURSHIP: "warning",
  PUBLIC_SERVICE: "danger",
  OTHER: "neutral",
} as const satisfies Record<AchievementCategory, string>;

export default async function AlumniAchievementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedCategory = resolvedSearchParams?.category || "";
  const activeCategory = ACHIEVEMENT_CATEGORIES.includes(
    requestedCategory as AchievementCategory,
  )
    ? (requestedCategory as AchievementCategory)
    : null;

  const achievements = await prisma.achievement.findMany({
    where: {
      status: "PUBLISHED",
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <PageShell>
      <GlassCard className="p-5 md:p-8">
        <PageHeader
          eyebrow="ALUMNI ACHIEVEMENTS"
          eyebrowIcon={Sparkles}
          title={<LocalizedText translationKey="contentPages.achievements.title" />}
          description={<LocalizedText translationKey="contentPages.achievements.description" />}
          action={
            <ButtonLink href="/" variant="secondary">
              <LocalizedText translationKey="contentPages.achievements.back" />
            </ButtonLink>
          }
        />

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Achievement category filters">
          <CategoryChip href="/alumni/achievements" active={!activeCategory}>
            <LocalizedText translationKey="contentPages.achievements.all" />
          </CategoryChip>
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              href={`/alumni/achievements?category=${category}`}
              active={activeCategory === category}
            >
              <LocalizedText translationKey={`contentPages.achievements.categories.${category}`} />
            </CategoryChip>
          ))}
        </nav>

        {achievements.length === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title={<LocalizedText translationKey="contentPages.achievements.empty" />}
            className="mt-8"
          />
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const category = achievement.category as AchievementCategory;
              const Icon = CATEGORY_ICONS[category] || Award;
              const tone = CATEGORY_TONES[category] || "neutral";

              return (
                <article
                  key={achievement.id}
                  className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={tone} icon={Icon}>
                      <LocalizedText translationKey={`contentPages.achievements.categories.${category}`} />
                    </Badge>
                    {achievement.yearLabel ? (
                      <span className="text-xs font-medium text-brand/60">
                        {achievement.yearLabel}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="font-heading mt-4 text-xl font-semibold leading-7 text-brand-fg">
                    {achievement.title}
                  </h2>
                  <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-7 text-main/60">
                    {achievement.description}
                  </p>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="font-medium text-brand-fg">
                      {achievement.alumniName}
                    </p>
                    <p className="mt-1 text-xs text-main/60">
                      {[formatGraduationClass(achievement.graduationClass), achievement.organization]
                        .filter(Boolean)
                        .join(" · ") || <LocalizedText translationKey="contentPages.achievements.alumniFallback" />}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </GlassCard>

    </PageShell>
  );
}

/** 类别筛选胶囊（与 Badge 视觉区分：可点击的导航过滤器） */
function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  // 用原生 a 以保持原有的整页过滤行为（searchParams 驱动）
  return (
    <a
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-brand bg-brand/10 text-brand-fg"
          : "border-line bg-surface text-main/60 hover:border-brand/40",
      )}
    >
      {children}
    </a>
  );
}
