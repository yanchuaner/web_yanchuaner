import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireVerifiedAlumni } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, summary: true, imageUrl: true, publishedAt: true, createdAt: true },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where: { status: "PUBLISHED" } }),
    ]);

    return NextResponse.json({ news, total, page, limit });
  } catch (error) {
    console.error("News list error:", error);
    return NextResponse.json({ news: [], total: 0 }, { status: 500 });
  }
}
