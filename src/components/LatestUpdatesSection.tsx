import Link from "next/link";
import prisma from "@/lib/db";
import { Newspaper, CalendarDays } from "lucide-react";
import { Skeleton, SkeletonText } from "@/components/ui";

type UpdateItem = {
  id: string;
  title: string;
  date: Date | string;
  type: "news" | "event";
};

async function getLatestUpdates(): Promise<UpdateItem[]> {
  const [news, events] = await Promise.all([
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, eventDate: true },
      orderBy: { eventDate: "desc" },
      take: 2,
    }),
  ]);

  const combined: UpdateItem[] = [
    ...news.map((n) => ({
      id: n.id,
      title: n.title,
      date: n.publishedAt ?? new Date(),
      type: "news" as const,
    })),
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.eventDate ?? new Date(),
      type: "event" as const,
    })),
  ];

  return combined
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

export const LatestUpdatesSkeleton = () => (
  <div className="divide-y divide-line border-y border-line">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="flex min-h-[72px] items-center gap-4 px-1 py-4 sm:px-4"
      >
        <Skeleton className="h-9 w-9 shrink-0 rounded-btn" />
        <SkeletonText lines={2} className="min-w-0 flex-1" />
      </div>
    ))}
  </div>
);

export default async function LatestUpdatesSection() {
  const items = await getLatestUpdates();

  if (items.length === 0) {
    return (
      <p className="py-4 text-sm text-main/55">
        <span className="lang-zh">暂无最新动态</span>
        <span className="lang-en">No recent updates</span>
      </p>
    );
  }

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const href =
          item.type === "news" ? `/news/${item.id}` : `/events/${item.id}`;
        return (
          <Link
            key={item.id}
            href={href}
            className="group flex min-h-[76px] items-center gap-4 px-1 py-4 transition-colors hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4"
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn ${
                item.type === "news"
                  ? "bg-brand/10 text-brand"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {item.type === "news" ? (
                <Newspaper size={18} />
              ) : (
                <CalendarDays size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-main transition-colors group-hover:text-brand">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-main/55">
                <span className="lang-zh">
                  {item.type === "news" ? "公告" : "活动"} · {new Date(item.date).toLocaleDateString("zh-CN")}
                </span>
                <span className="lang-en">
                  {item.type === "news" ? "News" : "Event"} · {new Date(item.date).toLocaleDateString("en-US")}
                </span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
