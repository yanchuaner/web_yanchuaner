'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, BookOpen, Star, Heart, MessageSquare, GraduationCap, Users, ArrowUp, ArrowDown } from 'lucide-react';

const ICONS = [
  { value: 'BookOpen', label: '书本', icon: BookOpen },
  { value: 'Star', label: '明星', icon: Star },
  { value: 'Heart', label: '爱心', icon: Heart },
  { value: 'MessageSquare', label: '消息', icon: MessageSquare },
  { value: 'GraduationCap', label: '学位帽', icon: GraduationCap },
  { value: 'Users', label: '用户群', icon: Users },
];

type Section = {
  id: string;
  title: string;
  description: string;
  note: string;
  icon: string;
  href: string | null;
  actionLabel: string | null;
  sortOrder: number;
};

const emptyForm = {
  title: '',
  description: '',
  note: '',
  icon: 'BookOpen',
  href: '',
  actionLabel: '',
};

export default function AdminTeachersPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/content?page=teachers');
      const data = await res.json();
      setSections(data.sections || []);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openEdit = (section: Section) => {
    setForm({
      title: section.title,
      description: section.description,
      note: section.note,
      icon: section.icon,
      href: section.href || '',
      actionLabel: section.actionLabel || '',
    });
    setEditingId(section.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('标题不能为空');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editingId
        ? `/api/admin/content/${editingId}`
        : '/api/admin/content';
      const method = editingId ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (!editingId) body.page = 'teachers';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      resetForm();
      await fetchSections();
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个版块？')) return;
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await fetchSections();
    } catch {
      setError('删除失败');
    }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const a = sections[idx];
    const b = sections[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/content/${a.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: b.sortOrder }),
        }),
        fetch(`/api/admin/content/${b.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: a.sortOrder }),
        }),
      ]);
      await fetchSections();
    } catch {
      setError('排序失败');
    }
  };

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-[#4C1D95]">教师频道管理</h1>
      <p className="mt-1 text-sm text-[#4C1D95]/60">管理教师频道页面的版块内容和排序</p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">关闭</button>
        </div>
      )}

      {/* Form */}
      <div className="mt-6 rounded-xl border border-[#7C3AED]/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-[#4C1D95]">
          {editingId ? '编辑版块' : '新增版块'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input w-full"
              placeholder="如：教师名录"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.slice(0, 4).map((ic) => {
                const Icon = ic.icon;
                const active = form.icon === ic.value;
                return (
                  <button
                    key={ic.value}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic.value })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                      active
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]'
                        : 'border-gray-200 text-gray-500 hover:border-[#7C3AED]/30'
                    }`}
                    title={ic.label}
                    disabled={saving}
                  >
                    <Icon size={14} />
                    {ic.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full min-h-[60px]"
              placeholder="版块描述文字..."
              disabled={saving}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">底部备注</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input w-full"
              placeholder="如：教师信息收集整理中，欢迎校友提供资料"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">跳转链接（可选）</label>
            <input
              type="text"
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              className="input w-full"
              placeholder="如：/alumni/stories"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4C1D95]">按钮文字（可选）</label>
            <input
              type="text"
              value={form.actionLabel}
              onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
              className="input w-full"
              placeholder="如：通过燕中故事投稿表达"
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary cursor-pointer"
          >
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>
              取消编辑
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">加载中...</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-gray-400">暂无版块，使用上方表单新增。</p>
        ) : (
          sections.map((section, idx) => (
            <div
              key={section.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-[#4C1D95]">{section.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                    {section.icon}
                  </span>
                  {section.href && (
                    <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] text-[#7C3AED]">
                      含链接
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{section.description || '无描述'}</p>
                {section.note && (
                  <p className="mt-0.5 text-xs text-gray-400">{section.note}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(section.id, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"
                  title="上移"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveItem(section.id, 'down')}
                  disabled={idx === sections.length - 1}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"
                  title="下移"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => openEdit(section)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] cursor-pointer"
                  title="编辑"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
