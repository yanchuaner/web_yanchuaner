import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const now = new Date().toISOString();

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          summary: true,
          location: true,
          eventDate: true,
          endDate: true,
          coverImage: true,
          maxAttendees: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { eventDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
    ]);

    const enriched = events.map((e) => ({
      ...e,
      registrationCount: e._count.registrations,
      isPast: new Date(e.eventDate) < new Date(),
      _count: undefined,
    }));

    return NextResponse.json({ events: enriched, total, page, limit });
  } catch (error) {
    console.error("Events list error:", error);
    return NextResponse.json({ events: [], total: 0 }, { status: 500 });
  }
}
