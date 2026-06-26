import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const story = await prisma.story.findUnique({
      where: { id: resolvedParams.id, status: "PUBLISHED" },
      include: { authorUser: { select: { id: true, name: true } } },
    });
    if (!story) {
      return NextResponse.json({ error: "故事不存在" }, { status: 404 });
    }
    let parsedTags: string[] = [];
    try { parsedTags = JSON.parse(story.tags || "[]"); } catch {}
    return NextResponse.json({ story: { ...story, tags: parsedTags } });
  } catch {
    return NextResponse.json({ error: "系统错误" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      return NextResponse.json({ error: "故事投稿不存在" }, { status: 404 });
    }

    // IDOR Protection: Ensure user owns this story
    if (story.authorId !== user.id) {
      return NextResponse.json(
        { error: "权限不足：您只能删除或撤销自己的投稿" },
        { status: 403 }
      );
    }

    // State machine check: only PENDING or DRAFT can be deleted
    if (story.status !== "PENDING" && story.status !== "DRAFT") {
      return NextResponse.json(
        { error: "只能删除或撤销处于审核中或草稿状态的投稿" },
        { status: 400 }
      );
    }

    await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User story DELETE error:", error);
    return NextResponse.json({ error: "系统错误，请稍后重试" }, { status: 500 });
  }
}
