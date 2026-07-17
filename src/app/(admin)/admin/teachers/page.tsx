'use client';

import { useState } from 'react';
import { Pencil, Trash2, BookOpen, Star, Heart, MessageSquare, GraduationCap, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { useAdminLocalize } from '@/components/admin/AdminLocalizedText';

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
  const localize = useAdminLocalize();
  // 数据层：列表加载 / 增改删 / loading / error 全部由 useResource 托管，
  // 对接现有 /api/admin/content 接口，契约不变。
  const res = useResource<Section>({
    endpoint: '/api/admin/content',
    listKey: 'sections',
    listQuery: 'page=teachers',
    createDefaults: { page: 'teachers' },
  });
  const sections = res.items;
  const { loading, saving, error, setError } = res;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
      setError(localize('标题不能为空'));
      return;
    }
    const ok = editingId
      ? await res.update(editingId, { ...form })
      : await res.create({ ...form });
    if (ok) resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(localize('确定删除这个版块？'))) return;
    await res.remove(id);
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const a = sections[idx];
    const b = sections[swapIdx];
    await Promise.all([
      res.update(a.id, { sortOrder: b.sortOrder }),
      res.update(b.id, { sortOrder: a.sortOrder }),
    ]);
  };

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-brand-fg">{localize('教师频道管理')}</h1>
      <p className="mt-1 text-sm text-brand-fg/60">{localize('管理教师频道页面的版块内容和排序')}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {localize(error)}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">{localize('关闭')}</button>
        </div>
      )}

      {/* Form */}
      <div className="mt-6 rounded-card border border-brand/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-brand-fg">
          {localize(editingId ? '编辑版块' : '新增版块')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-brand-fg">{localize('标题')} *</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input w-full"
              placeholder={localize('如：教师名录')}
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-fg">{localize('图标')}</label>
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
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-line text-main/60 hover:border-brand/30'
                    }`}
                    title={localize(ic.label)}
                    disabled={saving}
                  >
                    <Icon size={14} />
                    {localize(ic.label)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-brand-fg">{localize('描述')}</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full min-h-[60px]"
              placeholder={localize('版块描述文字...')}
              disabled={saving}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="note" className="mb-1 block text-sm font-medium text-brand-fg">{localize('底部备注')}</label>
            <input
              id="note"
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input w-full"
              placeholder={localize('如：教师信息收集整理中，欢迎校友提供资料')}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="href" className="mb-1 block text-sm font-medium text-brand-fg">{localize('跳转链接（可选）')}</label>
            <input
              id="href"
              type="text"
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              className="input w-full"
              placeholder={localize('如：/alumni/stories')}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="actionLabel" className="mb-1 block text-sm font-medium text-brand-fg">{localize('按钮文字（可选）')}</label>
            <input
              id="actionLabel"
              type="text"
              value={form.actionLabel}
              onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
              className="input w-full"
              placeholder={localize('如：通过燕中故事投稿表达')}
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
            {localize(saving ? '保存中...' : editingId ? '更新' : '新增')}
          </button>
          {editingId && (
            <button onClick={resetForm} className="btn-secondary cursor-pointer" disabled={saving}>
              {localize('取消编辑')}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-main/60">{localize('加载中...')}</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-main/60">{localize('暂无版块，使用上方表单新增。')}</p>
        ) : (
          sections.map((section, idx) => (
            <div
              key={section.id}
              className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-brand-fg">{section.title}</h3>
                  <span className="rounded-full bg-surface/60 px-2 py-0.5 text-[10px] text-main/60">
                    {section.icon}
                  </span>
                  {section.href && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                      {localize('含链接')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-main/60 line-clamp-1">{section.description || localize('无描述')}</p>
                {section.note && (
                  <p className="mt-0.5 text-xs text-main/60">{section.note}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(section.id, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1.5 text-main/60 hover:bg-surface/60 hover:text-brand disabled:opacity-30 cursor-pointer"
                  title={localize('上移')}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveItem(section.id, 'down')}
                  disabled={idx === sections.length - 1}
                  className="rounded-lg p-1.5 text-main/60 hover:bg-surface/60 hover:text-brand disabled:opacity-30 cursor-pointer"
                  title={localize('下移')}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => openEdit(section)}
                  className="rounded-lg p-1.5 text-main/60 hover:bg-brand/10 hover:text-brand cursor-pointer"
                  title={localize('编辑')}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="rounded-lg p-1.5 text-main/60 hover:bg-danger/10 hover:text-danger cursor-pointer"
                  title={localize('删除')}
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
