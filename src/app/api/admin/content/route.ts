import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');

  try {
    const where = page ? { page } : {};
    const sections = await prisma.contentSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin content GET error:', error);
    return NextResponse.json({ error: '加载失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const title = (body.title || '').trim();
    const page = (body.page || '').trim();
    if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    if (!page) return NextResponse.json({ error: '页面标识不能为空' }, { status: 400 });

    const maxSort = await prisma.contentSection.findFirst({
      where: { page },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

    const section = await prisma.contentSection.create({
      data: {
        page,
        title,
        description: (body.description || '').trim(),
        note: (body.note || '').trim(),
        icon: (body.icon || 'BookOpen').trim(),
        href: (body.href || '').trim() || null,
        actionLabel: (body.actionLabel || '').trim() || null,
        yearLabel: (body.yearLabel || '').trim() || null,
        sortOrder,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Admin content POST error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
