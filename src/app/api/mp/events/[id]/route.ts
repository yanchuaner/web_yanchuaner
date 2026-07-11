import { NextRequest } from "next/server";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";
import { getPublishedEvent } from "@/lib/published-content";

export async function GET(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const id = await getRouteId(params);
    const event = await getPublishedEvent(id, auth.auth.user.id);
    if (!event) {
      return mpError(MP_ERROR_CODES.NOT_FOUND, "活动不存在", 404);
    }
    return mpSuccess({
      event: {
        id: event.id,
        title: event.title,
        summary: event.summary,
        content: event.content,
        location: event.location,
        eventDate: event.eventDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        coverImage: event.coverImage,
        maxAttendees: event.maxAttendees,
        registrationStatus: event.registrationStatus,
        registrationCount: event.registrationCount,
        remainingSlots: event.remainingSlots,
      },
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "活动详情加载失败，请稍后再试",
      500,
    );
  }
}
