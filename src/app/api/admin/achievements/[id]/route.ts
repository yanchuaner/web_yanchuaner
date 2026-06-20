import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isAchievementCategory,
  isAchievementStatus,
} from "@/lib/achievements";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "成就记录不存在" }, { status: 404 });
    }

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

    const achievement = await prisma.achievement.update({
      where: { id: params.id },
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

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error("Admin achievements PUT error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "成就记录不存在" }, { status: 404 });
    }

    await prisma.achievement.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin achievements DELETE error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
