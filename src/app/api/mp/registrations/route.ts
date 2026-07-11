import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";

export async function GET(req: NextRequest) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: auth.auth.user.id },
      select: {
        id: true,
        name: true,
        contact: true,
        message: true,
        status: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            summary: true,
            location: true,
            eventDate: true,
            endDate: true,
            coverImage: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    return mpSuccess({
      items: registrations.map((registration) => ({
        id: registration.id,
        name: registration.name,
        contact: registration.contact,
        message: registration.message,
        status: registration.status,
        cancelledAt: registration.cancelledAt?.toISOString() ?? null,
        createdAt: registration.createdAt.toISOString(),
        updatedAt: registration.updatedAt.toISOString(),
        event: {
          ...registration.event,
          eventDate: registration.event.eventDate.toISOString(),
          endDate: registration.event.endDate?.toISOString() ?? null,
        },
      })),
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "我的报名加载失败，请稍后再试",
      500,
    );
  }
}
