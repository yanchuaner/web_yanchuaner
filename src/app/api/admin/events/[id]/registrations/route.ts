import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

export async function GET(
  req: NextRequest,
  { params }: { params: IdRouteParams }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const id = await getRouteId(params);
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        eventDate: true,
        maxAttendees: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const [registrations, activeRegistrationCount, totalRegistrationCount] =
      await Promise.all([
        prisma.eventRegistration.findMany({
          where: { eventId: id },
          orderBy: { createdAt: "desc" },
          take: 300,
          select: {
            id: true,
            name: true,
            contact: true,
            message: true,
            status: true,
            cancelledAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.eventRegistration.count({
          where: {
            eventId: id,
            status: { in: ["PENDING", "APPROVED"] },
          },
        }),
        prisma.eventRegistration.count({ where: { eventId: id } }),
      ]);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        maxAttendees: event.maxAttendees,
        registrationCount: activeRegistrationCount,
        activeRegistrationCount,
        totalRegistrationCount,
      },
      registrations,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin registrations GET error:", error);
    return NextResponse.json({ error: "获取报名列表失败" }, { status: 500 });
  }
}
