export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  GalleryVerticalEnd,
  MapPin,
  MessageSquareText,
  Rocket,
  Users,
  Newspaper,
  CalendarDays,
  FileEdit,
  Lock,
} from "lucide-react";
import { InteractiveStarfield, RevealSection } from "@/components/ui";
import MessageOrbit from "@/components/MessageOrbit";
import CosmicBackground from "@/components/CosmicBackground";
import AlumniMapClient from "@/components/AlumniMapClient";
import { JoinTriggerButton } from "@/components/JoinTriggerButton";
import LatestUpdatesSection, {
  LatestUpdatesSkeleton,
} from "@/components/LatestUpdatesSection";
import CommunityTeamShowcase from "@/components/CommunityTeamShowcase";
import { getCachedOrFetch } from "@/lib/cache";
import prisma from "@/lib/db";
import { getPageUser } from "@/lib/admin-auth";

const HOME_ANNOUNCEMENT_TEXT =
  "欢迎来到燕中校友数字母港。这里由校友共同建设与维护，用于连接彼此、留存记忆和支持校友协作。";

async function computeDashboardStats() {
  try {
    return await getCachedOrFetch("home:dashboard:stats", 60, async () => {
      const rows = await prisma.whitelistRoster.findMany({
        select: { city: true },
      });

      const storyCount = await prisma.story.count({
        where: { status: "PUBLISHED" },
      });

      const alumniCount = rows.length;

      const unknownCitySet = new Set(["", "待完善", "待补充", "未知城市", "未知"]);
      const citySet = new Set<string>();
      for (const row of rows) {

        if (row.city && !unknownCitySet.has(row.city)) {
          citySet.add(row.city);
        }
      }

      return {
        alumniCount,
        cityCount: citySet.size,
        storyCount,
      };
    });
  } catch (error) {
    console.error("首页数据查询失败", error);
    return { alumniCount: 0, cityCount: 0, storyCount: 0 };
  }
}

export default async function HomePage() {
  const currentUser = await getPageUser();
  const canViewPrivate =
    !!currentUser &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "ALUMNI" && currentUser.status === "VERIFIED"));
  const dashboardStats = canViewPrivate
    ? await computeDashboardStats()
    : { alumniCount: 0, cityCount: 0, storyCount: 0 };

  return (
    <section
      id="top"
      className="relative min-h-screen overflow-hidden bg-surface-muted"
    >
      <CosmicBackground />
      <InteractiveStarfield />
      <MessageOrbit />
      <div
        className="home-atmo-layer opacity-40 mix-blend-multiply"
        aria-hidden="true"
      >
        <div className="home-breath-stars home-breath-stars-a bg-[#7C3AED]/20" />
        <div className="home-breath-stars home-breath-stars-b bg-[#A78BFA]/20" />
        <div className="home-breath-stars home-breath-stars-c bg-[#22C55E]/20" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 py-12 md:px-8 md:py-16 gap-16">
        {/* 1. Hero (community value prop) */}
        <header className="relative flex flex-col items-center justify-center text-center gap-6 mt-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/30 bg-white/80 px-4 py-2 text-sm text-[#7C3AED] shadow-sm backdrop-blur-sm">
            <Rocket size={18} className="animate-bounce" />
            <span className="font-medium">燕中校友数字母港</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#4C1D95] md:text-5xl lg:text-6xl drop-shadow-sm">
            连接燕中人的<br className="md:hidden" />温暖社区
          </h1>
          <p className="max-w-full md:max-w-2xl text-base text-slate-600 md:text-lg">
            在这里，我们跨越山海，重温青春记忆。寻找同窗挚友，探索校友足迹，共建属于我们的精神家园。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {!currentUser ? (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
                >
                  入轨联络舱
                </Link>
                <Link
                  href="/alumni/radar"
                  className="px-8 py-3.5 rounded-full border border-purple-500/50 text-purple-200 hover:bg-purple-500/10 transition-all hover:-translate-y-1 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
                >
                  浏览校友名录
                </Link>
              </>
            ) : (
              <Link
                href="/alumni/radar"
                className="px-8 py-3.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
              >
                浏览校友名录
              </Link>
            )}
          </div>
          {canViewPrivate ? <div className="mt-8 flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.alumniCount}+
              </p>
              <p className="text-sm font-medium text-slate-500">
                已入驻校友
              </p>
            </div>
            <div className="w-px h-12 bg-[#A78BFA]/30"></div>
            <div>
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.cityCount}
              </p>
              <p className="text-sm font-medium text-slate-500">点亮城市</p>
            </div>
            <div className="w-px h-12 bg-[#A78BFA]/30 hidden sm:block"></div>
            <div className="hidden sm:block">
              <p className="text-3xl font-bold text-[#4C1D95]">
                {dashboardStats.storyCount}
              </p>
              <p className="text-sm font-medium text-slate-500">校友故事</p>
            </div>
          </div> : null}
        </header>

        <RevealSection>
          <div className="h-12 overflow-hidden rounded-full border border-[#A78BFA]/30 bg-white/70 shadow-sm backdrop-blur-sm">
            <div className="announcement-marquee-track h-full">
              <span className="inline-flex h-full items-center px-6 text-sm font-medium text-[#4C1D95]">
                {HOME_ANNOUNCEMENT_TEXT}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex h-full items-center px-6 text-sm font-medium text-[#4C1D95]"
              >
                {HOME_ANNOUNCEMENT_TEXT}
              </span>
            </div>
          </div>
        </RevealSection>

        {/* 2. Popular topics/categories */}
        <section className="flex flex-col gap-6">
          <RevealSection>
            <h2 className="font-heading text-2xl font-bold text-[#4C1D95] flex items-center gap-3">
              <Users className="text-[#7C3AED]" size={28} />
              热门频道
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <RevealSection delay={0} className="h-full flex flex-col">
              <Link
                href="/news"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <Newspaper size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  最新公告
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  了解母校与校友会的最新动态
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.1} className="h-full flex flex-col">
              <Link
                href="/events"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <CalendarDays size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  校友活动
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  参与线上线下交流与聚会
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.2} className="h-full flex flex-col">
              <Link
                href="/alumni/stories"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <MessageSquareText size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  燕中故事
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  倾听校友们的奋斗与成长
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.3} className="h-full flex flex-col">
              <Link
                href="/alumni/memories"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <GalleryVerticalEnd size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  燕中记忆
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  重温校园时光的珍贵影像
                </p>
              </Link>
            </RevealSection>
            <RevealSection delay={0.4} className="h-full flex flex-col">
              <Link
                href="/alumni/correction"
                className="card h-full w-full glass-card-base group flex flex-col items-start rounded-2xl border border-[#A78BFA]/20 bg-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                  <FileEdit size={24} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-800">
                  信息修正
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  申请修正姓名、届别与班级
                </p>
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Latest Updates Section — streamed via Suspense */}
        {canViewPrivate ? (
          <RevealSection>
            <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-5 md:p-6 backdrop-blur-xl shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Newspaper size={28} className="text-[#7C3AED]" />
                <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">
                  最新动态
                </h2>
              </div>
              <Suspense fallback={<LatestUpdatesSkeleton />}>
                <LatestUpdatesSection />
              </Suspense>
            </section>
          </RevealSection>
        ) : null}

        {/* 3. Active members showcase — map loaded via Suspense */}
        <RevealSection direction="scale">
          <section className="glass-card-base rounded-3xl border border-[#A78BFA]/20 bg-white/50 p-5 md:p-6 backdrop-blur-xl shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin size={28} className="text-[#7C3AED]" />
                <h2 className="font-heading text-2xl font-bold text-[#4C1D95]">
                  校友分布与活跃成员
                </h2>
              </div>
              <Link
                href="/alumni/radar"
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3 text-sm font-medium text-[#7C3AED] transition-colors hover:bg-brand/5 hover:text-[#4C1D95] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]"
              >
                查看完整名录 &rarr;
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#A78BFA]/20 bg-white shadow-sm">
              {canViewPrivate ? (
                <AlumniMapClient />
              ) : (
                <div className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0f0a1d] p-6 text-center sm:min-h-[320px] sm:p-8">
                  {/* 模糊伪数据背景 */}
                  <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0f0a1d]/85 to-[#0f0a1d] blur-md scale-105 pointer-events-none"
                    aria-hidden="true"
                  />
                  {/* 半透明黑遮罩 */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" aria-hidden="true" />
                  {/* 居中内容层 */}
                  <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
                    <Lock className="text-purple-400/80 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" size={40} />
                    <p className="text-base font-semibold text-purple-200 drop-shadow-sm">
                      登录并通过校友认证后可查看校友分布。
                    </p>
                    <Link
                      href="/login?redirect=/alumni/radar"
                      className="mt-2 px-6 py-2.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 text-sm"
                    >
                      立即验证入轨
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </RevealSection>

        <RevealSection>
          <CommunityTeamShowcase />
        </RevealSection>

        {!currentUser ? (
          /* 4. Join CTA */
          <RevealSection direction="scale">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/20 via-[#0f0a1d]/80 to-indigo-900/20 backdrop-blur-xl border border-purple-500/20 px-6 py-12 text-center shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] hover:border-purple-400/50 md:px-12 md:py-16">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]"></div>
              <div className="relative z-10 mx-auto max-w-2xl text-white">
                <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
                  加入我们的校友网络
                </h2>
                <p className="mt-4 text-base text-purple-200/80">
                  结识优秀的校友，分享你的经历，获取更多资源与机会。无论你身在何处，这里都是你的精神家园。
                </p>
                <div className="mt-8 flex justify-center">
                  <JoinTriggerButton />
                </div>
              </div>
            </section>
          </RevealSection>
        ) : null}

        <RevealSection>
          <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm font-medium text-amber-200/90 shadow-[0_0_15px_rgba(245,158,11,0.05)] backdrop-blur-md">
            <span className="mt-0.5 text-base flex-shrink-0" aria-hidden="true">📢</span>
            <span>声明：本站由校友自主共建、燕中校友汇运营维护，非学校官方平台。全站无盈利、不收费，仅用于情感连接、记忆留存与校友社区服务。</span>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
