import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.teacherSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '版块不存在' }, { status: 404 });
    }

    const body = await req.json();
    const title = (body.title || '').trim();

    if (body.title !== undefined && !title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const section = await prisma.teacherSection.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title }),
        ...(body.description !== undefined && { description: (body.description || '').trim() }),
        ...(body.note !== undefined && { note: (body.note || '').trim() }),
        ...(body.icon !== undefined && { icon: (body.icon || 'BookOpen').trim() }),
        ...(body.href !== undefined && { href: (body.href || '').trim() || null }),
        ...(body.actionLabel !== undefined && { actionLabel: (body.actionLabel || '').trim() || null }),
        ...(typeof body.sortOrder === 'number' && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Admin teachers PUT error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { id } = await params;
    const existing = await prisma.teacherSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '版块不存在' }, { status: 404 });
    }

    await prisma.teacherSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin teachers DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
