'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CalendarDays, ArrowLeft, Upload, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { toast } from 'sonner';
import { useAdminLocalize } from '@/components/admin/AdminLocalizedText';

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString);
  const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const iso = local.toISOString();
  return iso.slice(0, 16);
}

function toISODatetime(localValue: string): string {
  return new Date(localValue + '+08:00').toISOString();
}

export default function AdminEventsEditPage() {
  const localize = useAdminLocalize();
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    location: '',
    eventDate: '',
    endDate: '',
    coverImage: '',
    maxAttendees: '',
    status: 'DRAFT',
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/admin/events/${params.id}`);
        if (!res.ok) throw new Error(localize('获取活动失败'));
        const data = await res.json();
        const e = data.event;
        setForm({
          title: e.title || '',
          summary: e.summary || '',
          content: e.content || '',
          location: e.location || '',
          eventDate: e.eventDate ? toLocalDatetime(e.eventDate) : '',
          endDate: e.endDate ? toLocalDatetime(e.endDate) : '',
          coverImage: e.coverImage || '',
          maxAttendees: e.maxAttendees ? String(e.maxAttendees) : '',
          status: e.status || 'DRAFT',
        });
        setRegistrationCount(e._count?.registrations ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [localize, params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err: any) {
      toast.error(`${localize('上传失败')}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError(localize('标题和正文不能为空'));
      return;
    }

    const body: Record<string, any> = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      content: form.content.trim(),
      location: form.location.trim() || null,
      eventDate: toISODatetime(form.eventDate),
      coverImage: form.coverImage.trim() || null,
      status: form.status,
    };

    body.endDate = form.endDate ? toISODatetime(form.endDate) : null;
    body.maxAttendees = form.maxAttendees !== '' ? parseInt(form.maxAttendees, 10) : null;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || localize('更新失败'));
      }
      toast.success(localize('更新成功'));
      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || localize('更新失败'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-main/60">{localize('加载中...')}</div>
    );
  }

  return (
    <AdminPageShell
      title="编辑活动"
      description="修改活动基本信息、状态与名额限制"
      actions={
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface/50 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          {localize('返回列表')}
        </Link>
      }
    >
      <div className="space-y-4">

      {error && (
        <div className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-brand/10 bg-surface/50 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-main/80">
            <Users size={18} className="text-brand" />
            <span>
              {localize('当前报名人数')}: {registrationCount}
              {form.maxAttendees ? ` / ${form.maxAttendees} ${localize('人')}` : ` / ${localize('不限')}`}
            </span>
          </div>
          <Link
            href={`/admin/events/${params.id}/registrations`}
            className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-1 text-xs text-brand transition hover:bg-brand/10 cursor-pointer"
          >
            <Users size={14} />
            {localize('查看报名名单')}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-brand/10 bg-surface/50 p-6 backdrop-blur-sm">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-main">{localize('标题')} *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="input w-full"
            placeholder={localize('活动标题')}
          />
        </div>

        <div>
          <label htmlFor="summary" className="mb-1.5 block text-sm font-medium text-main">{localize('摘要')}</label>
          <textarea
            id="summary"
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            className="input w-full"
            rows={3}
            placeholder={localize('活动摘要（可选）')}
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-1.5 block text-sm font-medium text-main">{localize('正文')} *</label>
          <textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            className="input w-full"
            rows={12}
            placeholder={localize('活动详情（支持换行）')}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="eventDate" className="mb-1.5 block text-sm font-medium text-main">{localize('活动时间')} *</label>
            <input
              id="eventDate"
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-main">{localize('结束时间')}</label>
            <input
              id="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-main">{localize('地点')}</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              className="input w-full"
              placeholder={localize('活动地点')}
            />
          </div>

          <div>
            <label htmlFor="maxAttendees" className="mb-1.5 block text-sm font-medium text-main">{localize('报名人数上限')}</label>
            <input
              id="maxAttendees"
              type="number"
              min="1"
              value={form.maxAttendees}
              onChange={(e) => setForm((prev) => ({ ...prev, maxAttendees: e.target.value }))}
              className="input w-full"
              placeholder={localize('留空表示不限制')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="coverImage" className="mb-1.5 block text-sm font-medium text-main">{localize('封面图片')}</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10">
              <Upload size={16} />
              {localize(uploading ? '上传中...' : '选择图片')}
              <input
                id="coverImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {form.coverImage && (
              <span className="break-all text-sm text-main/60">{form.coverImage}</span>
            )}
          </div>
          {form.coverImage && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative aspect-video w-full max-w-64 overflow-hidden rounded-lg border border-brand/10">
                <Image
                  src={form.coverImage}
                  alt={localize('封面预览')}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-1.5 text-xs text-danger transition hover:bg-danger/20 cursor-pointer"
              >
                {localize('移除封面')}
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-main">{localize('状态')}</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="input w-full"
          >
            <option value="DRAFT">{localize('草稿')}</option>
            <option value="PUBLISHED">{localize('已发布')}</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-6 py-2.5 text-sm text-brand transition hover:bg-brand/10 disabled:opacity-50 cursor-pointer"
          >
            {localize(submitting ? '提交中...' : '保存修改')}
          </button>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/50 px-4 py-2.5 text-sm text-main/60 transition hover:border-brand/30 hover:text-brand cursor-pointer"
          >
            {localize('取消')}
          </Link>
        </div>
      </form>
      </div>
    </AdminPageShell>
  );
}
