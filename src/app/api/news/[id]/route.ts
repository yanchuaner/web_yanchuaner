import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { getPublishedNews } from "@/lib/published-content";
import { canViewMemberNews } from "@/lib/news";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

export async function GET(req: NextRequest, { params }: { params: IdRouteParams }) {
  try {
    const user = await getAuthenticatedUser(req);
    const id = await getRouteId(params);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const includeMember = canViewMemberNews(user);
    const article = await getPublishedNews(id, { includeMember });

    if (!article) {
      if (!includeMember && await getPublishedNews(id, { includeMember: true })) {
        return NextResponse.json({ error: "需要认证成员权限" }, { status: 401 });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
