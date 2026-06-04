'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Story = {
  id: string; title: string; author: string; tags: string[]; body: string; date: string;
};

const emptyForm = { title: '', author: '', tags: '', body: '', date: '' };

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stories');
      const data = await res.json();
      setStories(data.stories || []);
    } catch { setError('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (s: Story) => {
    setForm({ title: s.title, author: s.author, tags: s.tags.join(', '), body: s.body, date: s.date });
    setEditingId(s.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError('标题和正文不能为空'); return; }
    setSaving(true); setError('');
    try {
      const url = editingId ? `/api/admin/stories/${editingId}` : '/api/admin/stories';
      const method = editingId ? 'PUT' : 'POST';
      const tags = form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), author: form.author.trim(), tags, body: form.body.trim(), date: form.date || undefined }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || '保存失败'); }
      resetForm();
      await fetchStories();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个故事？')) return;
    try {
      const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await fetchStories();
    } catch { setError('删除失败'); }
  };

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-[#4C1D95]">燕中故事管理</h1>
      <p className="mt-1 text-sm text-[#4C1D95]/60">管理校友故事投稿——增删改查</p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">关闭</button>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-[#7C3AED]/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-[#4C1D95]">{editingId ? '编辑故事' : '新增故事'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标题 *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input w-full" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">作者</label>
            <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="input w-full" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标签（逗号分隔）</label>
            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input w-full" placeholder="专业真相, 避坑指南" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">日期</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input w-full" disabled={saving} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">正文 *</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="input w-full min-h-[120px]" disabled={saving} />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary cursor-pointer">
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>取消编辑</button>}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <p className="text-sm text-gray-400">加载中...</p>
        : stories.length === 0 ? <p className="text-sm text-gray-400">暂无故事，使用上方表单新增。</p>
        : stories.map((s) => (
          <div key={s.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm text-[#4C1D95]">{s.title}</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">{s.author} · {s.date}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.tags.map(t => <span key={t} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">#{t}</span>)}
              </div>
              <p className="mt-1 text-xs text-gray-400 line-clamp-1">{s.body}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(s)} className="rounded p-1.5 text-gray-400 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] cursor-pointer"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(s.id)} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
