import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where = status ? { status } : {};

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error("Admin events GET error:", error);
    return NextResponse.json({ error: "获取活动列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { title, summary, content, location, eventDate, endDate, coverImage, maxAttendees, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "正文不能为空" }, { status: 400 });
    }
    if (!eventDate) {
      return NextResponse.json({ error: "活动时间不能为空" }, { status: 400 });
    }
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json({ error: "无效的状态值" }, { status: 400 });
    }

    let parsedMax: number | null = null;
    if (maxAttendees !== null && maxAttendees !== undefined && maxAttendees !== "") {
      parsedMax = parseInt(String(maxAttendees), 10);
      if (isNaN(parsedMax) || parsedMax < 1) {
        return NextResponse.json({ error: "报名人数上限必须为正整数或留空" }, { status: 400 });
      }
    }

    const parsedEventDate = new Date(eventDate);
    if (isNaN(parsedEventDate.getTime())) {
      return NextResponse.json({ error: "活动时间格式错误" }, { status: 400 });
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: "结束时间格式错误" }, { status: 400 });
      }
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        summary: summary?.trim() || null,
        content: content.trim(),
        location: location?.trim() || null,
        eventDate: parsedEventDate,
        endDate: parsedEndDate,
        coverImage: coverImage?.trim() || null,
        maxAttendees: parsedMax,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Admin events POST error:", error);
    return NextResponse.json({ error: "创建活动失败" }, { status: 500 });
  }
}
