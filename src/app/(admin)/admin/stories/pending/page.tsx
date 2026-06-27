"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Feather, Clock, User, Calendar } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { api } from '@/lib/apiClient';
import { formatClassName, formatGraduationClass } from '@/lib/identity-fields';

type PendingStory = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
  createdAt: string;
  authorId: string | null;
  authorUser: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    graduationClass: string | null;
    className: string | null;
  } | null;
};

export default function AdminStoriesPendingPage() {
  const [stories, setStories] = useState<PendingStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingStories = async () => {
    setLoading(true);
    const { data, error } = await api.get<{ stories: PendingStory[] }>('/api/admin/stories/pending');
    if (data?.stories) {
      setStories(data.stories);
    } else {
      toast.error(error || '获取待审核故事失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchPendingStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = async (id: string, title: string, status: 'PUBLISHED' | 'REJECTED') => {
    const actionName = status === 'PUBLISHED' ? '通过' : '驳回';
    const { data, error } = await api.patch<{ story: any }>(`/api/admin/stories/${id}/review`, { status });
    if (data?.story) {
      toast.success(`已${actionName}故事《${title}》`);
      setStories((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast.error(error || `操作失败`);
    }
  };

  return (
    <AdminPageShell title="待审核故事" description="审核前台校友提交的故事投稿——通过或驳回">
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-fg/60">
          <p className="text-sm">加载中...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-fg/60 rounded-card border border-brand/10 bg-surface/30 p-10">
          <Feather size={40} className="mb-3 opacity-30" />
          <p className="text-sm">暂无待审核的故事投稿</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="rounded-2xl border border-purple-500/30 bg-slate-900/50 p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(124,58,237,0.08)] transition duration-300 hover:border-purple-400/50 hover:shadow-[0_8px_32px_rgba(124,58,237,0.18)] hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-bold text-slate-100">
                    {story.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300/70">
                    <span className="flex items-center gap-1">
                      <User size={13} />
                      署名作者: <strong className="text-slate-200">{story.author}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      提交时间: {new Date(story.createdAt).toLocaleString('zh-CN')}
                    </span>
                    {story.date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        故事发生日期: {story.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* 操作区域 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void handleReview(story.id, story.title, 'PUBLISHED')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <CheckCircle size={14} />
                    通过 (Approve)
                  </button>
                  <button
                    onClick={() => void handleReview(story.id, story.title, 'REJECTED')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <XCircle size={14} />
                    驳回 (Reject)
                  </button>
                </div>
              </div>

              {/* 提交账号详情 */}
              {story.authorUser && (
                <div className="mt-3.5 rounded-xl bg-slate-950/50 border border-purple-500/20 p-3.5 text-xs text-slate-300 space-y-1 shadow-inner">
                  <span className="font-semibold text-purple-300">投稿账号关联信息:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                    <div>姓名: <span className="text-slate-200">{story.authorUser.name || '未填写'}</span></div>
                    <div>用户名: <span className="text-slate-200">{story.authorUser.username || '未填写'}</span></div>
                    <div>邮箱: <span className="text-slate-200">{story.authorUser.email || '未填写'}</span></div>
                    <div>届别: <span className="text-slate-200">{formatGraduationClass(story.authorUser.graduationClass) || '未填写'}</span></div>
                    <div>班级: <span className="text-slate-200">{formatClassName(story.authorUser.className) || '未填写'}</span></div>
                  </div>
                </div>
              )}

              {/* 标签 */}
              {story.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 稿件正文 */}
              <div className="mt-4 rounded-xl border border-purple-500/20 bg-slate-950/50 p-4.5 shadow-inner">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300 select-text">
                  {story.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
