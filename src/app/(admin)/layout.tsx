'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Award, BadgeCheck, BarChart3, Users, Newspaper, CalendarDays, BookUser, FileEdit, Images, Home, KeyRound, Menu, X, LogOut, Feather, User } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { useAuth } from '@/components/AuthProvider';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';
import ThemeAndLocaleSwitcher from '@/components/ThemeAndLocaleSwitcher';

type NavItem = { href: string; labelKey: string; icon: typeof Award; exact?: boolean };
type NavSection = { headingKey: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    headingKey: 'admin.shell.overview',
    items: [{ href: '/admin', labelKey: 'admin.shell.dashboard', icon: BarChart3, exact: true }],
  },
  {
    headingKey: 'admin.shell.membership',
    items: [
      { href: '/admin/registration-policy', labelKey: 'admin.shell.registrationPolicy', icon: KeyRound },
      { href: '/admin/users', labelKey: 'admin.shell.userReview', icon: Users },
      { href: '/admin/identity-verifications', labelKey: 'admin.shell.identityVerification', icon: BadgeCheck },
      { href: '/admin/alumni-corrections', labelKey: 'admin.shell.corrections', icon: FileEdit },
      { href: '/admin/alumni', labelKey: 'admin.shell.alumni', icon: BookUser },
    ],
  },
  {
    headingKey: 'admin.shell.contentOperations',
    items: [
      { href: '/admin/stories/pending', labelKey: 'admin.shell.storyReview', icon: Feather },
      { href: '/admin/stories', labelKey: 'admin.shell.stories', icon: Feather },
      { href: '/admin/news', labelKey: 'admin.shell.news', icon: Newspaper },
      { href: '/admin/events', labelKey: 'admin.shell.events', icon: CalendarDays },
      { href: '/admin/achievements', labelKey: 'admin.shell.achievements', icon: Award },
      { href: '/admin/memories', labelKey: 'admin.shell.memories', icon: Images },
    ],
  },
  {
    headingKey: 'admin.shell.siteAndGovernance',
    items: [
      { href: '/admin/content', labelKey: 'admin.shell.pageContent', icon: FileEdit },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user: currentUser } = useAuth();
  const { t } = useThemeAndLocale();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }, [router]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    const prevOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      sidebarRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [closeSidebar, sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-app">
      {/* Mobile Sidebar overlay / backdrop (Z-index: 40) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Z-index: 50) */}
      <aside
        ref={sidebarRef}
        role={isDesktop ? 'complementary' : 'dialog'}
        aria-modal={isDesktop ? undefined : true}
        aria-hidden={!isDesktop && !sidebarOpen}
        inert={!isDesktop && !sidebarOpen ? true : undefined}
        aria-label={t('admin.shell.navigation')}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[100dvh] w-80 max-w-[88vw] flex-col border-r border-line bg-surface-strong/95 pb-safe pt-safe shadow-xl backdrop-blur-2xl transition-transform duration-300 md:w-64 md:max-w-none md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-6 md:py-5">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-brand-fg font-heading">
              {t('admin.shell.title')}
            </h1>
            <p className="mt-1 text-xs text-brand-fg/60">{t('admin.shell.controlCenter')}</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-fg/50 hover:bg-brand/10 hover:text-brand-fg md:hidden cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label={t('admin.shell.closeSidebar')}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.headingKey} className={cn(idx > 0 && 'mt-5')}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand/60">
                {t(section.headingKey)}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeSidebar}
                      className={cn(
                        'relative flex min-h-[44px] items-center gap-3 rounded-xl py-3 pr-3 text-sm transition cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                        active
                          ? 'bg-brand/15 pl-5 font-bold text-brand shadow-sm'
                          : 'pl-3 text-brand-fg/70 hover:bg-brand/10 hover:text-brand',
                      )}
                    >
                      {active && (
                        <span className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand" />
                      )}
                      <item.icon
                        size={18}
                        className={active ? 'shrink-0 text-brand' : 'shrink-0 text-brand/70'}
                      />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-brand-fg/50 transition hover:bg-danger/10 hover:text-danger cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LogOut size={18} className="shrink-0" />
            {t('admin.shell.logout')}
          </button>
          <p className="mt-1 px-3 text-center text-[10px] text-brand-fg/30">{t('admin.shell.version')}</p>
        </div>
      </aside>

      {/* Right-side content wrapper */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64">
        {/* Admin Header (Z-index: 30) */}
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-strong/85 px-4 py-3 backdrop-blur-md sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brand/20 bg-brand/5 text-brand cursor-pointer touch-manipulation transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:hidden"
              aria-label={t('admin.shell.openSidebar')}
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <AdminBreadcrumb />
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <ThemeAndLocaleSwitcher />
            {/* User Profile info */}
            <div className="hidden items-center gap-2.5 rounded-full border border-line bg-surface-strong/40 py-1 pl-1.5 pr-3 text-xs md:flex md:text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-brand shadow-inner">
                <User size={14} />
              </div>
              <div className="flex items-center gap-1.5 font-medium text-brand-fg">
                <span>{currentUser?.name || currentUser?.username || t('admin.shell.administrator')}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
              </div>
            </div>

            {/* Quick home button */}
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface/30 px-3 py-2 text-xs font-semibold text-brand transition hover:border-brand/50 hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface touch-manipulation sm:px-4"
              aria-label={t('admin.shell.frontHomeLabel')}
            >
              <Home size={14} />
              <span className="hidden sm:inline">{t('admin.shell.frontHome')}</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main" className="min-w-0 max-w-full flex-1 p-4 md:p-8">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="mt-auto py-6 border-t border-line text-center">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-fg/30 transition hover:text-brand-fg/60 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            粤ICP备2026024784号-2
          </a>
        </footer>
      </div>
    </div>
  );
}
