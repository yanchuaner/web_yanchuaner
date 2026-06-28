'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileEdit,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

type CorrectionRequest = {
  id: string;
  rosterId: string;
  currentName: string | null;
  currentGraduationClass: string | null;
  currentClassName: string | null;
  requestedName: string | null;
  requestedGraduationClass: string | null;
  requestedClassName: string | null;
  contact: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已驳回' },
] as const;

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
};

const PAGE_SIZE = 20;

export default function AdminAlumniCorrectionsPage() {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // 展开详情
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 审核操作
  const [actionTarget, setActionTarget] = useState<CorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/admin/alumni-corrections?${params}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/admin/alumni-corrections/${actionTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, adminNote: adminNote.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');
      setActionTarget(null);
      setActionType(null);
      setAdminNote('');
      toast.success(actionType === 'approve' ? '申请已批准，名单已自动更新' : '申请已驳回');
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminPageShell
      title="信息修改申请"
      description={`共 ${total} 条申请`}
    >
      <div className="space-y-4">
        {/* 状态筛选 */}
        <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`min-h-[44px] cursor-pointer rounded-xl border px-4 py-2 text-sm transition touch-manipulation ${
              statusFilter === tab.key
                ? 'border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED]'
                : 'border-[#7C3AED]/10 text-[#4C1D95]/50 hover:bg-[#7C3AED]/5 hover:text-[#4C1D95]/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>

      {/* 搜索 */}
      <div className="relative">
        <label htmlFor="search-input" className="sr-only">搜索姓名、联系方式</label>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C3AED]/40"
        />
        <input
          id="search-input"
          type="text"
          placeholder="搜索姓名、联系方式..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input w-full pl-9"
        />
      </div>

        {/* 列表 */}
        <div className="hidden overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/60 backdrop-blur-xl md:block">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#7C3AED]/40" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-rose-600">
            <AlertTriangle size={16} />
            {error}
            <button type="button" onClick={fetchRequests} className="ml-2 underline cursor-pointer">
              重试
            </button>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title={search || statusFilter ? '未找到匹配的申请' : '暂无修改申请'}
            description="校友数据更新后将在此处统一管理与审核"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#7C3AED]/10 text-left text-xs text-[#4C1D95]/50">
                  <th className="w-8 px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">联系方式</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">提交时间</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const badge = STATUS_BADGE[req.status];
                  const BadgeIcon = badge.icon;
                  const isExpanded = expandedId === req.id;
                  return (
                    <tr key={req.id} className="group">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          aria-label={isExpanded ? '收起详情' : '展开详情'}
                          aria-expanded={isExpanded}
                          aria-controls={`detail-${req.id}`}
                          className="cursor-pointer rounded p-0.5 text-[#7C3AED]/30 transition hover:text-[#7C3AED] min-h-[32px] min-w-[32px] flex items-center justify-center"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#4C1D95]">
                        {req.currentName || '未知'}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-[#4C1D95]/60 hidden sm:table-cell">
                        {req.contact}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}
                        >
                          <BadgeIcon size={12} />
                          {req.status === 'PENDING'
                            ? '待审核'
                            : req.status === 'APPROVED'
                              ? '已通过'
                              : '已驳回'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#4C1D95]/40 hidden md:table-cell">
                        {new Date(req.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-[#7C3AED]/10 bg-white/60 px-4 py-10 text-center text-sm text-[#4C1D95]/50 backdrop-blur-xl">
              <Loader2 size={20} className="mx-auto mb-2 animate-spin text-[#7C3AED]/40" />
              正在加载修改申请...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p>{error}</p>
                  <button type="button" onClick={fetchRequests} className="mt-2 min-h-[44px] underline">
                    重试
                  </button>
                </div>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileEdit}
              title={search || statusFilter ? '未找到匹配的申请' : '暂无修改申请'}
              description="校友数据更新后将在此处统一管理与审核"
            />
          ) : (
            requests.map((req) => {
              const badge = STATUS_BADGE[req.status];
              const BadgeIcon = badge.icon;
              const isExpanded = expandedId === req.id;
              const fields: { label: string; current: string | null; requested: string | null }[] = [
                { label: '姓名', current: req.currentName, requested: req.requestedName },
                { label: '届别', current: req.currentGraduationClass, requested: req.requestedGraduationClass },
                { label: '班级', current: req.currentClassName, requested: req.requestedClassName },
              ];

              return (
                <div key={req.id} className="rounded-2xl border border-[#7C3AED]/10 bg-white/70 p-4 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#4C1D95]">{req.currentName || '未知'}</p>
                      <p className="mt-1 text-xs text-[#4C1D95]/50">{req.contact}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}>
                      <BadgeIcon size={12} />
                      {req.status === 'PENDING' ? '待审核' : req.status === 'APPROVED' ? '已通过' : '已驳回'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    {fields.map((f) => (
                      <div key={f.label} className="rounded-xl border border-[#7C3AED]/10 bg-[#FAF5FF] p-3">
                        <p className="text-[11px] text-[#4C1D95]/40">{f.label}</p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-white/70 px-2.5 py-2 text-[#4C1D95]/65">{f.current || '-'}</div>
                          <div className="rounded-lg bg-emerald-50 px-2.5 py-2 text-emerald-800">{f.requested || '（不修改）'}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`detail-${req.id}`}
                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[#7C3AED] touch-manipulation"
                  >
                    {isExpanded ? '收起详情' : '展开详情'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded ? (
                    <div id={`detail-${req.id}`} className="mt-3 space-y-3 border-t border-[#7C3AED]/10 pt-3">
                      <div>
                        <p className="text-xs text-[#4C1D95]/40">修改说明</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#4C1D95]/80">{req.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4C1D95]/40">提交时间</p>
                        <p className="text-sm text-[#4C1D95]/60">{new Date(req.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                      {req.adminNote ? (
                        <div>
                          <p className="text-xs text-[#4C1D95]/40">管理员备注</p>
                          <p className="text-sm text-[#4C1D95]/80">{req.adminNote}</p>
                        </div>
                      ) : null}
                      {req.status === 'PENDING' ? (
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActionTarget(req);
                              setActionType('approve');
                              setAdminNote('');
                              setActionError('');
                            }}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 touch-manipulation"
                          >
                            <CheckCircle2 size={16} />
                            通过并应用
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionTarget(req);
                              setActionType('reject');
                              setAdminNote('');
                              setActionError('');
                            }}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 touch-manipulation"
                          >
                            <XCircle size={16} />
                            驳回申请
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

      {/* 展开的详情 + 操作 */}
      {expandedId &&
        (() => {
          const req = requests.find((r) => r.id === expandedId);
          if (!req) return null;
          const badge = STATUS_BADGE[req.status];
          const BadgeIcon = badge.icon;

          const fields: { label: string; current: string | null; requested: string | null }[] = [
            { label: '姓名', current: req.currentName, requested: req.requestedName },
            {
              label: '届别',
              current: req.currentGraduationClass,
              requested: req.requestedGraduationClass,
            },
            {
              label: '班级',
              current: req.currentClassName,
              requested: req.requestedClassName,
            },
          ];

          return (
            <div id={`detail-${req.id}`} className="rounded-2xl border border-[#7C3AED]/10 bg-white/80 p-5 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-2">
                {/* 修改内容对比 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#4C1D95]">修改内容</h3>
                  {fields.map((f) => (
                    <div key={f.label}>
                      <p className="text-xs text-[#4C1D95]/40">{f.label}</p>
                      <div className="mt-0.5 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-[#7C3AED]/10 bg-[#FAF5FF] px-3 py-1.5 text-[#4C1D95]/60">
                          {f.current || '-'}
                        </div>
                        <div
                          className={`rounded-lg border px-3 py-1.5 ${
                            f.requested && f.requested !== (f.current || '')
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-[#7C3AED]/10 bg-[#FAF5FF] text-[#4C1D95]/40'
                          }`}
                        >
                          {f.requested || '（不修改）'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 申请信息 */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#4C1D95]">申请信息</h3>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}
                    >
                      <BadgeIcon size={12} />
                      {req.status === 'PENDING'
                        ? '待审核'
                        : req.status === 'APPROVED'
                          ? '已通过'
                          : '已驳回'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-[#4C1D95]/40">联系方式</p>
                    <p className="text-sm text-[#4C1D95]">{req.contact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4C1D95]/40">修改说明</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#4C1D95]/80">
                      {req.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4C1D95]/40">提交时间</p>
                    <p className="text-sm text-[#4C1D95]/60">
                      {new Date(req.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  {req.adminNote && (
                    <div>
                      <p className="text-xs text-[#4C1D95]/40">管理员备注</p>
                      <p className="text-sm text-[#4C1D95]/80">{req.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 — 仅待审核 */}
              {req.status === 'PENDING' && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-[#7C3AED]/10 pt-4">
                  <button
                    onClick={() => {
                      setActionTarget(req);
                      setActionType('approve');
                      setAdminNote('');
                      setActionError('');
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 size={16} />
                    通过并应用
                  </button>
                  <button
                    onClick={() => {
                      setActionTarget(req);
                      setActionType('reject');
                      setAdminNote('');
                      setActionError('');
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-100"
                  >
                    <XCircle size={16} />
                    驳回申请
                  </button>
                </div>
              )}
            </div>
          );
        })()}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-[#4C1D95]/60">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 审核确认弹窗 */}
      {actionTarget && actionType && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h2 id="confirm-dialog-title" className="font-heading text-lg font-bold text-[#4C1D95]">
              {actionType === 'approve' ? '通过并应用修改' : '驳回申请'}
            </h2>
            <p className="mt-1 text-sm text-[#4C1D95]/60">
              {actionType === 'approve'
                ? `将更新 ${actionTarget.currentName || '该校友'} 的信息，此操作不可撤销。`
                : `驳回 ${actionTarget.currentName || '该校友'} 的修改申请。`}
            </p>

            <div className="mt-4">
              <label htmlFor="adminNote" className="mb-1 block text-sm font-medium text-[#4C1D95]">
                管理员备注（可选）
              </label>
              <textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="input w-full min-h-[80px] resize-y"
                placeholder={actionType === 'approve' ? '可选：记录审核备注' : '可选：记录驳回原因'}
                rows={3}
                disabled={actionLoading}
              />
            </div>

            {actionError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertTriangle size={14} />
                {actionError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setActionTarget(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto min-h-[44px] cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`inline-flex w-full sm:w-auto min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                {actionType === 'approve' ? '确认通过' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
