import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.contentSection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '内容不存在' }, { status: 404 });

    const body = await req.json();
    if (body.title !== undefined && !(body.title || '').trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const section = await prisma.contentSection.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: (body.title || '').trim() }),
        ...(body.description !== undefined && { description: (body.description || '').trim() }),
        ...(body.note !== undefined && { note: (body.note || '').trim() }),
        ...(body.icon !== undefined && { icon: (body.icon || 'BookOpen').trim() }),
        ...(body.href !== undefined && { href: (body.href || '').trim() || null }),
        ...(body.actionLabel !== undefined && { actionLabel: (body.actionLabel || '').trim() || null }),
        ...(body.yearLabel !== undefined && { yearLabel: (body.yearLabel || '').trim() || null }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Admin content PUT error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.contentSection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '内容不存在' }, { status: 404 });

    await prisma.contentSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin content DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
