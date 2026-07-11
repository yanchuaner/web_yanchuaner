'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, ArrowLeft, Download, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { Badge, EmptyState } from '@/components/ui';
import { toast } from 'sonner';

type Registration = {
  id: string;
  name: string;
  contact: string | null;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type EventInfo = {
  id: string;
  title: string;
  eventDate: string;
  maxAttendees: number | null;
  registrationCount: number;
  activeRegistrationCount: number;
  totalRegistrationCount: number;
};

const STATUS_BADGES = {
  PENDING: { label: '待审核', tone: 'warning' },
  APPROVED: { label: '有效', tone: 'success' },
  REJECTED: { label: '未通过', tone: 'danger' },
  CANCELLED: { label: '已取消', tone: 'neutral' },
} as const;

function exportFilename(response: Response) {
  const disposition = response.headers.get('Content-Disposition') || '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (!encoded) return 'event-registrations.csv';
  try {
    return decodeURIComponent(encoded);
  } catch {
    return 'event-registrations.csv';
  }
}

function downloadCSV(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminEventRegistrationsPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/registrations`);
      if (!res.ok) throw new Error('获取报名列表失败');
      const data = await res.json();
      setEvent(data.event);
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleExport = async () => {
    if (!event) return;
    setExporting(true);
    try {
      const response = await fetch(
        `/api/admin/events/${params.id}/registrations/export`,
        { method: 'POST' },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || '导出报名名单失败');
      }
      downloadCSV(await response.blob(), exportFilename(response));
      toast.success('报名名单已导出');
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : '导出报名名单失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminPageShell
      title="报名名单"
      description={event ? `活动《${event.title}》的报名记录` : '活动报名记录'}
      actions={
        <div className="flex gap-2">
          {registrations.length > 0 && (
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-btn border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {exporting ? '导出中' : '导出 CSV'}
            </button>
          )}
          <Link
            href={`/admin/events/${params.id}`}
            className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface/50 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/5 cursor-pointer"
          >
            <ArrowLeft size={16} />
            返回编辑
          </Link>
        </div>
      }
    >
      <div className="space-y-4">

      {event && (
        <div className="mb-6 rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-4 backdrop-blur-sm">
          <h3 className="font-heading text-lg font-semibold text-[#4C1D95]">{event.title}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#4C1D95]/70">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-[#7C3AED]" />
              {new Date(event.eventDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} className="text-[#7C3AED]" />
              有效报名：{event.activeRegistrationCount}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
            </span>
            <span>全部记录：{event.totalRegistrationCount}</span>
          </div>
        </div>
      )}

      <div className="rounded-card border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        CSV 可能包含姓名、联系方式和留言。导出操作会写入审计日志；文件仅限活动服务使用，完成后应从下载目录及时删除，禁止转发到无关群聊或公开网盘。
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无报名记录"
          description="该活动目前还没有校友登记报名"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">联系方式</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">留言</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">报名时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {registrations.map((r, i) => (
                <tr key={r.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 text-[#4C1D95]/40">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{r.name}</td>
                  <td className="px-4 py-3">{r.contact || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_BADGES[r.status].tone}>
                      {STATUS_BADGES[r.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate hidden sm:table-cell">{r.message || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    {new Date(r.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
