import { Suspense } from "react";
import HomeClientPage from "@/components/HomeClientPage";
import LatestUpdatesSection, { LatestUpdatesSkeleton } from "@/components/LatestUpdatesSection";
import { getPageUser } from "@/lib/admin-auth";
import prisma from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export const dynamic = "force-dynamic";

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
    <HomeClientPage
      isLoggedIn={Boolean(currentUser)}
      canViewPrivate={canViewPrivate}
      dashboardStats={dashboardStats}
      latestUpdates={
        canViewPrivate ? (
          <Suspense fallback={<LatestUpdatesSkeleton />}>
            <LatestUpdatesSection />
          </Suspense>
        ) : null
      }
    />
  );
}
