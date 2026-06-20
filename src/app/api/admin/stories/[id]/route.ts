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
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '故事不存在' }, { status: 404 });

    const body = await req.json();
    if (body.title !== undefined && !(body.title || '').trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: (body.title || '').trim() }),
        ...(body.author !== undefined && { author: (body.author || '').trim() }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags || []) }),
        ...(body.body !== undefined && { body: (body.body || '').trim() }),
        ...(body.date !== undefined && { date: body.date || '' }),
      },
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Admin stories PUT error:', error);
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
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: '故事不存在' }, { status: 404 });

    await prisma.story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin stories DELETE error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
