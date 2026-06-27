'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookUser,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { toast } from 'sonner';
import {
  CLASS_NAME_PATTERN,
  formatClassName,
  formatGraduationClass,
  GRADUATION_CLASS_PATTERN,
  normalizeClassName,
  normalizeGraduationClass,
} from '@/lib/identity-fields';

type AlumniItem = {
  id: string;
  name: string;
  graduationClass: string | null;
  className: string | null;
  email: string | null;
  contact: string | null;
  gender: string | null;
  city: string | null;
  university: string | null;
  major: string | null;
  industry: string | null;
  certificateNo: string | null;
  createdAt: string;
};

type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

const PAGE_SIZE = 50;

function csvEscape(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // 防 Excel 公式注入
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  // 含逗号、换行、双引号需要用双引号包裹
  if (val.includes(',') || val.includes('\n') || val.includes('\r') || val.includes('"')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function alumniCSVContent(rows: AlumniItem[]): string {
  const header = '姓名,届别,班级,邮箱,联系方式,城市,院校,专业,行业';
  const lines = rows.map((r) =>
    [
      r.name,
      r.graduationClass || '',
      r.className || '',
      r.email || '',
      r.contact || '',
      r.city || '',
      r.university || '',
      r.major || '',
      r.industry || '',
    ].map(csvEscape).join(','),
  );
  return '﻿' + header + '\n' + lines.join('\n');
}

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // 新增/编辑 modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formClassName, setFormClassName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formUniversity, setFormUniversity] = useState('');
  const [formMajor, setFormMajor] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formCertNo, setFormCertNo] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<AlumniItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // CSV 导入
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (search.trim()) params.set('q', search.trim());
      if (classFilter.trim()) params.set('graduationClass', classFilter.trim());
      const res = await fetch(`/api/admin/alumni?${params}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setAlumni(data.alumni || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, classFilter]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  // 搜索防抖
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  // 打开新增
  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormClass('');
    setFormClassName('');
    setFormEmail('');
    setFormContact('');
    setFormCity('');
    setFormUniversity('');
    setFormMajor('');
    setFormIndustry('');
    setFormCertNo('');
    setFormError('');
    setShowForm(true);
  };

  // 打开编辑
  const openEdit = (item: AlumniItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormClass(normalizeGraduationClass(item.graduationClass));
    setFormClassName(normalizeClassName(item.className));
    setFormEmail(item.email || '');
    setFormContact(item.contact || '');
    setFormCity(item.city || '');
    setFormUniversity(item.university || '');
    setFormMajor(item.major || '');
    setFormIndustry(item.industry || '');
    setFormCertNo(item.certificateNo || '');
    setFormError('');
    setShowForm(true);
  };

  // 保存
  const handleSave = async () => {
    const name = formName.trim();
    if (!name || name.length > 50) {
      setFormError('姓名不能为空且不超过50字');
      return;
    }
    const gradClass = formClass.trim();
    if (gradClass && !GRADUATION_CLASS_PATTERN.test(gradClass)) {
      setFormError('届别需为2025起的四位年份数字');
      return;
    }
    const className = formClassName.trim();
    if (className && !CLASS_NAME_PATTERN.test(className)) {
      setFormError('班级需为1-99的数字');
      return;
    }
    const email = formEmail.trim().toLowerCase();
    if (email && (email.length > 254 || !email.includes('@'))) {
      setFormError('邮箱格式无效');
      return;
    }
    const contact = formContact.trim();
    if (contact && !/^\d{11}$/.test(contact)) {
      setFormError('联系方式需为11位手机号');
      return;
    }
    const city = formCity.trim();
    const university = formUniversity.trim();
    const major = formMajor.trim();
    const industry = formIndustry.trim();

    setFormSaving(true);
    setFormError('');
    try {
      const url = editingId
        ? `/api/admin/alumni/${editingId}`
        : '/api/admin/alumni';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          graduationClass: gradClass || null,
          className: className || null,
          email: email || null,
          contact: contact || null,
          city: city || null,
          university: university || null,
          major: major || null,
          industry: industry || null,
          certificateNo: formCertNo.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      setShowForm(false);
      toast.success(editingId ? '修改成功' : '新增成功');
      fetchAlumni();
    } catch (err: any) {
      setFormError(err.message);
      toast.error(err.message || '保存失败');
    } finally {
      setFormSaving(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/alumni/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      setDeleteTarget(null);
      toast.success('删除成功');
      fetchAlumni();
    } catch (err: any) {
      setDeleteTarget(null);
      toast.error(err.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // CSV 导入
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/alumni/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok) {
        toast.success(`成功导入 ${data.imported} 条记录`);
        fetchAlumni();
      } else {
        toast.error('导入失败，请检查数据格式');
      }
    } catch {
      setImportResult({ imported: 0, skipped: 0, failed: 1, errors: ['导入请求失败'] });
      toast.error('导入请求失败');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // CSV 导出
  const handleExport = () => {
    const csv = alumniCSVContent(alumni);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `alumni-roster-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminPageShell
      title="校友名单"
      description={`共 ${total} 条记录`}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAdd}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-btn border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <Plus size={16} />
            新增
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-btn border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            aria-label="选择CSV文件导入校友"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-btn border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <Download size={16} />
            导出
          </button>
        </div>
      }
    >
      <div className="space-y-4">

      {/* 搜索栏 */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C3AED]/40"
          />
          <input
            type="text"
            placeholder="搜索校友..."
            aria-label="搜索校友"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input w-full pl-9"
          />
        </div>
        <label htmlFor="class-filter-input" className="sr-only">按届别筛选</label>
        <input
          id="class-filter-input"
          type="text"
          placeholder="按届别筛选"
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPage(1);
          }}
          className="input w-32"
        />
      </div>

      {/* 导入结果 */}
      {importResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>
                导入完成：{importResult.imported} 条新增，{importResult.skipped} 条跳过
                {importResult.failed > 0 && `，${importResult.failed} 条错误`}
              </span>
            </div>
            <button
              onClick={() => setImportResult(null)}
              aria-label="关闭导入结果"
              className="cursor-pointer text-emerald-500 hover:text-emerald-700"
            >
              <X size={16} />
            </button>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-emerald-700/70">
              {importResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto rounded-2xl border border-[#7C3AED]/10 bg-white/60 backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#7C3AED]/40" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-rose-600">
            <AlertTriangle size={16} />
            {error}
            <button type="button" onClick={fetchAlumni} className="ml-2 underline cursor-pointer">
              重试
            </button>
          </div>
        ) : alumni.length === 0 ? (
          <div className="py-16 text-center">
            <BookUser size={36} className="mx-auto text-[#7C3AED]/20" />
            <p className="mt-3 text-sm text-[#4C1D95]/40">
              {search || classFilter ? '未找到匹配的校友' : '暂无校友数据'}
            </p>
            {!search && !classFilter && (
              <button
                onClick={openAdd}
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#7C3AED]/60 hover:text-[#7C3AED]"
              >
                <Plus size={14} />
                新增第一条校友
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#7C3AED]/10 text-left text-xs text-[#4C1D95]/50">
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">届别</th>
                <th className="px-4 py-3 font-medium">班级</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">邮箱</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">联系方式</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">城市</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">院校</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">专业</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">行业</th>
                <th className="px-4 py-3 font-medium hidden xl:table-cell">添加时间</th>
                <th className="w-24 px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#7C3AED]/5 transition hover:bg-[#7C3AED]/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-[#4C1D95]">{item.name}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60">{formatGraduationClass(item.graduationClass) || '-'}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60">{formatClassName(item.className) || '-'}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60 hidden md:table-cell">{item.email || '-'}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60 hidden lg:table-cell">{item.contact || '-'}</td>
                  <td className="px-4 py-3 text-[#4C1D95]/60 hidden sm:table-cell">{item.city || '-'}</td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-[#4C1D95]/60 hidden sm:table-cell">
                    {item.university || '-'}
                  </td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-[#4C1D95]/60 hidden lg:table-cell">
                    {item.major || '-'}
                  </td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-[#4C1D95]/60 hidden lg:table-cell">
                    {item.industry || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4C1D95]/40 hidden xl:table-cell">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-[#7C3AED]/50 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] min-h-[32px] min-w-[32px] justify-center"
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-rose-400/60 transition hover:bg-rose-50 hover:text-rose-600 min-h-[32px] min-w-[32px] justify-center"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-[#4C1D95]/60">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[#7C3AED]/60 transition hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-modal-title"
        >
          <div
            className="absolute inset-0 bg-[#4C1D95]/20 backdrop-blur-sm"
            onClick={() => !formSaving && setShowForm(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#7C3AED]/10 bg-white p-6 shadow-xl z-10 animate-slide-in sm:animate-fade-in mb-4 sm:mb-0">
            <button
              onClick={() => !formSaving && setShowForm(false)}
              aria-label="关闭表单"
              className="absolute right-4 top-4 cursor-pointer text-[#4C1D95]/40 hover:text-[#4C1D95]"
            >
              <X size={18} />
            </button>
            <h2 id="form-modal-title" className="font-heading text-lg font-bold text-[#4C1D95]">
              {editingId ? '编辑校友' : '新增校友'}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="form-name" className="mb-1 block text-sm font-medium text-[#4C1D95]">姓名 *</label>
                <input
                  id="form-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="请输入姓名"
                  disabled={formSaving}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="form-class" className="mb-1 block text-sm font-medium text-[#4C1D95]">届别</label>
                <input
                  id="form-class"
                  type="text"
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  className="input w-full bg-white"
                  maxLength={4}
                  pattern={GRADUATION_CLASS_PATTERN.source}
                  placeholder="例如：2025"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-classname" className="mb-1 block text-sm font-medium text-[#4C1D95]">班级</label>
                <input
                  id="form-classname"
                  type="text"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="input w-full bg-white"
                  maxLength={2}
                  pattern={CLASS_NAME_PATTERN.source}
                  placeholder="例如：1"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-email" className="mb-1 block text-sm font-medium text-[#4C1D95]">邮箱</label>
                <input
                  id="form-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="用于区分同名同届校友"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-contact" className="mb-1 block text-sm font-medium text-[#4C1D95]">联系方式</label>
                <input
                  id="form-contact"
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="手机号或微信"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-city" className="mb-1 block text-sm font-medium text-[#4C1D95]">城市</label>
                <input
                  id="form-city"
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="例如：深圳"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-university" className="mb-1 block text-sm font-medium text-[#4C1D95]">院校</label>
                <input
                  id="form-university"
                  type="text"
                  value={formUniversity}
                  onChange={(e) => setFormUniversity(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="例如：北京大学"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-major" className="mb-1 block text-sm font-medium text-[#4C1D95]">专业</label>
                <input
                  id="form-major"
                  type="text"
                  value={formMajor}
                  onChange={(e) => setFormMajor(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="例如：计算机科学"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-industry" className="mb-1 block text-sm font-medium text-[#4C1D95]">行业</label>
                <input
                  id="form-industry"
                  type="text"
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="例如：互联网"
                  disabled={formSaving}
                />
              </div>
              <div>
                <label htmlFor="form-certno" className="mb-1 block text-sm font-medium text-[#4C1D95]">证书编号</label>
                <input
                  id="form-certno"
                  type="text"
                  value={formCertNo}
                  onChange={(e) => setFormCertNo(e.target.value)}
                  className="input w-full bg-white"
                  placeholder="可选，如 YC-2022-001"
                  disabled={formSaving}
                />
                <p className="mt-1 text-xs text-[#4C1D95]/40">
                  留空则自动使用系统 ID
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={formSaving}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={formSaving}
                  className="inline-flex w-full sm:w-auto min-h-[44px] sm:min-h-0 items-center justify-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50"
                >
                  {formSaving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? '保存' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-safe sm:pb-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-[#4C1D95]/20 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-xl z-10 animate-slide-in sm:animate-fade-in mb-4 sm:mb-0">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 id="delete-modal-title" className="font-heading text-lg font-bold text-[#4C1D95]">确认删除</h2>
                <p className="mt-1 text-sm leading-6 text-[#4C1D95]/60">
                  确定要删除 <strong>{deleteTarget.name}</strong>
                  {deleteTarget.graduationClass ? `（${formatGraduationClass(deleteTarget.graduationClass)}）` : ''}
                  的校友信息吗？此操作不可撤销。
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex w-full sm:w-auto min-h-[44px] sm:min-h-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminPageShell>
  );
}
