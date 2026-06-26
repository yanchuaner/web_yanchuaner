'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText, Trash2 } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

type PostRecord = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  author: { name: string };
};

const typeLabel: Record<string, string> = { STORY: '校友故事', EVENT: '母港动态', JOB: '招聘信息' };
const statusLabel: Record<string, string> = { DRAFT: '草稿', PENDING: '待审', PUBLISHED: '已发布', REJECTED: '已驳回' };

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PostRecord | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts?status=${statusFilter}&limit=100`);
      if (!res.ok) throw new Error('获取内容列表失败');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('获取内容列表失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updatePost = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('更新状态失败');
      toast.success('状态更新成功');
      fetchPosts();
    } catch (err: any) {
      toast.error('操作失败: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/posts/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }
      toast.success('删除成功');
      setPosts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error('删除失败: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
      PUBLISHED: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
      REJECTED: 'border-rose-500/20 text-rose-400 bg-rose-500/10',
      DRAFT: 'border-line text-brand-fg/60 bg-surface/50',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {statusLabel[s] || s}
      </span>
    );
  };

  const filters = ['PENDING', 'PUBLISHED', 'REJECTED', 'DRAFT'];

  return (
    <AdminPageShell
      title="内容审核"
      description="审核校友故事、母港动态与招聘信息等投稿内容"
    >
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-btn border px-3 py-1.5 text-xs transition cursor-pointer ${
                statusFilter === f
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-line text-brand-fg/60 hover:border-brand/30 hover:bg-brand/5'
              }`}
            >
              {statusLabel[f]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-card border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand-fg/60">加载中...</div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="暂无匹配的内容记录"
            description="校友投稿审核处理完毕后将在此归档显示"
          />
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface/50 backdrop-blur-md">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-brand-fg/60">
                <tr>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">作者</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {posts.map((post) => (
                  <tr key={post.id} className="text-brand-fg/70 transition hover:bg-brand/5">
                    <td className="px-4 py-3 font-medium text-brand-fg">{post.title}</td>
                    <td className="px-4 py-3">{typeLabel[post.type] || post.type}</td>
                    <td className="px-4 py-3">{post.author?.name || '-'}</td>
                    <td className="px-4 py-3">{statusBadge(post.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {post.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updatePost(post.id, 'PUBLISHED')}
                              className="inline-flex items-center gap-1 rounded-btn border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer"
                            >
                              <CheckCircle size={14} />
                              发布
                            </button>
                            <button
                              onClick={() => updatePost(post.id, 'REJECTED')}
                              className="inline-flex items-center gap-1 rounded-btn border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
                            >
                              <XCircle size={14} />
                              驳回
                            </button>
                          </>
                        )}
                        {post.status === 'PUBLISHED' && (
                          <button
                            onClick={() => updatePost(post.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-btn border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
                          >
                            <XCircle size={14} />
                            下架
                          </button>
                        )}
                        {post.status === 'REJECTED' && (
                          <button
                            onClick={() => updatePost(post.id, 'PUBLISHED')}
                            className="inline-flex items-center gap-1 rounded-btn border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <CheckCircle size={14} />
                            重新发布
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(post)}
                          className="inline-flex items-center gap-1 rounded-btn border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
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
      </div>

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-modal border border-line bg-surface p-6 shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold text-brand font-heading">确认删除</h3>
            <p className="mt-3 text-sm leading-6 text-brand-fg/70">
              确定删除投稿《{confirmDelete.title}》（{confirmDelete.author?.name || '未知作者'}）吗？此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmDelete(null); setDeleting(null); }}
                disabled={!!deleting}
                className="rounded-btn border border-line bg-surface/50 px-4 py-2 text-sm text-brand-fg/70 transition hover:bg-brand/5 hover:text-brand cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="inline-flex items-center gap-2 rounded-btn border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 transition hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

