import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedAlumni } from "@/lib/admin-auth";
import { listPublishedNews } from "@/lib/published-content";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const { items: news, total } = await listPublishedNews(page, limit);

    return NextResponse.json({ news, total, page, limit });
  } catch (error) {
    console.error("News list error:", error);
    return NextResponse.json({ news: [], total: 0 }, { status: 500 });
  }
}
