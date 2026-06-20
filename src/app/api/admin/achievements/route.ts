import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isAchievementCategory,
  isAchievementStatus,
} from "@/lib/achievements";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Admin achievements GET error:", error);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const alumniName = (body.alumniName || "").trim();
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const category = (body.category || "OTHER").trim();
    const status = (body.status || "DRAFT").trim();

    if (!alumniName || alumniName.length > 50) {
      return NextResponse.json(
        { error: "校友姓名不能为空且不超过50字" },
        { status: 400 },
      );
    }
    if (!title || title.length > 120) {
      return NextResponse.json(
        { error: "成就标题不能为空且不超过120字" },
        { status: 400 },
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "成就简介不超过2000字" },
        { status: 400 },
      );
    }
    if (!isAchievementCategory(category)) {
      return NextResponse.json({ error: "成就类别无效" }, { status: 400 });
    }
    if (!isAchievementStatus(status)) {
      return NextResponse.json({ error: "发布状态无效" }, { status: 400 });
    }

    const achievement = await prisma.achievement.create({
      data: {
        alumniName,
        title,
        description,
        category,
        status,
        graduationClass: (body.graduationClass || "").trim() || null,
        organization: (body.organization || "").trim() || null,
        yearLabel: (body.yearLabel || "").trim() || null,
        sortOrder: Number.isFinite(Number(body.sortOrder))
          ? Math.trunc(Number(body.sortOrder))
          : 0,
      },
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error("Admin achievements POST error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
