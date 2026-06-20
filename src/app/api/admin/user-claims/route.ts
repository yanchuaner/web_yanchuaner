import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const search = new URL(req.url).searchParams.get("search")?.trim() || "";
  const [claims, candidates] = await Promise.all([
    prisma.userClaimRequest.findMany({
      where: { status: "PENDING" },
      include: {
        claimant: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            graduationClass: true,
            className: true,
            contact: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        username: null,
        email: null,
        passwordHash: null,
        mergedIntoUserId: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { contact: { contains: search } },
                { identityCode: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        contact: true,
        identityCode: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return NextResponse.json({ claims, candidates });
}
