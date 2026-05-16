import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type, authorContact } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const validTypes = ['STORY', 'EVENT', 'JOB'];
    const postType = validTypes.includes(type) ? type : 'STORY';

    // Find or create a guest user as the author if no authenticated user
    let author = null;
    if (authorContact) {
      author = await prisma.user.findFirst({ where: { contact: authorContact } });
    }
    // If no match, create a guest placeholder — real auth will replace this later
    if (!author) {
      author = await prisma.user.create({
        data: {
          name: '匿名投稿者',
          role: 'GUEST',
          status: 'PENDING',
          contact: authorContact || null,
        },
      });
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type: postType,
        status: 'PENDING',
        authorId: author.id,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
