'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Edit2, Users, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

type EventItem = {
  id: string;
  title: string;
  location: string | null;
  eventDate: string;
  status: string;
  _count: { registrations: number };
};

const statusLabel: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布' };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EventItem | null>(null);

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.trim().toLowerCase();
    return events.filter((item) => item.title.toLowerCase().includes(q) || (item.location || '').toLowerCase().includes(q));
  }, [events, search]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/events${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(data.events || []);
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
      const res = await fetch(`/api/admin/events/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }
      setEvents((prev) => prev.filter((e) => e.id !== confirmDelete.id));
      toast.success('活动已删除');
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error('删除失败: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'border-gray-200 text-gray-600 bg-gray-50',
      PUBLISHED: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {statusLabel[s] || s}
      </span>
    );
  };

  const filters = ['ALL', 'DRAFT', 'PUBLISHED'];

  return (
    <AdminPageShell
      title="活动管理"
      description="创建、发布并运营校友活动记录"
      actions={
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-btn border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
        >
          <Plus size={16} />
          创建活动
        </Link>
      }
    >
      <div className="space-y-4">

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                statusFilter === f
                  ? 'border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]'
                  : 'border-gray-200 text-[#4C1D95]/60 hover:border-[#7C3AED]/30'
              }`}
            >
              {f === 'ALL' ? '全部' : statusLabel[f]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <label htmlFor="search-input" className="sr-only">搜索活动标题或地点</label>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C1D95]/40" />
          <input
            id="search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题或地点..."
            className="input w-48 py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="暂无活动记录"
          description="点击右上角“创建活动”来新增第一条记录"
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="未找到匹配的活动"
          description="可以尝试调整您的搜索关键词"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">地点</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">活动时间</th>
                <th className="px-4 py-3 font-medium">报名</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {filteredEvents.map((item) => (
                <tr key={item.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{item.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{item.location || '-'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {new Date(item.eventDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-[#4C1D95]/60">
                      <Users size={14} />
                      {item._count?.registrations ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/events/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-2.5 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer min-h-[32px]"
                      >
                        <Edit2 size={14} />
                        编辑
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-600 transition hover:bg-rose-100 cursor-pointer min-h-[32px]"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h3 id="delete-confirm-title" className="text-lg font-semibold text-[#4C1D95] font-heading">确认删除</h3>
            <p className="mt-3 text-sm leading-6 text-[#4C1D95]/70">
              确定删除活动《{confirmDelete.title}》吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => { setConfirmDelete(null); setDeleting(null); }}
                disabled={!!deleting}
                className="w-full sm:w-auto min-h-[44px] rounded-btn border border-line bg-surface/50 px-4 py-2 text-sm text-[#4C1D95]/70 transition hover:bg-brand/5 hover:text-brand cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-btn border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 transition hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
