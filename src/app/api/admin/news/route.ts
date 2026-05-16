import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where = status ? { status } : {};

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({ news, total, limit, offset });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "获取新闻列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { title, summary, content, imageUrl, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }

    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        summary: summary?.trim() || null,
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        status: status || "DRAFT",
        publishedAt,
      },
    });

    return NextResponse.json({ news }, { status: 201 });
  } catch (error) {
    console.error("Admin news POST error:", error);
    return NextResponse.json({ error: "创建新闻失败" }, { status: 500 });
  }
}
