'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { toast } from 'sonner';

export default function AdminNewsNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    status: 'DRAFT',
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      toast.error('上传失败: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('标题和正文不能为空');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建失败');
      }
      toast.success('新闻发布成功');
      router.push('/admin/news');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || '发布失败');
      setSubmitting(false);
    }
  };

  return (
    <AdminPageShell
      title="发布新闻"
      description="发布新闻动态或公告"
      actions={
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface/50 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          返回列表
        </Link>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="mb-4 rounded-card border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-card border border-line bg-surface/50 p-6 backdrop-blur-md">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-fg">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input w-full"
              placeholder="新闻标题"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-fg">摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="新闻摘要（可选）"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-fg">正文 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              className="input w-full"
              rows={12}
              placeholder="新闻正文（支持 HTML）"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-fg">封面图片</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-btn border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand transition hover:bg-brand/10">
                <Upload size={16} />
                {uploading ? '上传中...' : '选择图片'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {form.imageUrl && (
                <span className="text-sm text-brand-fg/60">{form.imageUrl}</span>
              )}
            </div>
            {form.imageUrl && (
              <div className="relative mt-2 h-32 w-48 overflow-hidden rounded-card border border-line">
                <Image
                  src={form.imageUrl}
                  alt="封面预览"
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-fg">状态</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="input w-full"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-btn bg-brand px-6 py-2.5 text-sm text-white transition hover:bg-brand/90 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? '提交中...' : '发布新闻'}
            </button>
            <Link
              href="/admin/news"
              className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface/50 px-4 py-2.5 text-sm text-brand-fg/60 transition hover:border-brand/30 hover:text-brand cursor-pointer"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
}
