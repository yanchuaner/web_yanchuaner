import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser, requireAdmin } from "@/lib/admin-auth";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

export async function DELETE(
  req: NextRequest,
  { params }: { params: IdRouteParams }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = await getRouteId(params);
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "内容不存在" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          action: "post-delete",
          targetType: "Post",
          targetId: existing.id,
          adminId: admin.id,
          before: JSON.stringify({ title: existing.title, status: existing.status }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin posts DELETE error:", error);
    return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
  }
}
