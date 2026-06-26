import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import {
  normalizeUsername,
  readJsonBody,
  USERNAME_PATTERN,
} from "@/lib/auth-utils";

const select = {
  id: true,
  username: true,
  email: true,
  emailVerified: true,
  name: true,
  contact: true,
  graduationClass: true,
  className: true,
  city: true,
  university: true,
  major: true,
  industry: true,
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
      username?: unknown;
      contact?: unknown;
      city?: unknown;
      university?: unknown;
      major?: unknown;
      industry?: unknown;
    }>(req);
    const username = normalizeUsername(body.username);
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const university = typeof body.university === "string" ? body.university.trim() : "";
    const major = typeof body.major === "string" ? body.major.trim() : "";
    const industry = typeof body.industry === "string" ? body.industry.trim() : "";

    if (
      !USERNAME_PATTERN.test(username) ||
      contact.length > 128 ||
      city.length > 100 ||
      university.length > 150 ||
      major.length > 100 ||
      industry.length > 100
    ) {
      return NextResponse.json({ error: "资料格式无效" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        contact: contact || null,
        city: city || null,
        university: university || null,
        major: major || null,
        industry: industry || null,
      },
      select,
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "用户名已被使用" }, { status: 409 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
