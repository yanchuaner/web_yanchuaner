import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

export async function DELETE(
  req: NextRequest,
  { params }: { params: IdRouteParams }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const id = await getRouteId(params);
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "内容不存在" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin posts DELETE error:", error);
    return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
  }
}
