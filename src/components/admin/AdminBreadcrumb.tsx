'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

/**
 * 后台路由 → 中文标签映射。新增后台页时在此登记即可自动出现在面包屑中。
 * 仅用于「呈现」，不参与任何鉴权或路由跳转逻辑。
 */
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'admin.breadcrumb.dashboard',
  users: 'admin.shell.userReview',
  'registration-policy': 'admin.shell.registrationPolicy',
  'identity-verifications': 'admin.shell.identityVerification',
  posts: 'admin.shell.contentReview',
  news: 'admin.shell.news',
  events: 'admin.shell.events',
  stories: 'admin.shell.stories',
  achievements: 'admin.shell.achievements',
  memories: 'admin.shell.memories',
  teachers: 'admin.shell.teachers',
  content: 'admin.shell.pageContent',
  alumni: 'admin.shell.alumni',
  'alumni-corrections': 'admin.shell.corrections',
  registrations: 'admin.breadcrumb.registrations',
  pending: 'admin.breadcrumb.pending',
  new: 'admin.breadcrumb.new',
};

export function AdminBreadcrumb() {
  const { t } = useThemeAndLocale();
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean); // e.g. ['admin','news','new']

  // 累积路径，用于每一段的链接
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isId = !SEGMENT_LABELS[seg] && /^[0-9a-f-]{6,}$/i.test(seg);
    const label = SEGMENT_LABELS[seg] ? t(SEGMENT_LABELS[seg]) : isId ? t('admin.breadcrumb.details') : seg;
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <nav aria-label={t('admin.breadcrumb.label')} className="flex items-center gap-1.5 text-sm text-brand-fg/50">
      <Link href="/admin" className="inline-flex items-center gap-1 hover:text-brand transition-colors">
        <Home size={14} aria-hidden="true" />
        <span className="sr-only">{t('admin.breadcrumb.homeLabel')}</span>
      </Link>
      {crumbs.slice(1).map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1.5">
          <ChevronRight size={13} aria-hidden="true" className="text-brand-fg/30" />
          {c.isLast ? (
            <span className="font-medium text-brand-fg">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-brand transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
