'use client';

import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

export function AdminPagination({
  page,
  total,
  pageSize,
  disabled = false,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useThemeAndLocale();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-brand-fg/60">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-h-11 rounded-btn border border-line bg-surface/50 px-4 text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('admin.pagination.previous')}
      </button>
      <span>
        {t('admin.pagination.page')} {page} {t('admin.pagination.of')} {totalPages}{t('admin.pagination.pageSuffix')}
        {' · '}{t('admin.pagination.total')} {total} {t('admin.pagination.items')}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="min-h-11 rounded-btn border border-line bg-surface/50 px-4 text-brand disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('admin.pagination.next')}
      </button>
    </div>
  );
}
