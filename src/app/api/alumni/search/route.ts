import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireVerifiedAlumni } from '@/lib/admin-auth';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const rows = await prisma.whitelistRoster.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { graduationClass: { contains: q } },
          { city: { contains: q } },
          { university: { contains: q } },
          { major: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        graduationClass: true,
        className: true,
        city: true,
        university: true,
        major: true,
        industry: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    const results = rows.map((r) => ({
      id: r.id,
      name: r.name,
      graduationClass: r.graduationClass || '',
      className: r.className || '',
      university: r.university || '',
      major: r.major || '',
      city: r.city || '',
      industry: r.industry || '',
    }));

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Alumni search error:', error);
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 });
  }
}
