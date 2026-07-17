'use client';

import { useEffect, useMemo, useState } from 'react';
import { Newspaper, Plus, Edit2, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useAdminLocalize } from '@/components/admin/AdminLocalizedText';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

const PAGE_SIZE = 20;

type NewsItem = {
  id: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
};

const statusLabel: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布' };

export default function AdminNewsPage() {
  const localize = useAdminLocalize();
  const { locale } = useThemeAndLocale();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsItem | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const deleteDialogRef = useDialogA11y(!!confirmDelete, () => {
    if (!deleting) setConfirmDelete(null);
  });

  const filteredNews = useMemo(() => {
    if (!search.trim()) return news;
    const q = search.trim().toLowerCase();
    return news.filter((item) => item.title.toLowerCase().includes(q));
  }, [news, search]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNews(data.news || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/news/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || localize('删除失败'));
      }
      setNews((prev) => prev.filter((n) => n.id !== confirmDelete.id));
      setTotal((current) => Math.max(0, current - 1));
      toast.success(localize('新闻已删除'));
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(`${localize('删除失败')}: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'border-line text-main/60 bg-surface/60',
      PUBLISHED: 'border-success/25 text-success bg-success/10',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {localize(statusLabel[s] || s)}
      </span>
    );
  };

  const filters = ['ALL', 'DRAFT', 'PUBLISHED'];

  return (
    <AdminPageShell
      title="新闻管理"
      description="发布、编辑并运营母港新闻与公告记录"
      actions={
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 rounded-btn border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10 cursor-pointer"
        >
          <Plus size={16} />
          {localize('发布新闻')}
        </Link>
      }
    >
      <div className="space-y-4">

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                statusFilter === f
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'border-line text-main/60 hover:border-brand/30'
              }`}
            >
              {localize(f === 'ALL' ? '全部' : statusLabel[f])}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <label htmlFor="search-input" className="sr-only">{localize('搜索新闻标题')}</label>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-main/40" />
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={localize('搜索新闻标题...')}
            className="input w-48 py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-brand-fg/45">
        {localize('当前筛选')}: {localize(statusLabel[statusFilter] || '全部')} · {localize('显示')} {filteredNews.length} {localize('条')}
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-main/60">{localize('加载中...')}</div>
      ) : filteredNews.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={localize(search.trim() ? '未找到匹配的新闻' : '暂无新闻记录')}
          description={localize('点击右上角“发布新闻”来新增第一条记录')}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-surface/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand/10 text-main/60">
              <tr>
                <th className="px-4 py-3 font-medium">{localize('标题')}</th>
                <th className="px-4 py-3 font-medium">{localize('状态')}</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">{localize('更新时间')}</th>
                <th className="px-4 py-3 font-medium">{localize('操作')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/5">
              {filteredNews.map((item) => (
                <tr key={item.id} className="text-main/70 transition hover:bg-brand/5">
                  <td className="px-4 py-3 font-medium text-main">{item.title}</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{new Date(item.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/news/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-1 text-xs text-brand transition hover:bg-brand/10 cursor-pointer min-h-[32px]"
                      >
                        <Edit2 size={14} />
                        {localize('编辑')}
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-danger/25 bg-danger/10 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/20 cursor-pointer min-h-[32px]"
                      >
                        <Trash2 size={14} />
                        {localize('删除')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} disabled={loading} onPageChange={setPage} />
      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div 
          ref={deleteDialogRef}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-main font-heading">{localize('确认删除')}</h3>
            <p className="mt-3 text-sm leading-6 text-main/70">
              {locale === 'en' ? `Delete news item “${confirmDelete.title}”? This action cannot be undone.` : `确定删除新闻《${confirmDelete.title}》吗？此操作不可撤销。`}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => { setConfirmDelete(null); setDeleting(null); }}
                disabled={!!deleting}
                className="w-full sm:w-auto min-h-[44px] rounded-btn border border-line bg-surface/50 px-4 py-2 text-sm text-main/70 transition hover:bg-brand/5 hover:text-brand cursor-pointer"
              >
                {localize('取消')}
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-btn border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger transition hover:bg-danger/20 cursor-pointer disabled:opacity-50"
              >
                {localize(deleting ? '删除中...' : '确认删除')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
