import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const stories = await prisma.story.findMany({
      orderBy: { date: 'desc' },
    });
    // Parse tags back from JSON string
    const data = stories.map((s) => ({
      ...s,
      tags: JSON.parse(s.tags || '[]'),
    }));
    return NextResponse.json({ stories: data });
  } catch (error) {
    console.error('Admin stories GET error:', error);
    return NextResponse.json({ error: '加载失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const title = (body.title || '').trim();
    if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    if (!body.body?.trim()) return NextResponse.json({ error: '正文不能为空' }, { status: 400 });

    const story = await prisma.story.create({
      data: {
        title,
        author: (body.author || '').trim(),
        tags: JSON.stringify(body.tags || []),
        body: body.body.trim(),
        date: body.date || new Date().toISOString().slice(0, 10),
      },
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error('Admin stories POST error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
