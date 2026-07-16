import prisma from "@/lib/db";
import { requirePageUser } from "@/lib/admin-auth";
import { MyEventRegistrationsClient } from "@/components/MyEventRegistrationsClient";

export default async function MyEventsPage() {
  const user = await requirePageUser();
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      event: {
        select: {
          id: true,
          title: true,
          summary: true,
          location: true,
          eventDate: true,
          endDate: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  return (
    <MyEventRegistrationsClient
      initialItems={registrations.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        event: {
          ...item.event,
          eventDate: item.event.eventDate.toISOString(),
          endDate: item.event.endDate?.toISOString() || null,
        },
      }))}
    />
  );
}
