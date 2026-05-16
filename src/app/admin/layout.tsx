import Link from 'next/link';
import { BarChart3, Users, FileText, Newspaper, CalendarDays, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/admin', label: '控制面板', icon: BarChart3 },
    { href: '/admin/users', label: '用户审核', icon: Users },
    { href: '/admin/posts', label: '内容审核', icon: FileText },
    { href: '/admin/news', label: '新闻管理', icon: Newspaper },
    { href: '/admin/events', label: '活动管理', icon: CalendarDays },
    { href: '/', label: '返回母港', icon: Home },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-cyan-300/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="border-b border-cyan-300/10 px-6 py-5">
          <h1 className="text-lg font-bold tracking-wide text-cyan-200">
            燕川数字母港
          </h1>
          <p className="mt-1 text-xs text-slate-300">控制中心</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
            >
              <item.icon size={18} className="shrink-0 text-cyan-400/70" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-cyan-300/10 px-6 py-4">
          <p className="text-xs text-slate-300">Aerospace Alumni v0.1</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
