import { NextRequest } from "next/server";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { parseMpPagination, toMpPagination } from "@/lib/mp-pagination";
import { listPublishedEvents } from "@/lib/published-content";

export async function GET(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const { page, pageSize } = parseMpPagination(
      new URL(req.url).searchParams,
    );
    const { items: events, total } = await listPublishedEvents({
      page,
      pageSize,
      userId: auth.auth.user.id,
    });

    return mpSuccess({
      items: events.map((event) => ({
          id: event.id,
          title: event.title,
          summary: event.summary,
          location: event.location,
          eventDate: event.eventDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
          coverImage: event.coverImage,
          maxAttendees: event.maxAttendees,
          registrationStatus: event.registrationStatus,
          registrationCount: event.registrationCount,
          remainingSlots: event.remainingSlots,
        })),
      pagination: toMpPagination(page, pageSize, total),
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "活动列表加载失败，请稍后再试",
      500,
    );
  }
}
