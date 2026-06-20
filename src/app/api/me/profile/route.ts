import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

const select = {
  id: true,
  username: true,
  email: true,
  emailVerified: true,
  name: true,
  contact: true,
  graduationClass: true,
  className: true,
  status: true,
  role: true,
  accountStatus: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select });
  return NextResponse.json({ user: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await readJsonBody<{
      name?: unknown;
      contact?: unknown;
      graduationClass?: unknown;
      className?: unknown;
    }>(req);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const graduationClass =
      typeof body.graduationClass === "string"
        ? body.graduationClass.trim()
        : "";
    const className =
      typeof body.className === "string" ? body.className.trim() : "";
    if (
      !name ||
      name.length > 64 ||
      contact.length > 128 ||
      graduationClass.length > 32 ||
      className.length > 64
    ) {
      return NextResponse.json({ error: "资料格式无效" }, { status: 400 });
    }
    const identityChanged =
      name !== user.name || graduationClass !== (user.graduationClass || "");
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: user.id },
        data: {
          name,
          contact: contact || null,
          graduationClass: graduationClass || null,
          className: className || null,
          ...(identityChanged && user.role !== "ADMIN"
            ? {
                role: "GUEST",
                status: "PENDING",
                sessionVersion: { increment: 1 },
              }
            : {}),
        },
        select,
      });
      return result;
    });
    return NextResponse.json({ user: updated, reauthenticationRequired: identityChanged });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
