import { BarChart3, Users, FileText, TrendingUp, Newspaper, CalendarDays, Plus } from 'lucide-react';
import prisma from '@/lib/db';
import { getCachedOrFetch } from '@/lib/cache';

async function getStats() {
  return getCachedOrFetch('admin:stats', 60, async () => {
    try {
      const [pendingUsers, pendingPosts, totalAlumni] = await Promise.all([
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.post.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'ALUMNI' } }),
      ]);
      return { pendingUsers, pendingPosts, totalAlumni };
    } catch {
      return { pendingUsers: 0, pendingPosts: 0, totalAlumni: 0 };
    }
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: '待审核用户',
      value: stats.pendingUsers,
      icon: Users,
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
    <div>
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 size={28} className="text-[#7C3AED]" />
        <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">控制面板</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`cosmic-card rounded-2xl border ${card.border} ${card.bg} p-6 transition hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4C1D95]/60">{card.label}</p>
              <card.icon size={22} className={card.color} />
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-[#4C1D95] font-heading">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[#7C3AED]/15 bg-white/50 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-[#4C1D95] font-heading">快速操作</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/users?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 transition hover:bg-amber-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Users size={16} />
            查看待审核用户
          </a>
          <a href="/admin/posts?status=PENDING"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <FileText size={16} />
            查看待审核内容
          </a>
          <a href="/admin/news"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Newspaper size={16} />
            新闻管理
          </a>
          <a href="/admin/news/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Plus size={16} />
            发布新闻
          </a>
          <a href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <CalendarDays size={16} />
            活动管理
          </a>
          <a href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Plus size={16} />
            创建活动
          </a>
        </div>
      </div>
    </div>
  );
}
