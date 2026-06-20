import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';
import { requireVerifiedAlumni } from '@/lib/admin-auth';
import { parseTags } from '@/lib/tags';

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;
  try {
    const data = await getCachedOrFetch('api:alumni:map', 300, async () => {
      const records = await prisma.whitelistRoster.findMany({
        select: { name: true, graduationClass: true, tags: true },
        orderBy: { name: 'asc' },
      });

      const alumni = records.map((r) => {
        const { city } = parseTags(r.tags);
        return {
          name: r.name,
          graduationClass: r.graduationClass,
          city: city || '未知',
        };
      });

      return { alumni, total: alumni.length };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Map data error:', error);
    return NextResponse.json({ error: 'Failed to load map data', alumni: [] }, { status: 500 });
  }
}
