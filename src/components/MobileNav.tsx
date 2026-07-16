'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  GalleryVerticalEnd,
  FileEdit,
  MessageSquareText,
  Radar,
  Newspaper,
  School,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Mail,
  Network,
  ShieldCheck,
  IdCard,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/components/AuthProvider';

import { useThemeAndLocale } from './ThemeAndLocaleProvider';

type NavLeaf = { href: string; labelKey: string; icon: LucideIcon; descKey?: string };
type NavGroup = { labelKey: string; items: NavLeaf[] };

/**
 * 导航信息架构：12 个平铺入口按用户心智聚合为 4 组。
 * 注意：仅重组「呈现与分组」，所有 href 保持原有 URL 不变。
 */
const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'nav.alumniSpace',
    items: [
      { href: '/alumni/radar', labelKey: 'nav.directory', icon: Radar, descKey: 'nav.directoryDesc' },
      { href: '/alumni/certificate', labelKey: 'nav.certificate', icon: IdCard, descKey: 'nav.certificateDesc' },
      { href: '/alumni/correction', labelKey: 'nav.correction', icon: FileEdit, descKey: 'nav.correctionDesc' },
      { href: '/alumni/achievements', labelKey: 'nav.achievements', icon: Award, descKey: 'nav.achievementsDesc' },
      { href: '/alumni/stories', labelKey: 'nav.stories', icon: MessageSquareText, descKey: 'nav.storiesDesc' },
      { href: '/alumni/memories', labelKey: 'nav.memories', icon: GalleryVerticalEnd, descKey: 'nav.memoriesDesc' },
    ],
  },
  {
    labelKey: 'nav.campusNews',
    items: [
      { href: '/news', labelKey: 'nav.news', icon: Newspaper, descKey: 'nav.newsDesc' },
      { href: '/events', labelKey: 'nav.events', icon: CalendarDays, descKey: 'nav.eventsDesc' },
    ],
  },
  {
    labelKey: 'nav.resources',
    items: [
      { href: '/students', labelKey: 'nav.students', icon: BookOpen, descKey: 'nav.studentsDesc' },
      { href: '/teachers', labelKey: 'nav.teachers', icon: GraduationCap, descKey: 'nav.teachersDesc' },
    ],
  },
  {
    labelKey: 'nav.aboutGroup',
    items: [
      { href: '/ecosystem', labelKey: 'nav.ecosystem', icon: Network, descKey: 'nav.ecosystemDesc' },
      { href: '/privacy', labelKey: 'nav.privacy', icon: ShieldCheck, descKey: 'nav.privacyDesc' },
      { href: '/about', labelKey: 'nav.about', icon: School, descKey: 'nav.aboutDesc' },
      { href: '/contact', labelKey: 'nav.contact', icon: Mail, descKey: 'nav.contactDesc' },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActive(pathname, item.href));
}

const JOIN_CTA =
  'inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-contrast shadow-sm transition-all touch-manipulation hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted';

export default function MobileNav() {
  const { user, isLoggedIn, logout } = useAuth();
  const { t, locale } = useThemeAndLocale();
  const pathname = usePathname() || '/';
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc 关闭抽屉 + Tab 焦点锁定
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      drawerRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  // 路由切换自动关闭抽屉与下拉
  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // 桌面下拉：点击外部 / Esc 关闭
  useEffect(() => {
    if (!openGroup) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openGroup]);

  // 抽屉打开时禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* ── 桌面端：Mega Menu 下拉 + CTA ───────────────── */}
      <nav
        ref={navRef}
        className="ml-6 hidden flex-1 items-center justify-end gap-1 xl:flex"
        role="navigation"
        aria-label={locale === 'zh' ? '主导航' : 'Primary navigation'}
      >
        {NAV_GROUPS.map((group) => {
          const active = groupIsActive(pathname, group);
          const expanded = openGroup === group.labelKey;
          return (
            <div
              key={group.labelKey}
              className="relative"
              onMouseEnter={() => setOpenGroup(group.labelKey)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup="true"
                onClick={() => setOpenGroup(expanded ? null : group.labelKey)}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted',
                  active ? 'bg-brand/10 text-brand' : 'text-brand-fg/70 hover:text-brand',
                )}
              >
                {t(group.labelKey)}
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', expanded && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              {expanded ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 w-72 pt-2"
                >
                  <div className="overflow-hidden rounded-modal border border-line bg-surface/95 p-2 shadow-lg backdrop-blur-xl">
                    {group.items.map(({ href, labelKey, icon: Icon, descKey }) => {
                      const itemActive = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          aria-current={itemActive ? 'page' : undefined}
                          className={cn(
                            'flex min-h-[44px] items-start gap-3 rounded-xl px-3 py-2.5 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            itemActive ? 'bg-brand/10' : 'hover:bg-brand/5',
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn('mt-0.5 shrink-0', itemActive ? 'text-brand' : 'text-brand/70')}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className={cn('block text-sm font-medium', itemActive ? 'text-brand' : 'text-brand-fg')}>
                              {t(labelKey)}
                            </span>
                            {descKey ? (
                              <span className="mt-0.5 block text-xs text-brand-fg/50">{t(descKey)}</span>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {isLoggedIn ? (
          <>
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="ml-2 text-sm font-medium text-brand">
                {t('nav.admin')}
              </Link>
            ) : null}
            <Link href="/me" className={cn(JOIN_CTA, 'ml-2')}>
              {user?.username || user?.name || t('nav.me')}
            </Link>
            {!isAdminPath ? (
              <button type="button" onClick={() => void logout()} className="ml-2 text-sm text-brand">
                {t('nav.logout')}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <Link href="/login" className="ml-2 text-sm text-brand">{t('nav.login')}</Link>
            <Link href="/register" className={cn(JOIN_CTA, 'ml-2')}>{t('nav.register')}</Link>
          </>
        )}
      </nav>

      {/* ── 移动端：汉堡按钮 ──────────────────────────── */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={
          open
            ? locale === 'zh' ? '关闭导航菜单' : 'Close navigation menu'
            : locale === 'zh' ? '打开导航菜单' : 'Open navigation menu'
        }
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="mobile-drawer"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand xl:hidden cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted"
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* ── 移动端：分组抽屉 ──────────────────────────── */}
      {open && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[60] bg-overlay/80 backdrop-blur-sm xl:hidden animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.brand')}
            className="fixed right-0 top-0 z-[60] flex h-[100dvh] w-80 max-w-[88vw] flex-col border-l border-brand/15 bg-surface/95 p-5 pb-safe pt-safe backdrop-blur-xl shadow-2xl xl:hidden animate-slide-in"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand font-heading">{t('nav.brand')}</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label={locale === 'zh' ? '关闭导航菜单' : 'Close menu'}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-fg/60 hover:bg-brand/10 hover:text-brand-fg cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex-1 space-y-4 overflow-y-auto pr-1"
              role="navigation"
              aria-label={locale === 'zh' ? '移动端导航' : 'Mobile navigation'}
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.labelKey}>
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-brand-fg/40">
                    {t(group.labelKey)}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(({ href, labelKey, icon: Icon }) => {
                      const itemActive = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={itemActive ? 'page' : undefined}
                          onClick={() => {
                            setOpen(false);
                            toggleRef.current?.focus();
                          }}
                          className={cn(
                            'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            itemActive
                              ? 'bg-brand/10 text-brand font-semibold'
                              : 'text-brand-fg/80 hover:bg-brand/5 hover:text-brand',
                          )}
                        >
                          <Icon
                            size={18}
                            className={itemActive ? 'text-brand' : 'text-brand/60'}
                            aria-hidden="true"
                          />
                          {t(labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-4 border-t border-line pt-4 pb-safe">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {user?.role === "ADMIN" ? (
                    <Link href="/admin" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center justify-center text-sm font-medium text-brand touch-manipulation">
                      {t('nav.admin')}
                    </Link>
                  ) : null}
                  <Link href="/me" onClick={() => setOpen(false)} className={cn(JOIN_CTA, 'w-full')}>
                    {t('nav.me')}
                  </Link>
                  {!isAdminPath ? (
                    <button type="button" onClick={() => void logout()} className="flex min-h-[44px] w-full items-center justify-center text-sm text-brand touch-manipulation">
                      {t('nav.logout')}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center justify-center text-sm text-brand touch-manipulation">
                    {t('nav.login')}
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className={cn(JOIN_CTA, 'w-full')}>
                    {t('nav.register')}
                  </Link>
                </div>
              )}
              <p className="mt-3 text-center text-xs text-brand-fg/40">
                {t('nav.brand')} · {locale === 'zh' ? '个人公益版' : 'Non-Profit Edition'}
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
