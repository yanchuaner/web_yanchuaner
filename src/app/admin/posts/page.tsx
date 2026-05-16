'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText } from 'lucide-react';

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

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts?status=${statusFilter}&limit=100`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message);
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
      if (!res.ok) throw new Error('Update failed');
      fetchPosts();
    } catch (err: any) {
      alert('操作失败: ' + err.message);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'border-amber-200 text-amber-700 bg-amber-50',
      PUBLISHED: 'border-emerald-200 text-emerald-700 bg-emerald-50',
      REJECTED: 'border-rose-200 text-rose-700 bg-rose-50',
      DRAFT: 'border-gray-200 text-gray-600 bg-gray-50',
    };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${map[s] || ''}`}>
        {statusLabel[s] || s}
      </span>
    );
  };

  const filters = ['PENDING', 'PUBLISHED', 'REJECTED', 'DRAFT'];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <FileText size={28} className="text-[#7C3AED]" />
        <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">内容审核</h2>
      </div>

      <div className="mb-4 flex gap-2">
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
            {statusLabel[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#4C1D95]/60">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <FileText size={40} className="mb-3 opacity-30" />
          <p>暂无匹配的内容记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">作者</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {posts.map((post) => (
                <tr key={post.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{post.title}</td>
                  <td className="px-4 py-3">{typeLabel[post.type] || post.type}</td>
                  <td className="px-4 py-3">{post.author?.name || '-'}</td>
                  <td className="px-4 py-3">{statusBadge(post.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {post.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updatePost(post.id, 'PUBLISHED')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                          >
                            <CheckCircle size={14} />
                            发布
                          </button>
                          <button
                            onClick={() => updatePost(post.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                          >
                            <XCircle size={14} />
                            驳回
                          </button>
                        </>
                      )}
                      {post.status === 'PUBLISHED' && (
                        <button
                          onClick={() => updatePost(post.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                        >
                          <XCircle size={14} />
                          下架
                        </button>
                      )}
                      {post.status === 'REJECTED' && (
                        <button
                          onClick={() => updatePost(post.id, 'PUBLISHED')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          重新发布
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
