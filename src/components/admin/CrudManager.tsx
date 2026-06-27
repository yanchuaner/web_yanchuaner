import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { Skeleton, SkeletonText } from '@/components/ui';
import { AdminPageShell } from './AdminPageShell';
import { toast } from 'sonner';

/**
 * 字段配置：声明式描述一个表单字段，CrudManager 据此渲染输入控件。
 */
export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'url';
  required?: boolean;
  placeholder?: string;
  /** select 类型的选项 */
  options?: { value: string; label: string }[];
  /** 占满整行（用于 textarea） */
  fullWidth?: boolean;
};

type FormValues = Record<string, string>;

/**
 * 通用后台 CRUD 管理器（纯展示 + 表单状态）。
 *
 * 业务数据流由 useResource 提供，此组件只负责：表单渲染、编辑态切换、列表渲染。
 * 把「fetch + loading + error」与「表单 + 列表 UI」彻底分离，
 * 让贡献者改样式时碰不到数据逻辑。
 */
export function CrudManager<T extends { id: string }>({
  title,
  subtitle,
  fields,
  items,
  loading,
  saving,
  error,
  setError,
  onCreate,
  onUpdate,
  onDelete,
  toForm,
  toPayload,
  validate,
  renderItem,
  emptyHint = '暂无数据，使用上方表单新增。',
  deleteConfirm = '确定删除这条记录？',
}: {
  title: string;
  subtitle?: string;
  fields: FieldConfig[];
  items: T[];
  loading: boolean;
  saving: boolean;
  error: string;
  /** 来自 useResource，可设置 / 清空错误信息 */
  setError: (msg: string) => void;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  /** 把一条记录映射为表单初值（编辑时用） */
  toForm: (item: T) => FormValues;
  /** 可选：提交前把表单值转换为 API payload（如把逗号分隔字符串转为数组） */
  toPayload?: (form: FormValues) => Record<string, unknown>;
  /** 可选：返回错误信息字符串则阻止提交 */
  validate?: (form: FormValues) => string | null;
  /** 列表项主体渲染（左侧信息区） */
  renderItem: (item: T) => React.ReactNode;
  emptyHint?: string;
  deleteConfirm?: string;
}) {
  const emptyForm: FormValues = Object.fromEntries(fields.map((f) => [f.name, '']));
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const openEdit = (item: T) => {
    setForm({ ...emptyForm, ...toForm(item) });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (validate) {
      const msg = validate(form);
      if (msg) {
        toast.error(msg);
        return;
      }
    }
    const payload = toPayload ? toPayload(form) : form;
    const isEdit = !!editingId;
    const ok = isEdit ? await onUpdate(editingId, payload) : await onCreate(payload);
    if (ok) {
      toast.success(isEdit ? '更新成功' : '新增成功');
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(deleteConfirm)) {
      const ok = await onDelete(id);
      if (ok) {
        toast.success('删除成功');
      }
    }
  };

  return (
    <AdminPageShell title={title} description={subtitle}>
      {/* 表单卡片 */}
      <div className="rounded-card border border-line bg-surface/60 backdrop-blur-xl p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-brand-fg">
          {editingId ? '编辑记录' : '新增记录'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={form[field.name] ?? ''}
              disabled={saving}
              onChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-h-[44px] w-full cursor-pointer rounded-btn sm:w-auto">
            {saving ? '保存中...' : editingId ? '更新' : '新增'}
          </button>
          {editingId ? (
            <button onClick={resetForm} className="btn-secondary min-h-[44px] w-full cursor-pointer rounded-btn sm:w-auto" disabled={saving}>
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      {/* 列表 */}
      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-card border border-line bg-surface/40 p-4 backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="w-full min-w-0 flex-1">
                <Skeleton variant="text" className="h-5 w-40 max-w-full" />
                <SkeletonText lines={2} className="mt-3 max-w-xl" />
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <Skeleton className="h-11 w-11 rounded-btn" />
                <Skeleton className="h-11 w-11 rounded-btn" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-surface/20 py-8 text-center text-sm text-brand-fg/40">
            {emptyHint}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start gap-3 rounded-card border border-line bg-surface/40 backdrop-blur-sm p-4 shadow-sm hover:border-brand/20 transition-all duration-300"
            >
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => openEdit(item)}
                  aria-label="编辑"
                  className="flex h-11 w-11 items-center justify-center rounded-btn text-brand-fg/50 hover:bg-brand/15 hover:text-brand transition cursor-pointer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label="删除"
                  className="flex h-11 w-11 items-center justify-center rounded-btn text-brand-fg/50 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}

function FormField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const labelEl = (
    <label className="mb-1 block text-sm font-medium text-brand-fg">
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  const wrapperClass = field.type === 'textarea' || field.fullWidth ? 'md:col-span-2' : '';

  return (
    <div className={wrapperClass}>
      {labelEl}
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-full min-h-[120px] rounded-btn bg-surface-muted/50 border-line"
          placeholder={field.placeholder}
          disabled={disabled}
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-full rounded-btn bg-surface-muted/50 border-line"
          disabled={disabled}
        >
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-muted">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'url' ? 'text' : field.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('input w-full rounded-btn bg-surface-muted/50 border-line')}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
