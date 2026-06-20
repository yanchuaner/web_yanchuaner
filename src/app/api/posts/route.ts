import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (
    !user ||
    (user.role !== "ADMIN" &&
      (user.role !== "ALUMNI" || user.status !== "VERIFIED"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 限流：每分钟 3 次
  const ip = getClientIp(req);
  const limit = await rateLimit(`posts:${ip}`, 3, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: '提交过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { title, content, type } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const validTypes = ['STORY', 'EVENT', 'JOB'];
    const postType = validTypes.includes(type) ? type : 'STORY';

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type: postType,
        status: 'PENDING',
        authorId: user.id,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
