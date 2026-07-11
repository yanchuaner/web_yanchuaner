import Link from 'next/link';
import { Users, FileText, TrendingUp, Newspaper, CalendarDays, Plus, BadgeCheck, History } from 'lucide-react';
import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

async function getStats() {
  return getCachedOrFetch('admin:stats', 60, async () => {
    try {
      const [
        pendingUsers,
        pendingPosts,
        pendingStories,
        pendingCorrections,
        pendingClaims,
        pendingIdentityVerifications,
        totalAlumni,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.post.count({ where: { status: 'PENDING' } }),
        prisma.story.count({ where: { status: 'PENDING' } }),
        prisma.alumniCorrectionRequest.count({ where: { status: 'PENDING' } }),
        prisma.userClaimRequest.count({ where: { status: 'PENDING' } }),
        prisma.identityVerificationRequest.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'ALUMNI' } }),
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
        pendingPosts,
        pendingStories,
        pendingCorrections,
        pendingClaims,
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
        pendingPosts: 0,
        pendingStories: 0,
        pendingCorrections: 0,
        pendingClaims: 0,
        pendingIdentityVerifications: 0,
        totalAlumni: 0,
        recentAuditLogs: [],
      };
    }
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const pendingTotal =
    stats.pendingUsers +
    stats.pendingPosts +
    stats.pendingStories +
    stats.pendingCorrections +
    stats.pendingClaims +
    stats.pendingIdentityVerifications;

  const cards = [
    {
      label: '全部待处理',
      value: pendingTotal,
      icon: BadgeCheck,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: '待审核内容',
      value: stats.pendingPosts,
      icon: FileText,
      color: 'text-[#7C3AED]',
      bg: 'bg-[#7C3AED]/5',
      border: 'border-[#7C3AED]/20',
    },
    {
      label: '认证校友',
      value: stats.totalAlumni,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  return (
    <AdminPageShell title="控制面板" description="平台关键指标概览与快捷入口">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`cosmic-card rounded-card border ${card.border} ${card.bg} p-6 transition hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-fg/60">{card.label}</p>
              <card.icon size={22} className={card.color} />
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-brand-fg font-heading">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-brand/15 bg-surface/50 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-brand-fg font-heading">快速操作</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/users?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 transition hover:bg-amber-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Users size={16} />
            查看待审核用户
          </Link>
          <Link href="/admin/posts?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <FileText size={16} />
            查看待审核内容
          </Link>
          <Link href="/admin/identity-verifications"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <BadgeCheck size={16} />
            身份认证 {stats.pendingIdentityVerifications}
          </Link>
          <Link href="/admin/alumni-corrections?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <FileText size={16} />
            信息修正 {stats.pendingCorrections}
          </Link>
          <Link href="/admin/news"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Newspaper size={16} />
            新闻管理
          </Link>
          <Link href="/admin/news/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface/50 px-4 py-2.5 text-sm text-brand-fg/60 transition hover:border-brand/30 hover:text-brand cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus size={16} />
            发布新闻
          </Link>
          <Link href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <CalendarDays size={16} />
            活动管理
          </Link>
          <Link href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface/50 px-4 py-2.5 text-sm text-brand-fg/60 transition hover:border-brand/30 hover:text-brand cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus size={16} />
            创建活动
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-card border border-line bg-surface/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <History size={18} className="text-brand" />
          <h3 className="font-heading text-lg font-semibold text-brand-fg">最近管理操作</h3>
        </div>
        {stats.recentAuditLogs.length === 0 ? (
          <p className="mt-4 text-sm text-brand-fg/50">暂无审计记录</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {stats.recentAuditLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-brand-fg">{log.action}</span>
                  <span className="ml-2 text-brand-fg/50">{log.targetType}</span>
                </div>
                <div className="text-xs text-brand-fg/45">
                  {log.admin.name || log.admin.username || '管理员'} ·{' '}
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
