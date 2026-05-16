import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const article = await prisma.news.findFirst({
      where: { id, status: "PUBLISHED" },
      select: { id: true, title: true, summary: true, content: true, imageUrl: true, publishedAt: true, createdAt: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
