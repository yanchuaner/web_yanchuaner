import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedAlumni } from "@/lib/admin-auth";
import { getPublishedNews } from "@/lib/published-content";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

export async function GET(req: NextRequest, { params }: { params: IdRouteParams }) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const id = await getRouteId(params);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const article = await getPublishedNews(id);

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
