export const revalidate = 60;

import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";
import { LocalizedText } from "@/components/LocalizedText";
import { LocalizedDate } from "@/components/LocalizedDate";
import { requirePageAlumni } from "@/lib/admin-auth";
import { listPublishedEvents } from "@/lib/published-content";

export const metadata: Metadata = {
  title: "校友活动",
  description: "燕川中学校友活动 — 返校聚会、线上讲座、校友交流活动的信息发布与在线报名",
};
export default async function EventsPage() {
  const user = await requirePageAlumni();
  const { items: events } = await listPublishedEvents({
    page: 1,
    pageSize: 100,
    userId: user.id,
  });

  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="EVENTS"
          eyebrowIcon={CalendarDays}
          title={<LocalizedText translationKey="contentPages.events.title" />}
          description={<LocalizedText translationKey="contentPages.events.description" />}
          action={<ButtonLink href="/" variant="secondary"><LocalizedText translationKey="common.backHome" /></ButtonLink>}
        />

        <div className="mt-8">
          {events.length === 0 ? (
            <EmptyState title={<LocalizedText translationKey="contentPages.events.empty" />} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => {
                const isPast = new Date(event.eventDate) < new Date();
                const registrationCount = event.registrationCount;

                return (
                  <GlassCard
                    key={event.id}
                    as="article"
                    className={`flex flex-col overflow-hidden p-5 ${
                      isPast
                        ? "opacity-60 bg-surface/60"
                        : ""
                    }`}
                  >
                    {event.coverImage && (
                      <div className="relative -mx-5 -mt-5 mb-4 aspect-video overflow-hidden border-b border-brand/10">
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border ${
                        isPast ? "border-line text-main/60 bg-surface/40" : "border-brand/20 bg-brand/10 text-brand"
                      }`}>
                        <LocalizedText translationKey={isPast ? "contentPages.events.ended" : "contentPages.events.open"} />
                      </span>
                      {event.registrationStatus === "APPROVED" || event.registrationStatus === "PENDING" ? (
                        <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs text-success">
                          <LocalizedText translationKey="contentPages.events.myRegistered" />
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-brand-fg">{event.title}</h2>
                    {event.summary && <p className="mt-2 text-sm leading-6 text-main/60 line-clamp-2">{event.summary}</p>}
                    <div className="mt-4 flex-1 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-main/60">
                        <Clock size={14} className="text-brand" />
                        <LocalizedDate value={event.eventDate} style="event" />
                        {event.endDate && <><span aria-hidden="true"> – </span><LocalizedDate value={event.endDate} style="time" /></>}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-main/60">
                          <MapPin size={14} className="text-brand" />
                          {event.location}
                        </div>
                      )}
                      {!isPast && event.maxAttendees && (
                        <div className="flex items-center gap-2 text-main/60">
                          <Users size={14} className="text-brand" />
                          <LocalizedText translationKey="contentPages.events.registered" /> {registrationCount}{event.maxAttendees ? `/${event.maxAttendees}` : ""} <LocalizedText translationKey="contentPages.events.people" />
                        </div>
                      )}
                    </div>
                    {!isPast && (
                      <div className="mt-5 flex justify-end">
                        <ButtonLink href={`/events/${event.id}`} variant="primary">
                          <LocalizedText translationKey="contentPages.events.detailAction" />
                        </ButtonLink>
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </PageShell>
  );
}
