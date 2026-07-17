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
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { useAdminLocalize } from '@/components/admin/AdminLocalizedText';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

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
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', icon: Clock },
  APPROVED: { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-danger/10', text: 'text-danger', icon: XCircle },
};

const PAGE_SIZE = 20;

export default function AdminAlumniCorrectionsPage() {
  const localize = useAdminLocalize();
  const { locale } = useThemeAndLocale();
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
  const actionDialogRef = useDialogA11y(!!actionTarget && !!actionType, () => {
    if (!actionLoading) {
      setActionTarget(null);
      setActionType(null);
    }
  });

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
      if (!res.ok) throw new Error(localize('加载失败'));
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [localize, page, statusFilter, search]);

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
      if (!res.ok) throw new Error(data.error || localize('操作失败'));
      setActionTarget(null);
      setActionType(null);
      setAdminNote('');
      toast.success(localize(actionType === 'approve' ? '申请已批准，名单已自动更新' : '申请已驳回'));
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message);
      toast.error(err.message || localize('操作失败'));
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
                ? 'border-brand/30 bg-brand/10 text-brand'
                : 'border-brand/10 text-main/50 hover:bg-brand/5 hover:text-main/70'
            }`}
          >
            {localize(tab.label)}
          </button>
        ))}
        </div>

      {/* 搜索 */}
      <div className="relative">
        <label htmlFor="search-input" className="sr-only">{localize('搜索姓名、联系方式')}</label>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand/40"
        />
        <input
          id="search-input"
          type="text"
          placeholder={localize('搜索姓名、联系方式...')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input w-full pl-9"
        />
      </div>

        {/* 列表 */}
        <div className="hidden overflow-x-auto rounded-2xl border border-brand/10 bg-surface/60 backdrop-blur-xl md:block">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-brand/40" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-danger">
            <AlertTriangle size={16} />
            {error}
            <button type="button" onClick={fetchRequests} className="ml-2 underline cursor-pointer">
              {localize('重试')}
            </button>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title={localize(search || statusFilter ? '未找到匹配的申请' : '暂无修改申请')}
            description={localize('校友数据更新后将在此处统一管理与审核')}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-surface/50 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand/10 text-left text-xs text-main/50">
                  <th className="w-8 px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">{localize('姓名')}</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">{localize('联系方式')}</th>
                  <th className="px-4 py-3 font-medium">{localize('状态')}</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">{localize('提交时间')}</th>
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
                          aria-label={localize(isExpanded ? '收起详情' : '展开详情')}
                          aria-expanded={isExpanded}
                          aria-controls={`detail-${req.id}`}
                          className="cursor-pointer rounded p-0.5 text-brand/30 transition hover:text-brand min-h-[32px] min-w-[32px] flex items-center justify-center"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-main">
                        {req.currentName || localize('未知')}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-main/60 hidden sm:table-cell">
                        {req.contact}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}
                        >
                          <BadgeIcon size={12} />
                          {localize(req.status === 'PENDING'
                            ? '待审核'
                            : req.status === 'APPROVED'
                              ? '已通过'
                              : '已驳回')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-main/40 hidden md:table-cell">
                        {new Date(req.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}
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
            <div className="rounded-2xl border border-brand/10 bg-surface/60 px-4 py-10 text-center text-sm text-main/50 backdrop-blur-xl">
              <Loader2 size={20} className="mx-auto mb-2 animate-spin text-brand/40" />
              {localize('正在加载修改申请...')}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-4 text-sm text-danger">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p>{error}</p>
                  <button type="button" onClick={fetchRequests} className="mt-2 min-h-[44px] underline">
                    {localize('重试')}
                  </button>
                </div>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileEdit}
              title={localize(search || statusFilter ? '未找到匹配的申请' : '暂无修改申请')}
              description={localize('校友数据更新后将在此处统一管理与审核')}
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
                <div key={req.id} className="rounded-2xl border border-brand/10 bg-surface/70 p-4 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-main">{req.currentName || localize('未知')}</p>
                      <p className="mt-1 text-xs text-main/50">{req.contact}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}>
                      <BadgeIcon size={12} />
                      {localize(req.status === 'PENDING' ? '待审核' : req.status === 'APPROVED' ? '已通过' : '已驳回')}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    {fields.map((f) => (
                      <div key={f.label} className="rounded-xl border border-brand/10 bg-surface-muted p-3">
                        <p className="text-[11px] text-main/40">{localize(f.label)}</p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-surface/70 px-2.5 py-2 text-main/65">{f.current || '-'}</div>
                          <div className="rounded-lg bg-success/10 px-2.5 py-2 text-success">{f.requested || localize('（不修改）')}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`detail-${req.id}`}
                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-brand touch-manipulation"
                  >
                    {localize(isExpanded ? '收起详情' : '展开详情')}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded ? (
                    <div id={`detail-${req.id}`} className="mt-3 space-y-3 border-t border-brand/10 pt-3">
                      <div>
                        <p className="text-xs text-main/40">{localize('修改说明')}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-main/80">{req.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-main/40">{localize('提交时间')}</p>
                        <p className="text-sm text-main/60">{new Date(req.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}</p>
                      </div>
                      {req.adminNote ? (
                        <div>
                          <p className="text-xs text-main/40">{localize('管理员备注')}</p>
                          <p className="text-sm text-main/80">{req.adminNote}</p>
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
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-success/25 bg-success/10 px-4 py-2 text-sm text-success touch-manipulation"
                          >
                            <CheckCircle2 size={16} />
                            {localize('通过并应用')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionTarget(req);
                              setActionType('reject');
                              setAdminNote('');
                              setActionError('');
                            }}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger touch-manipulation"
                          >
                            <XCircle size={16} />
                            {localize('驳回申请')}
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
            <div id={`detail-${req.id}`} className="rounded-2xl border border-brand/10 bg-surface/80 p-5 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-2">
                {/* 修改内容对比 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-main">{localize('修改内容')}</h3>
                  {fields.map((f) => (
                    <div key={f.label}>
                      <p className="text-xs text-main/40">{localize(f.label)}</p>
                      <div className="mt-0.5 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-brand/10 bg-surface-muted px-3 py-1.5 text-main/60">
                          {f.current || '-'}
                        </div>
                        <div
                          className={`rounded-lg border px-3 py-1.5 ${
                            f.requested && f.requested !== (f.current || '')
                              ? 'border-success/25 bg-success/10 text-success'
                              : 'border-brand/10 bg-surface-muted text-main/40'
                          }`}
                        >
                          {f.requested || localize('（不修改）')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 申请信息 */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-main">{localize('申请信息')}</h3>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full ${badge.bg} px-2.5 py-0.5 text-xs ${badge.text}`}
                    >
                      <BadgeIcon size={12} />
                      {localize(req.status === 'PENDING'
                        ? '待审核'
                        : req.status === 'APPROVED'
                          ? '已通过'
                          : '已驳回')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-main/40">{localize('联系方式')}</p>
                    <p className="text-sm text-main">{req.contact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-main/40">{localize('修改说明')}</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-main/80">
                      {req.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-main/40">{localize('提交时间')}</p>
                    <p className="text-sm text-main/60">
                      {new Date(req.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}
                    </p>
                  </div>
                  {req.adminNote && (
                    <div>
                      <p className="text-xs text-main/40">{localize('管理员备注')}</p>
                      <p className="text-sm text-main/80">{req.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 — 仅待审核 */}
              {req.status === 'PENDING' && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-brand/10 pt-4">
                  <button
                    onClick={() => {
                      setActionTarget(req);
                      setActionType('approve');
                      setAdminNote('');
                      setActionError('');
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-success/25 bg-success/10 px-4 py-2 text-sm text-success transition hover:bg-success/20"
                  >
                    <CheckCircle2 size={16} />
                    {localize('通过并应用')}
                  </button>
                  <button
                    onClick={() => {
                      setActionTarget(req);
                      setActionType('reject');
                      setAdminNote('');
                      setActionError('');
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger transition hover:bg-danger/20"
                  >
                    <XCircle size={16} />
                    {localize('驳回申请')}
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
            className="cursor-pointer rounded-lg px-3 py-1.5 text-brand/60 transition hover:bg-brand/10 hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {localize('上一页')}
          </button>
          <span className="text-main/60">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-brand/60 transition hover:bg-brand/10 hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {localize('下一页')}
          </button>
        </div>
      )}

      {/* 审核确认弹窗 */}
      {actionTarget && actionType && (
        <div 
          ref={actionDialogRef}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay/60 backdrop-blur-sm px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md mb-4 sm:mb-0 animate-slide-in sm:animate-fade-in">
            <h2 id="confirm-dialog-title" className="font-heading text-lg font-bold text-main">
              {localize(actionType === 'approve' ? '通过并应用修改' : '驳回申请')}
            </h2>
            <p className="mt-1 text-sm text-main/60">
              {locale === 'en'
                ? actionType === 'approve'
                  ? `Update the record for ${actionTarget.currentName || 'this alumnus'}? This action cannot be undone.`
                  : `Reject the correction request from ${actionTarget.currentName || 'this alumnus'}?`
                : actionType === 'approve'
                  ? `将更新 ${actionTarget.currentName || '该校友'} 的信息，此操作不可撤销。`
                  : `驳回 ${actionTarget.currentName || '该校友'} 的修改申请。`}
            </p>

            <div className="mt-4">
              <label htmlFor="adminNote" className="mb-1 block text-sm font-medium text-main">
                {localize('管理员备注（可选）')}
              </label>
              <textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="input w-full min-h-[80px] resize-y"
                placeholder={localize(actionType === 'approve' ? '可选：记录审核备注' : '可选：记录驳回原因')}
                rows={3}
                disabled={actionLoading}
              />
            </div>

            {actionError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle size={14} />
                {actionError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setActionTarget(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto min-h-[44px] cursor-pointer rounded-xl border border-line px-4 py-2 text-sm text-main/60 transition hover:bg-surface/60 disabled:opacity-50"
              >
                {localize('取消')}
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`inline-flex w-full sm:w-auto min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'border-success/25 bg-success/10 text-success hover:bg-success/20'
                    : 'border-danger/25 bg-danger/10 text-danger hover:bg-danger/20'
                }`}
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                {localize(actionType === 'approve' ? '确认通过' : '确认驳回')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
