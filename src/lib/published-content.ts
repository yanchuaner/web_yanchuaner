import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { ACTIVE_EVENT_REGISTRATION_STATUSES } from "@/lib/event-registration";
import { getCachedOrFetch } from "@/lib/cache";

const PUBLISHED_CONTENT_TTL_SECONDS = 60;

const newsListSelect = {
  id: true,
  title: true,
  summary: true,
  imageUrl: true,
  publishedAt: true,
  createdAt: true,
} satisfies Prisma.NewsSelect;

const newsDetailSelect = {
  ...newsListSelect,
  content: true,
  updatedAt: true,
} satisfies Prisma.NewsSelect;

const eventListSelect = {
  id: true,
  title: true,
  summary: true,
  location: true,
  eventDate: true,
  endDate: true,
  coverImage: true,
  maxAttendees: true,
  _count: {
    select: {
      registrations: {
        where: { status: { in: [...ACTIVE_EVENT_REGISTRATION_STATUSES] } },
      },
    },
  },
} satisfies Prisma.EventSelect;

const eventDetailSelect = {
  ...eventListSelect,
  content: true,
  status: true,
} satisfies Prisma.EventSelect;

export async function listPublishedNews(page: number, pageSize: number) {
  const cached = await getCachedOrFetch(
    `published:news:list:${page}:${pageSize}`,
    PUBLISHED_CONTENT_TTL_SECONDS,
    async () => {
      const where = { status: "PUBLISHED" };
      const [items, total] = await Promise.all([
        prisma.news.findMany({
          where,
          select: newsListSelect,
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.news.count({ where }),
      ]);
      return {
        items: items.map((item) => ({
          ...item,
          publishedAt: item.publishedAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
      };
    },
  );
  return {
    items: cached.items.map((item) => ({
      ...item,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      createdAt: new Date(item.createdAt),
    })),
    total: cached.total,
  };
}

export async function getPublishedNews(id: string) {
  const cached = await getCachedOrFetch(
    `published:news:detail:${id}`,
    PUBLISHED_CONTENT_TTL_SECONDS,
    async () => {
      const item = await prisma.news.findFirst({
        where: { id, status: "PUBLISHED" },
        select: newsDetailSelect,
      });
      return item
        ? {
            ...item,
            publishedAt: item.publishedAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          }
        : null;
    },
  );
  return cached
    ? {
        ...cached,
        publishedAt: cached.publishedAt ? new Date(cached.publishedAt) : null,
        createdAt: new Date(cached.createdAt),
        updatedAt: new Date(cached.updatedAt),
      }
    : null;
}

async function registrationStatuses(userId: string | undefined, eventIds: string[]) {
  if (!userId || eventIds.length === 0) return new Map<string, string>();
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });
  return new Map(registrations.map((item) => [item.eventId, item.status]));
}

function toPublishedEvent<T extends {
  id: string;
  maxAttendees: number | null;
  _count: { registrations: number };
}>(event: T, statusByEvent: Map<string, string>) {
  const registrationCount = event._count.registrations;
  const { _count, ...item } = event;
  return {
    ...item,
    registrationStatus: statusByEvent.get(event.id) ?? null,
    registrationCount,
    remainingSlots:
      event.maxAttendees === null
        ? null
        : Math.max(0, event.maxAttendees - registrationCount),
  };
}

export async function listPublishedEvents(input: {
  page: number;
  pageSize: number;
  userId?: string;
}) {
  const cached = await getCachedOrFetch(
    `published:events:list:${input.page}:${input.pageSize}`,
    PUBLISHED_CONTENT_TTL_SECONDS,
    async () => {
      const where = { status: "PUBLISHED" };
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          select: eventListSelect,
          orderBy: [{ eventDate: "asc" }, { id: "asc" }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.event.count({ where }),
      ]);
      return {
        events: events.map((event) => ({
          ...event,
          eventDate: event.eventDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
        })),
        total,
      };
    },
  );
  const events = cached.events.map((event) => ({
    ...event,
    eventDate: new Date(event.eventDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
  }));
  const statuses = await registrationStatuses(
    input.userId,
    events.map((event) => event.id),
  );
  return {
    items: events.map((event) => toPublishedEvent(event, statuses)),
    total: cached.total,
  };
}

export async function getPublishedEvent(id: string, userId?: string) {
  const cached = await getCachedOrFetch(
    `published:events:detail:${id}`,
    PUBLISHED_CONTENT_TTL_SECONDS,
    async () => {
      const event = await prisma.event.findFirst({
        where: { id, status: "PUBLISHED" },
        select: eventDetailSelect,
      });
      return event
        ? {
            ...event,
            eventDate: event.eventDate.toISOString(),
            endDate: event.endDate?.toISOString() ?? null,
          }
        : null;
    },
  );
  const event = cached
    ? {
        ...cached,
        eventDate: new Date(cached.eventDate),
        endDate: cached.endDate ? new Date(cached.endDate) : null,
      }
    : null;
  if (!event) return null;
  const statuses = await registrationStatuses(userId, [event.id]);
  return toPublishedEvent(event, statuses);
}
