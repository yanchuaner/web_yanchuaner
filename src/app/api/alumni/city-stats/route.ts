import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireVerifiedAlumni } from '@/lib/admin-auth';
import { getCityCoords } from '@/data/cityCoordinates';
import { parseTags } from '@/lib/tags';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireVerifiedAlumni(req);
  if (auth) return auth;

  try {
    const records = await prisma.whitelistRoster.findMany({
      select: {
        name: true,
        graduationClass: true,
        tags: true,
        city: true,
        university: true,
        major: true,
      },
      orderBy: { name: 'asc' },
    });

    const cityMap = new Map<string, {
      count: number;
      universities: Set<string>;
      majors: Set<string>;
      classes: Set<string>;
      members: Array<{
        name: string;
        university: string;
        major: string;
        graduationClass: string;
      }>;
    }>();
    let uncounted = 0;

    for (const r of records) {
      let city = r.city || null;
      let university = r.university || null;
      let major = r.major || null;

      if (!city || !university || !major) {
        const parsed = parseTags(r.tags);
        if (!city) city = parsed.city;
        if (!university) university = parsed.university;
        if (!major) major = parsed.major;
      }

      if (!city) { uncounted++; continue; }

      const coords = getCityCoords(city);
      if (!coords) { uncounted++; continue; }

      if (!cityMap.has(city)) {
        cityMap.set(city, {
          count: 0,
          universities: new Set(),
          majors: new Set(),
          classes: new Set(),
          members: [],
        });
      }
      const entry = cityMap.get(city)!;
      entry.count++;
      if (university) entry.universities.add(university);
      if (major) entry.majors.add(major);
      if (r.graduationClass) entry.classes.add(r.graduationClass);
      entry.members.push({
        name: r.name,
        university,
        major,
        graduationClass: r.graduationClass || '',
      });
    }

    const allUniversities = new Set<string>();
    const allMajors = new Set<string>();

    const cities = Array.from(cityMap.entries())
      .map(([city, entry]) => {
        entry.universities.forEach(u => allUniversities.add(u));
        entry.majors.forEach(m => allMajors.add(m));
        const coords = getCityCoords(city)!;
        return {
          city,
          count: entry.count,
          lat: coords.lat,
          lng: coords.lng,
          universities: Array.from(entry.universities).sort(),
          majors: Array.from(entry.majors).sort(),
          classes: Array.from(entry.classes).sort(),
          members: entry.members,
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalCities: cities.length,
      totalAlumni: cities.reduce((s, c) => s + c.count, 0),
      totalUniversities: allUniversities.size,
      totalMajors: allMajors.size,
      cities,
      uncounted,
    });
  } catch (error) {
    console.error('City stats error:', error);
    return NextResponse.json({ error: 'Failed to load city stats' }, { status: 500 });
  }
}
