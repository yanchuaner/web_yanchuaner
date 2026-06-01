import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const items = await prisma.memoryItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin memories GET error:', error);
    return NextResponse.json({ error: 'Failed to load memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const maxSort = await prisma.memoryItem.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const item = await prisma.memoryItem.create({
      data: {
        title,
        subtitle: (body.subtitle || '').trim(),
        description: (body.description || '').trim(),
        imagePath: (body.imagePath || '').trim(),
        imageAlt: (body.imageAlt || '').trim(),
        icon: (body.icon || 'camera').trim(),
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Admin memories POST error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
