import type { Metadata } from "next";
import Link from "next/link";
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
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";
import AchievementSubmission from "@/components/AchievementSubmission";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "校友成就墙",
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

const CATEGORY_COLORS = {
  ACADEMIC: "border-violet-200 bg-violet-50 text-violet-700",
  RESEARCH: "border-blue-200 bg-blue-50 text-blue-700",
  CAREER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ENTREPRENEURSHIP: "border-amber-200 bg-amber-50 text-amber-700",
  PUBLIC_SERVICE: "border-rose-200 bg-rose-50 text-rose-700",
  OTHER: "border-slate-200 bg-slate-50 text-slate-700",
} satisfies Record<AchievementCategory, string>;

export default async function AlumniAchievementsPage({
  searchParams,
}: {
  searchParams?: { category?: string; submit?: string };
}) {
  const requestedCategory = searchParams?.category || "";
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
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Sparkles size={14} />
              ALUMNI ACHIEVEMENTS
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">
              校友成就墙
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              记录燕中人在升学、科研、职业、创业与公益道路上的成长足迹，分享每一份值得被看见的努力。
            </p>
          </div>
          <Link href="/" className="btn-secondary">
            返回指挥中心
          </Link>
        </header>

        <nav
          className="mt-6 flex flex-wrap gap-2"
          aria-label="按成就类别筛选"
        >
          <Link
            href="/alumni/achievements"
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              !activeCategory
                ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#4C1D95]"
                : "border-gray-200 bg-white text-gray-600 hover:border-[#7C3AED]/40"
            }`}
          >
            全部
          </Link>
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/alumni/achievements?category=${category}`}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                activeCategory === category
                  ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#4C1D95]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#7C3AED]/40"
              }`}
            >
              {ACHIEVEMENT_CATEGORY_LABELS[category]}
            </Link>
          ))}
        </nav>

        {achievements.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
            <BookOpenCheck size={48} className="mb-3 opacity-40" />
            <p className="text-sm">暂无已发布的校友成就记录。</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const category = achievement.category as AchievementCategory;
              const Icon = CATEGORY_ICONS[category] || Award;
              const categoryLabel =
                ACHIEVEMENT_CATEGORY_LABELS[category] || "其他成就";
              const categoryColor =
                CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;

              return (
                <article
                  key={achievement.id}
                  className="group flex h-full flex-col rounded-2xl border border-[#7C3AED]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${categoryColor}`}
                    >
                      <Icon size={13} />
                      {categoryLabel}
                    </span>
                    {achievement.yearLabel ? (
                      <span className="text-xs font-medium text-[#7C3AED]/60">
                        {achievement.yearLabel}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="font-heading mt-4 text-xl font-semibold leading-7 text-[#4C1D95]">
                    {achievement.title}
                  </h2>
                  <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                    {achievement.description}
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="font-medium text-[#4C1D95]">
                      {achievement.alumniName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {[achievement.graduationClass, achievement.organization]
                        .filter(Boolean)
                        .join(" · ") || "燕中校友"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          本页面内容由管理员整理发布，仅用于展示校友成长经历，不构成任何官方认证或商业背书。
        </div>
      </div>
      <AchievementSubmission initialOpen={searchParams?.submit === "1"} />
    </section>
  );
}
