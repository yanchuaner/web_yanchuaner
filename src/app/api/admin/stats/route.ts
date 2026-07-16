import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  try {
    const [pendingUsers, pendingStories, pendingCorrections, pendingIdentityVerifications, totalAlumni] = await Promise.all([
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.story.count({ where: { status: 'PENDING' } }),
      prisma.alumniCorrectionRequest.count({ where: { status: 'PENDING' } }),
      prisma.identityVerificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({
        where: {
          role: 'ALUMNI',
          status: 'VERIFIED',
          verificationStatus: 'VERIFIED',
          emailVerified: { not: null },
          accountStatus: 'ACTIVE',
        },
      }),
    ]);

    return NextResponse.json({
      pendingUsers,
      pendingStories,
      pendingCorrections,
      pendingIdentityVerifications,
      totalAlumni,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      {
        error: '获取统计数据失败',
        pendingUsers: 0,
        pendingStories: 0,
        pendingCorrections: 0,
        pendingIdentityVerifications: 0,
        totalAlumni: 0,
      },
      { status: 500 },
    );
  }
}
