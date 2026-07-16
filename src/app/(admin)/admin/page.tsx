import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

async function getStats() {
  return getCachedOrFetch('admin:stats', 60, async () => {
    try {
      const [
        pendingUsers,
        pendingStories,
        pendingCorrections,
        pendingIdentityVerifications,
        totalAlumni,
        recentAuditLogs,
      ] = await Promise.all([
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
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            action: true,
            targetType: true,
            createdAt: true,
            admin: { select: { name: true, username: true } },
          },
        }),
      ]);
      return {
        pendingUsers,
        pendingStories,
        pendingCorrections,
        pendingIdentityVerifications,
        totalAlumni,
        recentAuditLogs: recentAuditLogs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        })),
      };
    } catch {
      return {
        pendingUsers: 0,
        pendingStories: 0,
        pendingCorrections: 0,
        pendingIdentityVerifications: 0,
        totalAlumni: 0,
        recentAuditLogs: [],
      };
    }
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <AdminDashboardClient stats={stats} />;
}
