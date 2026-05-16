export const revalidate = 60;

import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import prisma from "@/lib/db";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { eventDate: "asc" },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <CalendarDays size={14} /> EVENTS
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">校友活动</h1>
            <p className="mt-2 text-sm leading-7 text-gray-700 md:text-base">
              返校聚会、线上讲座、校友交流活动的信息与报名
            </p>
          </div>
          <Link href="/" className="btn-secondary">
            返回首页
          </Link>
        </header>

        <div className="mt-8">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
              暂无活动
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => {
                const isPast = new Date(event.eventDate) < new Date();
                const registrationCount = event._count.registrations;

                return (
                  <article
                    key={event.id}
                    className={`card p-5 transition hover:-translate-y-1 hover:shadow-md ${
                      isPast
                        ? "border-gray-200 bg-gray-50 opacity-70 hover:shadow-none hover:-translate-y-0"
                        : "border-gray-200 bg-white hover:border-[#7C3AED]/30"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${
                        isPast ? "border border-gray-300 text-gray-500 bg-white" : "border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-[#7C3AED]"
                      }`}>
                        {isPast ? "已结束" : "报名中"}
                      </span>
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-[#4C1D95]">{event.title}</h2>
                    {event.summary && <p className="mt-2 text-sm leading-6 text-gray-700 line-clamp-2">{event.summary}</p>}
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="text-[#7C3AED]" />
                        {new Date(event.eventDate).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {event.endDate && ` — ${new Date(event.endDate).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={14} className="text-[#7C3AED]" />
                          {event.location}
                        </div>
                      )}
                      {!isPast && event.maxAttendees && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users size={14} className="text-[#7C3AED]" />
                          已报名 {registrationCount}{event.maxAttendees ? `/${event.maxAttendees}人` : ""}
                        </div>
                      )}
                    </div>
                    {!isPast && (
                      <Link href={`/events/${event.id}`}
                        className="mt-5 btn-primary w-full justify-center"
                      >
                        查看详情 & 报名
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
