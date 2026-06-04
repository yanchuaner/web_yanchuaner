import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      orderBy: { date: 'desc' },
    });
    const data = stories.map((s) => ({
      id: s.id,
      title: s.title,
      author: s.author,
      tags: JSON.parse(s.tags || '[]'),
      body: s.body,
      date: s.date,
    }));
    return NextResponse.json({ stories: data });
  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json({ stories: [] }, { status: 500 });
  }
}
