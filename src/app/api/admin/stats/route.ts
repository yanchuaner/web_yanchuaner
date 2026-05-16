import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [pendingUsers, pendingPosts, totalAlumni] = await Promise.all([
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'ALUMNI' } }),
    ]);

    return NextResponse.json({ pendingUsers, pendingPosts, totalAlumni });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', pendingUsers: 0, pendingPosts: 0, totalAlumni: 0 },
      { status: 500 },
    );
  }
}
