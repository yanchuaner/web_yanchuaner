'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';

type NewsItem = {
  id: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
};

const statusLabel: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布' };

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/news${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNews(data.news || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper size={28} className="text-[#7C3AED]" />
          <h2 className="text-2xl font-bold text-[#4C1D95] font-heading">新闻管理</h2>
        </div>
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
        >
          <Plus size={16} />
          发布新闻
        </Link>
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
            {f === 'ALL' ? '全部' : statusLabel[f]}
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
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#4C1D95]/60">
          <Newspaper size={40} className="mb-3 opacity-30" />
          <p>暂无新闻记录</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#7C3AED]/10 text-[#4C1D95]/60">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7C3AED]/5">
              {news.map((item) => (
                <tr key={item.id} className="text-[#4C1D95]/70 transition hover:bg-[#7C3AED]/5">
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{item.title}</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">{new Date(item.updatedAt).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/news/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-2.5 py-1 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/10 cursor-pointer"
                    >
                      <Edit2 size={14} />
                      编辑
                    </Link>
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
