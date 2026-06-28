import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { readJsonBody } from '@/lib/auth-utils';
import { getRouteId, type IdRouteParams } from '@/lib/route-params';

export async function PATCH(
  req: NextRequest,
  { params }: { params: IdRouteParams }
) {
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const id = await getRouteId(params);

    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '故事不存在' }, { status: 404 });
    }

    const body = await readJsonBody<{ status?: unknown }>(req, 16384); // 16KB limit

    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (status !== 'PUBLISHED' && status !== 'REJECTED') {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const story = await tx.story.update({
        where: { id },
        data: { status: status as 'PUBLISHED' | 'REJECTED' },
      });

      await tx.auditLog.create({
        data: {
          action: `story-review-${status.toLowerCase()}`,
          targetType: 'Story',
          targetId: id,
          adminId: admin.id,
          before: JSON.stringify({ status: existing.status }),
          after: JSON.stringify({ status }),
        },
      });

      return story;
    });

    return NextResponse.json({ story: updated });
  } catch (error: any) {
    console.error('Admin story review PATCH error:', error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json({ error: '审核更新失败' }, { status: 500 });
  }
}
