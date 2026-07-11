import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedAlumni } from "@/lib/admin-auth";
import { listPublishedEvents } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const { items, total } = await listPublishedEvents({
      page,
      pageSize: limit,
    });
    const enriched = items.map(({ registrationStatus, remainingSlots, ...event }) => ({
      ...event,
      isPast: event.eventDate < new Date(),
    }));

    return NextResponse.json({ events: enriched, total, page, limit });
  } catch (error) {
    console.error("Events list error:", error);
    return NextResponse.json({ events: [], total: 0 }, { status: 500 });
  }
}
