'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, BookOpen, Star, Heart, MessageSquare, GraduationCap, Mail, Shield, Users, School, Building2, Globe2, MapPin, Rocket, History, ArrowUp, ArrowDown, Plus } from 'lucide-react';

const PAGES: { key: string; label: string }[] = [
  { key: 'about_features', label: '学校介绍 - 特色卡片' },
  { key: 'about_timeline', label: '学校介绍 - 发展历程' },
  { key: 'contact', label: '联系我们' },
  { key: 'students', label: '在校生资源站' },
  { key: 'teachers', label: '教师频道' },
];

const ICONS: { value: string; label: string; icon: any }[] = [
  { value: 'BookOpen', label: '书本', icon: BookOpen },
  { value: 'Star', label: '明星', icon: Star },
  { value: 'Heart', label: '爱心', icon: Heart },
  { value: 'MessageSquare', label: '消息', icon: MessageSquare },
  { value: 'GraduationCap', label: '学位帽', icon: GraduationCap },
  { value: 'Mail', label: '邮箱', icon: Mail },
  { value: 'Shield', label: '盾牌', icon: Shield },
  { value: 'Users', label: '用户群', icon: Users },
  { value: 'School', label: '学校', icon: School },
  { value: 'Building2', label: '建筑', icon: Building2 },
  { value: 'Globe2', label: '地球', icon: Globe2 },
  { value: 'MapPin', label: '地图', icon: MapPin },
  { value: 'Rocket', label: '火箭', icon: Rocket },
  { value: 'History', label: '历史', icon: History },
];

type Section = {
  id: string;
  page: string;
  title: string;
  description: string;
  note: string;
  icon: string;
  href: string | null;
  actionLabel: string | null;
  yearLabel: string | null;
  sortOrder: number;
};

const emptyForm = {
  title: '', description: '', note: '', icon: 'BookOpen',
  href: '', actionLabel: '', yearLabel: '',
};

export default function AdminContentPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [activePage, setActivePage] = useState('about_features');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?page=${activePage}`);
      const data = await res.json();
      setSections(data.sections || []);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [activePage]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (s: Section) => {
    setForm({
      title: s.title, description: s.description, note: s.note,
      icon: s.icon, href: s.href || '', actionLabel: s.actionLabel || '',
      yearLabel: s.yearLabel || '',
    });
    setEditingId(s.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('标题不能为空'); return; }
    setSaving(true); setError('');
    try {
      const url = editingId ? `/api/admin/content/${editingId}` : '/api/admin/content';
      const method = editingId ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (!editingId) body.page = activePage;
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || '保存失败'); }
      resetForm();
      await fetchSections();
    } catch (e: any) { setError(e.message || '保存失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return;
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await fetchSections();
    } catch { setError('删除失败'); }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(i => i.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const a = sections[idx], b = sections[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/content/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
        fetch(`/api/admin/content/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
      ]);
      await fetchSections();
    } catch { setError('排序失败'); }
  };

  const isTimeline = activePage === 'about_timeline';

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-[#4C1D95]">页面内容管理</h1>
      <p className="mt-1 text-sm text-[#4C1D95]/60">管理各页面的版块内容与排序</p>

      {/* Page selector tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PAGES.map(p => (
          <button
            key={p.key}
            onClick={() => { setActivePage(p.key); resetForm(); }}
            className={`rounded-full px-3 py-1.5 text-xs transition cursor-pointer ${
              activePage === p.key
                ? 'bg-[#7C3AED] text-white'
                : 'border border-gray-200 text-gray-500 hover:border-[#7C3AED]/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">关闭</button>
        </div>
      )}

      {/* Form */}
      <div className="mt-4 rounded-xl border border-[#7C3AED]/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-[#4C1D95]">
          {editingId ? '编辑内容' : '新增内容'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标题 *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input w-full" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">图标</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.slice(0, 8).map(ic => {
                const Icon = ic.icon;
                return (
                  <button key={ic.value} type="button"
                    onClick={() => setForm({ ...form, icon: ic.value })}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition cursor-pointer ${
                      form.icon === ic.value ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]' : 'border-gray-200 text-gray-500 hover:border-[#7C3AED]/30'
                    }`}
                    title={ic.label} disabled={saving}
                  ><Icon size={13} />{ic.label}</button>
                );
              })}
            </div>
          </div>
          {isTimeline && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">年份</label>
              <input type="text" value={form.yearLabel} onChange={e => setForm({ ...form, yearLabel: e.target.value })} className="input w-full" placeholder="如：2022" disabled={saving} />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input w-full min-h-[60px]" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">底部备注</label>
            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input w-full" disabled={saving} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">跳转链接（可选）</label>
            <input type="text" value={form.href} onChange={e => setForm({ ...form, href: e.target.value })} className="input w-full" placeholder="/alumni/stories" disabled={saving} />
          </div>
          {form.href && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">按钮文字</label>
              <input type="text" value={form.actionLabel} onChange={e => setForm({ ...form, actionLabel: e.target.value })} className="input w-full" disabled={saving} />
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary cursor-pointer">
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>取消编辑</button>}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {loading ? <p className="text-sm text-gray-400">加载中...</p>
        : sections.length === 0 ? <p className="text-sm text-gray-400">暂无内容，使用上方表单新增。</p>
        : sections.map((s, idx) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm text-[#4C1D95]">{s.title}</h3>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{s.icon}</span>
                {s.yearLabel && <span className="rounded-full bg-[#7C3AED]/10 px-1.5 py-0.5 text-[10px] text-[#7C3AED]">{s.yearLabel}</span>}
                {s.href && <span className="rounded-full bg-[#7C3AED]/10 px-1.5 py-0.5 text-[10px] text-[#7C3AED]">含链接</span>}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{s.description || '无描述'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveItem(s.id, 'up')} disabled={idx === 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"><ArrowUp size={15} /></button>
              <button onClick={() => moveItem(s.id, 'down')} disabled={idx === sections.length - 1} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"><ArrowDown size={15} /></button>
              <button onClick={() => openEdit(s)} className="rounded p-1 text-gray-400 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] cursor-pointer"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(s.id)} className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
