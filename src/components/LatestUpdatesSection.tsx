import Link from "next/link";
import prisma from "@/lib/db";
import { Newspaper, CalendarDays } from "lucide-react";

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
  <div className="grid gap-4 sm:grid-cols-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-xl border border-[#A78BFA]/20 bg-white/60 h-16"
      />
    ))}
  </div>
);

export default async function LatestUpdatesSection() {
  const items = await getLatestUpdates();

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        暂无最新动态
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const href =
          item.type === "news" ? `/news/${item.id}` : `/events/${item.id}`;
        return (
          <Link
            key={item.id}
            href={href}
            className="flex items-center gap-4 rounded-xl border border-[#A78BFA]/20 bg-white/70 px-5 py-4 transition hover:border-[#7C3AED]/40 hover:bg-white cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF] shadow-sm hover:shadow-md"
          >
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                item.type === "news"
                  ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                  : "bg-[#22C55E]/10 text-[#22C55E]"
              }`}
            >
              {item.type === "news" ? (
                <Newspaper size={18} />
              ) : (
                <CalendarDays size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.type === "news" ? "公告" : "活动"} ·{" "}
                {new Date(item.date).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
