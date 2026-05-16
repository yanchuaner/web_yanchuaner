'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X, GalleryVerticalEnd, MessageSquareText, Radar, Newspaper, School, CalendarDays, GraduationCap, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/alumni/radar', label: '星空通讯录', icon: Radar },
  { href: '/alumni/stories', label: '燕川故事', icon: MessageSquareText },
  { href: '/alumni/memories', label: '燕中记忆', icon: GalleryVerticalEnd },
  { href: '/news', label: '新闻公告', icon: Newspaper },
  { href: '/events', label: '校友活动', icon: CalendarDays },
  { href: '/teachers', label: '教师频道', icon: GraduationCap },
  { href: '/students', label: '在校生', icon: BookOpen },
  { href: '/about', label: '学校介绍', icon: School },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Esc 关闭 + Tab 焦点锁定
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

  // 禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-0.5 md:flex" role="navigation" aria-label="主导航">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} aria-label={`导航 ${label}`} tabIndex={0}
            className="group relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-[#4C1D95]/70 transition-colors hover:text-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF]">
            <Icon size={14} className="transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="relative font-medium tracking-wide">
              {label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        ))}
      </nav>

      <button ref={toggleRef} onClick={() => setOpen(!open)}
        aria-label={open ? "关闭导航菜单" : "打开导航菜单"} aria-expanded={open} aria-controls="mobile-drawer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED] md:hidden cursor-pointer">
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-[#4C1D95]/20 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)} aria-hidden="true" />
          <div id="mobile-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label="导航菜单"
            className="fixed right-0 top-0 z-50 h-full w-64 border-l border-[#7C3AED]/15 bg-white/95 p-6 backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-[#7C3AED] font-heading">导航菜单</p>
              <button onClick={() => { setOpen(false); toggleRef.current?.focus(); }}
                aria-label="关闭导航菜单" className="text-[#4C1D95]/50 hover:text-[#4C1D95] cursor-pointer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="space-y-1" role="navigation" aria-label="移动端导航">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={label} href={href}
                  onClick={() => { setOpen(false); toggleRef.current?.focus(); }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] cursor-pointer">
                  <Icon size={18} className="text-[#7C3AED]/60" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
