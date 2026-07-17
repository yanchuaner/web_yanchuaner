export const revalidate = 60;

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import prisma from "@/lib/db";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";
import { LocalizedText } from "@/components/LocalizedText";
import { LocalizedDate } from "@/components/LocalizedDate";
import { requirePageAlumni } from "@/lib/admin-auth";
import { getPublishedEvent } from "@/lib/published-content";

const SITE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export async function generateMetadata({ params }: { params: IdRouteParams }): Promise<Metadata> {
  const id = await getRouteId(params);
  const event = await prisma.event.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { title: true, summary: true, coverImage: true },
  });

  if (!event) {
    return { title: "活动未找到" };
  }

  return {
    title: event.title,
    description: event.summary || event.title,
    openGraph: {
      title: event.title,
      description: event.summary || event.title,
      url: `${SITE_URL}/events/${id}`,
      images: event.coverImage ? [event.coverImage] : ["/card.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      images: [event.coverImage || "/card.jpg"],
    },
  };
}

export default async function EventDetailPage({ params }: { params: IdRouteParams }) {
  const user = await requirePageAlumni();
  const id = await getRouteId(params);
  const event = await getPublishedEvent(id, user.id);

  if (!event) {
    notFound();
  }

  const isPast = new Date(event.eventDate) < new Date();
  const registrationCount = event.registrationCount;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <Link href="/events" className="mb-6 inline-flex items-center gap-1 text-sm text-brand transition hover:text-main cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted">
          <ArrowLeft size={14} /> <LocalizedText translationKey="contentPages.events.back" />
        </Link>

        <div className="mb-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            isPast ? "border border-line text-main/60 bg-surface" : "border border-brand/20 bg-brand/10 text-brand"
          }`}>
            <LocalizedText translationKey={isPast ? "contentPages.events.ended" : "contentPages.events.open"} />
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-main md:text-3xl">{event.title}</h1>
        {event.summary && <p className="mt-3 text-sm leading-7 text-main/60 md:text-base">{event.summary}</p>}

        {event.coverImage ? (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-card border border-line">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-3 rounded-2xl border border-brand-soft/20 bg-surface-muted p-5">
          <div className="flex items-center gap-3 text-sm text-main/60">
            <Clock size={18} className="text-brand/60 shrink-0" />
            <span>
              <LocalizedDate value={event.eventDate} style="dateTime" />
              {event.endDate && <><span aria-hidden="true"> – </span><LocalizedDate value={event.endDate} style="time" /></>}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-main/60">
              <MapPin size={18} className="text-brand/60 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-main/60">
            <Users size={18} className="text-brand/60 shrink-0" />
            <span><LocalizedText translationKey="contentPages.events.registered" /> {registrationCount}{event.maxAttendees ? ` / ${event.maxAttendees}` : ""} <LocalizedText translationKey="contentPages.events.people" /></span>
          </div>
        </div>

        <div className="mt-8 border-t border-brand/10 pt-6">
          <div className="text-sm leading-7 text-main/60 md:text-base whitespace-pre-wrap">{event.content}</div>
        </div>

        {!isPast && (
          <EventRegistrationForm
            eventId={event.id}
            registrationCount={registrationCount}
            maxAttendees={event.maxAttendees}
            initialRegistrationStatus={event.registrationStatus}
          />
        )}
      </div>
    </section>
  );
}
