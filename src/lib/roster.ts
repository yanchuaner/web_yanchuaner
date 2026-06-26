import { Prisma, PrismaClient } from "@prisma/client";

type RosterClient = PrismaClient | Prisma.TransactionClient;

export type RosterWrite = {
  name: string;
  graduationClass?: string | null;
  className?: string | null;
  email?: string | null;
  contact?: string | null;
  tags?: string | null;
  certificateNo?: string | null;
  city?: string | null;
  university?: string | null;
  major?: string | null;
  industry?: string | null;
};

function optional(value: string | null | undefined) {
  return value?.trim() || null;
}

export async function upsertRosterEntry(
  client: RosterClient,
  input: RosterWrite,
) {
  const identity = {
    name: input.name.trim(),
    graduationClass: optional(input.graduationClass),
    className: optional(input.className),
    email: optional(input.email)?.toLowerCase() || null,
  };
  const existing = await client.whitelistRoster.findFirst({
    where: identity,
  });

  if (existing) {
    const entry = await client.whitelistRoster.update({
      where: { id: existing.id },
      data: {
        ...(input.tags !== undefined ? { tags: optional(input.tags) } : {}),
        ...(input.contact !== undefined ? { contact: optional(input.contact) } : {}),
        ...(input.certificateNo !== undefined
          ? { certificateNo: optional(input.certificateNo) }
          : {}),
        ...(input.city !== undefined ? { city: optional(input.city) } : {}),
        ...(input.university !== undefined ? { university: optional(input.university) } : {}),
        ...(input.major !== undefined ? { major: optional(input.major) } : {}),
        ...(input.industry !== undefined ? { industry: optional(input.industry) } : {}),
      },
    });
    return { entry, created: false };
  }

  const entry = await client.whitelistRoster.create({
    data: {
      ...identity,
      contact: optional(input.contact),
      tags: optional(input.tags),
      certificateNo: optional(input.certificateNo),
      city: optional(input.city),
      university: optional(input.university),
      major: optional(input.major),
      industry: optional(input.industry),
    },
  });
  return { entry, created: true };
}
