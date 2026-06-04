import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // 限流：每分钟 5 次
  const ip = getClientIp(req);
  const limit = await rateLimit(`join:${ip}`, 5, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, cohort, contact, message } = body;

    if (!name || !cohort) {
      return NextResponse.json(
        { error: 'Name and cohort are required.' },
        { status: 400 }
      );
    }

    // Try to find if user is in WhitelistRoster
    // Fuzzy match could be tricky in SQLite depending on collations, but let's try a simple exact or case-insensitive match if possible.
    // For now we'll do an exact match or use Prisma's `contains` if applicable, but exact `name` and `graduationClass` is safest.
    const whitelistEntry = await prisma.whitelistRoster.findFirst({
      where: {
        name: name.trim(),
        // We assume cohort maps to graduationClass
        graduationClass: cohort.trim(),
      },
    });

    // Create the User record
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        contact: contact?.trim() || null,
        // message is mapped to identityCode for now, or just ignored if not in DB schema
        identityCode: message?.trim() || null,
        role: whitelistEntry ? 'ALUMNI' : 'GUEST',
        status: whitelistEntry ? 'VERIFIED' : 'PENDING',
      },
    });

    return NextResponse.json(
      {
        message: 'Join request processed successfully',
        user: {
          id: user.id,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 }
    );
  }
}