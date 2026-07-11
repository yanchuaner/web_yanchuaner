import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { invalidateCachePrefix } from "@/lib/cache";

export const ACTIVE_EVENT_REGISTRATION_STATUSES = [
  "PENDING",
  "APPROVED",
] as const;

export type EventRegistrationInput = {
  contact: string | null;
  message: string | null;
};

export type EventRegistrationInputResult =
  | { ok: true; value: EventRegistrationInput }
  | { ok: false; message: string };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return { ok: true as const, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false as const };
  }
  const normalized = value.trim().normalize("NFC");
  if (normalized.length > maxLength || CONTROL_CHARACTERS.test(normalized)) {
    return { ok: false as const };
  }
  return { ok: true as const, value: normalized || null };
}

export function parseEventRegistrationInput(
  input: unknown,
  options: { allowLegacyName?: boolean } = {},
): EventRegistrationInputResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "报名资料格式无效" };
  }
  const body = input as Record<string, unknown>;
  const allowedKeys = options.allowLegacyName
    ? new Set(["name", "contact", "message"])
    : new Set(["contact", "message"]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return { ok: false, message: "报名资料包含不支持的字段" };
  }

  const contact = optionalText(body.contact, 128);
  const message = optionalText(body.message, 500);
  if (!contact.ok || !message.ok) {
    return { ok: false, message: "联系方式或留言格式无效或过长" };
  }
  return {
    ok: true,
    value: { contact: contact.value, message: message.value },
  };
}

const registrationSelect = {
  id: true,
  eventId: true,
  userId: true,
  name: true,
  contact: true,
  message: true,
  status: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventRegistrationSelect;

export type EventRegistrationRecord = Prisma.EventRegistrationGetPayload<{
  select: typeof registrationSelect;
}>;

export type RegisterForEventResult =
  | { kind: "REGISTERED"; registration: EventRegistrationRecord }
  | { kind: "NOT_FOUND" }
  | { kind: "CLOSED" }
  | { kind: "FULL" }
  | { kind: "ALREADY_REGISTERED" }
  | { kind: "REJECTED" };

export async function registerForEvent(input: {
  eventId: string;
  userId: string;
  name: string;
  contact: string | null;
  message: string | null;
}): Promise<RegisterForEventResult> {
  const result = await prisma.$transaction(async (tx) => {
    // Acquire the SQLite writer lock before checking capacity.
    await tx.$executeRaw`
      UPDATE "Event" SET "updatedAt" = "updatedAt" WHERE "id" = ${input.eventId}
    `;
    const event = await tx.event.findFirst({
      where: { id: input.eventId, status: "PUBLISHED" },
      select: { id: true, eventDate: true, maxAttendees: true },
    });
    if (!event) return { kind: "NOT_FOUND" as const };
    if (event.eventDate.getTime() <= Date.now()) {
      return { kind: "CLOSED" as const };
    }

    const existing = await tx.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId: input.eventId, userId: input.userId },
      },
      select: registrationSelect,
    });
    if (
      existing?.status === "PENDING" ||
      existing?.status === "APPROVED"
    ) {
      return { kind: "ALREADY_REGISTERED" as const };
    }
    if (existing?.status === "REJECTED") {
      return { kind: "REJECTED" as const };
    }

    if (event.maxAttendees !== null) {
      const activeCount = await tx.eventRegistration.count({
        where: {
          eventId: input.eventId,
          status: { in: [...ACTIVE_EVENT_REGISTRATION_STATUSES] },
        },
      });
      if (activeCount >= event.maxAttendees) {
        return { kind: "FULL" as const };
      }
    }

    const registration = existing
      ? await tx.eventRegistration.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            contact: input.contact,
            message: input.message,
            status: "APPROVED",
            cancelledAt: null,
          },
          select: registrationSelect,
        })
      : await tx.eventRegistration.create({
          data: {
            eventId: input.eventId,
            userId: input.userId,
            name: input.name,
            contact: input.contact,
            message: input.message,
            status: "APPROVED",
          },
          select: registrationSelect,
        });

    await tx.auditLog.create({
      data: {
        action: existing
          ? "event-registration-reactivate"
          : "event-registration-create",
        targetType: "EventRegistration",
        targetId: registration.id,
        adminId: input.userId,
        before: existing
          ? JSON.stringify({ status: existing.status })
          : null,
        after: JSON.stringify({
          registrationId: registration.id,
          eventId: input.eventId,
          status: registration.status,
        }),
      },
    });
    return { kind: "REGISTERED" as const, registration };
  });
  if (result.kind === "REGISTERED") {
    await invalidateCachePrefix("published:events:");
  }
  return result;
}

export type CancelEventRegistrationResult =
  | { kind: "CANCELLED"; registration: EventRegistrationRecord }
  | { kind: "NOT_FOUND" }
  | { kind: "CLOSED" }
  | { kind: "NOT_ACTIVE" };

export async function cancelEventRegistration(input: {
  eventId: string;
  userId: string;
}): Promise<CancelEventRegistrationResult> {
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: input.eventId },
      select: { eventDate: true },
    });
    if (!event) return { kind: "NOT_FOUND" as const };
    if (event.eventDate.getTime() <= Date.now()) {
      return { kind: "CLOSED" as const };
    }
    const existing = await tx.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId: input.eventId, userId: input.userId },
      },
      select: registrationSelect,
    });
    if (!existing) return { kind: "NOT_FOUND" as const };
    if (existing.status === "CANCELLED") {
      return { kind: "CANCELLED" as const, registration: existing };
    }
    if (existing.status === "REJECTED") {
      return { kind: "NOT_ACTIVE" as const };
    }

    const registration = await tx.eventRegistration.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      select: registrationSelect,
    });
    await tx.auditLog.create({
      data: {
        action: "event-registration-cancel",
        targetType: "EventRegistration",
        targetId: registration.id,
        adminId: input.userId,
        before: JSON.stringify({ status: existing.status }),
        after: JSON.stringify({
          registrationId: registration.id,
          eventId: input.eventId,
          status: registration.status,
        }),
      },
    });
    return { kind: "CANCELLED" as const, registration };
  });
  if (result.kind === "CANCELLED") {
    await invalidateCachePrefix("published:events:");
  }
  return result;
}
