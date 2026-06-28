'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle2, Loader2, Send, FileEdit } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PageShell, GlassCard, Button, ButtonLink, EmptyState, DisclaimerBanner, FormStatus } from '@/components/ui';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { formatClassName, formatGraduationClass } from '@/lib/identity-fields';

type AlumniResult = {
  id: string;
  name: string;
  graduationClass: string;
  className: string;
  university: string;
  major: string;
  city: string;
  industry: string;
};

interface RequestForm {
  requestedName: string;
  requestedGraduationClass: string;
  requestedClassName: string;
}

function fieldOrDefault(current: string | undefined | null, requested: string): string | undefined {
  const v = requested.trim();
  if (!v) return undefined;
  if (v === (current || '').trim()) return undefined;
  return v;
}

export default function AlumniCorrectionPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AlumniResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [applicantContact, setApplicantContact] = useState('');
  const [contactLoaded, setContactLoaded] = useState(false);

  const [selected, setSelected] = useState<AlumniResult | null>(null);
  const [form, setForm] = useState<RequestForm>({
    requestedName: '',
    requestedGraduationClass: '',
    requestedClassName: '',
  });
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const websiteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setApplicantContact('');
      setContactLoaded(true);
      return;
    }

    api
      .get<{ user?: { contact?: string | null } }>('/api/me/profile')
      .then(({ data }) => {
        setApplicantContact(data?.user?.contact || '');
      })
      .catch(() => {
        setApplicantContact('');
      })
      .finally(() => {
        setContactLoaded(true);
      });
  }, [authLoading, isLoggedIn]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setSearchError('请输入至少2个字符');
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/alumni/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('搜索失败');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setSearchError('搜索失败，请稍后重试');
      toast.error('搜索失败，请重试');
    } finally {
      setSearching(false);
    }
  };

  const openForm = (item: AlumniResult) => {
    setSelected(item);
    setForm({
      requestedName: item.name,
      requestedGraduationClass: item.graduationClass || '',
      requestedClassName: item.className || '',
    });
    setReason('');
    setFormError('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!isLoggedIn) {
      setFormError('请先登录后再提交修正申请');
      return;
    }
    if (!contactLoaded) {
      setFormError('正在读取个人联系方式，请稍候再提交');
      return;
    }
    if (!applicantContact.trim()) {
      setFormError('请先在个人中心补充联系方式，再提交修正申请');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5 || reason.trim().length > 1000) {
      setFormError('修改说明至少5字，不超过1000字');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('rosterId', selected.id);
      if (websiteRef.current) fd.append('website', websiteRef.current.value);

      const fields: [string, keyof RequestForm][] = [
        ['requestedName', 'requestedName'],
        ['requestedGraduationClass', 'requestedGraduationClass'],
        ['requestedClassName', 'requestedClassName'],
      ];
      const current: Record<string, string | undefined | null> = {
        requestedName: selected.name,
        requestedGraduationClass: selected.graduationClass,
        requestedClassName: selected.className,
      };

      let hasDiff = false;
      for (const [key, formKey] of fields) {
        const val = fieldOrDefault(current[key], form[formKey]);
        if (val) {
          fd.append(key, val);
          hasDiff = true;
        }
      }
      if (!hasDiff) {
        setFormError('修改内容与当前信息相同，请检查后重新提交');
        toast.warning('修改内容与当前信息相同');
        setSubmitting(false);
        return;
      }

      fd.append('contact', applicantContact.trim());
      fd.append('reason', reason.trim());

      const res = await fetch('/api/alumni/correction-requests', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }
      setSubmitted(true);
      toast.success('申请提交成功');
    } catch (err: any) {
      setFormError(err.message);
      toast.error('提交失败: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: keyof RequestForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PageShell size="narrow">
      <GlassCard className="p-5 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
              <FileEdit size={14} /> CORRECTION
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-brand-fg md:text-4xl">基础身份修正申请</h1>
            <p className="mt-2 text-sm leading-7 text-brand-fg/70">搜索你的姓名，核对当前信息，提交姓名、届别、班级的修正申请。其他资料请在个人中心修改，邮箱如需变更请联系管理员。</p>
          </div>
          <ButtonLink href="/me" variant="secondary" className="shrink-0">
            返回个人中心
          </ButtonLink>
        </div>

        <FormStatus
          tone="info"
          title="这里只处理锁定字段"
          description="姓名、届别、班级走修正申请；联系方式、学校、专业、城市、行业请直接在个人中心编辑。"
          className="mt-6"
        />

        {contactLoaded && !applicantContact.trim() ? (
          <FormStatus
            tone="warning"
            title={isLoggedIn ? '请先补充联系方式' : '请先登录'}
            description={isLoggedIn ? '修正申请会使用你在个人中心填写的联系方式作为回执。当前未获取到联系方式，请先去个人中心完善后再提交。' : '登录后可读取你的个人资料并提交修正申请。'}
            className="mt-3"
          />
        ) : null}
        {!isLoggedIn && contactLoaded ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-card border border-line bg-brand/5 p-4">
            <div>
              <p className="text-sm font-medium text-brand-fg">需要登录后提交</p>
              <p className="mt-1 text-xs leading-6 text-brand-fg/60">你仍然可以先搜索并核对信息，提交申请前请先登录。</p>
            </div>
            <ButtonLink href="/login" variant="secondary" size="sm" className="w-full sm:w-auto">
              去登录
            </ButtonLink>
          </div>
        ) : null}

        {!selected && (
          <>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-fg/40" />
                <input
                  type="text"
                  placeholder="输入你的姓名搜索..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input w-full pl-9"
                  autoFocus
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} className="gap-1.5 w-full sm:w-auto shrink-0" variant="secondary">
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                搜索
              </Button>
            </div>
            {searchError && (
              <FormStatus
                tone="danger"
                title="搜索未完成"
                description={searchError}
                className="mt-3"
              />
            )}
            {searched && !searching && (
              <div className="mt-4">
                {results.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="未找到匹配的校友"
                    description="请核对姓名。如确认本人信息未入库或有误，请联系管理员。"
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-brand-fg/40">找到 {results.length} 条记录</p>
                    {results.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-line bg-surface/50 px-4 py-3 transition hover:bg-brand/5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-fg">{item.name}</p>
                          <p className="mt-0.5 text-xs text-brand-fg/50">
                            {formatGraduationClass(item.graduationClass) || '届别未知'}{item.className && ` · ${formatClassName(item.className)}`}
                          </p>
                        </div>
                        <Button onClick={() => openForm(item)} variant="secondary" size="sm" className="w-full sm:w-auto shrink-0">
                          申请修改
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DisclaimerBanner withIcon className="mt-6">
              请勿提交他人隐私信息或未经授权的联系方式。
            </DisclaimerBanner>
          </>
        )}

        {selected && !submitted && (
          <div className="mt-6 space-y-4">
            <div className="rounded-card border border-line bg-brand/5 px-4 py-3">
              <p className="text-xs text-brand-fg/40">当前信息</p>
              <p className="mt-1 text-sm font-medium text-brand-fg">{selected.name}</p>
              <p className="text-xs text-brand-fg/60">
                {formatGraduationClass(selected.graduationClass) || '届别未知'}
                {selected.className && ` · ${formatClassName(selected.className)}`}
              </p>
            </div>

            <input ref={websiteRef} type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />

            {([
              ['requestedName', '姓名'],
              ['requestedGraduationClass', '届别'],
              ['requestedClassName', '班级'],
            ] as [keyof RequestForm, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-brand-fg" htmlFor={`correction-${key}`}>
                  {label}
                </label>
                <input
                  id={`correction-${key}`}
                  type="text"
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="input w-full"
                  placeholder="留空表示不修改"
                />
                </div>
              ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-fg" htmlFor="correction-reason">
                修改说明 *
              </label>
              <textarea
                id="correction-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input w-full min-h-[80px] resize-y"
                placeholder="请描述需要修改的内容及原因"
                rows={3}
              />
            </div>

            {formError && (
              <FormStatus tone="danger" title="申请未提交" description={formError} />
            )}

            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => setSelected(null)} disabled={submitting} variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                返回
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !contactLoaded || !applicantContact.trim()} className="gap-1.5 w-full sm:w-auto min-h-[44px]" variant="primary">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-card bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="font-heading mt-4 text-lg font-bold text-brand-fg">申请已提交</h2>
            <FormStatus
              tone="success"
              title="请等待管理员审核"
              description="审核通过后信息将自动更新。如还有其他记录需要修正，可以继续发起申请。"
            />
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setSelected(null);
                  setSubmitted(false);
                  setResults([]);
                  setSearched(false);
                  setQuery('');
                }}
                variant="secondary"
                className="w-full sm:w-auto min-h-[44px]"
              >
                继续提交其他申请
              </Button>
              <ButtonLink href="/" variant="primary" className="w-full sm:w-auto min-h-[44px]">
                返回首页
              </ButtonLink>
            </div>
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
