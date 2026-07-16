'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle2, Loader2, Send, FileEdit } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PageShell, GlassCard, Button, ButtonLink, EmptyState, FormStatus } from '@/components/ui';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { formatClassName, formatGraduationClass } from '@/lib/identity-fields';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

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
  const { t, locale } = useThemeAndLocale();
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
      setSearchError(t('correction.errors.queryLength'));
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/alumni/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(t('correction.errors.search'));
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setSearchError(t('correction.errors.search'));
      toast.error(t('correction.errors.search'));
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
      setFormError(t('correction.errors.signIn'));
      return;
    }
    if (!contactLoaded) {
      setFormError(t('correction.errors.loadingContact'));
      return;
    }
    if (!applicantContact.trim()) {
      setFormError(t('correction.errors.contactRequired'));
      return;
    }
    if (!reason.trim() || reason.trim().length < 5 || reason.trim().length > 1000) {
      setFormError(t('correction.errors.reasonLength'));
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
        setFormError(t('correction.errors.noChanges'));
        toast.warning(t('correction.errors.noChanges'));
        setSubmitting(false);
        return;
      }

      fd.append('contact', applicantContact.trim());
      fd.append('reason', reason.trim());

      const res = await fetch('/api/alumni/correction-requests', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(t('correction.errors.submit'));
      }
      setSubmitted(true);
      toast.success(t('correction.successToast'));
    } catch (err: any) {
      setFormError(err.message);
      toast.error(`${t('correction.errors.submit')}: ${err.message}`);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-brand/10 px-3 py-1 text-xs tracking-[0.18em] text-brand">
              <FileEdit size={14} /> CORRECTION
            </p>
            <h1 className="font-heading mt-3 text-2xl font-bold text-brand-fg sm:text-3xl md:text-4xl">{t('correction.title')}</h1>
            <p className="mt-2 text-sm leading-7 text-brand-fg/70">{t('correction.description')}</p>
          </div>
          <ButtonLink href="/me" variant="secondary" className="w-full shrink-0 sm:w-auto">
            {t('correction.backProfile')}
          </ButtonLink>
        </div>

        <FormStatus
          tone="info"
          title={t('correction.lockedTitle')}
          description={t('correction.lockedDescription')}
          className="mt-6"
        />

        {contactLoaded && !applicantContact.trim() ? (
          <FormStatus
            tone="warning"
            title={t(isLoggedIn ? 'correction.contactTitle' : 'correction.signInTitle')}
            description={t(isLoggedIn ? 'correction.contactDescription' : 'correction.signInDescription')}
            className="mt-3"
          />
        ) : null}
        {!isLoggedIn && contactLoaded ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-card border border-line bg-brand/5 p-4">
            <div>
              <p className="text-sm font-medium text-brand-fg">{t('correction.submitRequiresLogin')}</p>
              <p className="mt-1 text-xs leading-6 text-brand-fg/60">{t('correction.submitRequiresLoginDescription')}</p>
            </div>
            <ButtonLink href="/login" variant="secondary" size="sm" className="w-full sm:w-auto">
              {t('auth.login.submit')}
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
                  placeholder={t('correction.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input w-full pl-9"
                  autoFocus
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} className="gap-1.5 w-full sm:w-auto shrink-0" variant="secondary">
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {t('correction.searchAction')}
              </Button>
            </div>
            {searchError && (
              <FormStatus
                tone="danger"
                title={t('correction.searchErrorTitle')}
                description={searchError}
                className="mt-3"
              />
            )}
            {searched && !searching && (
              <div className="mt-4">
                {results.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title={t('correction.emptyTitle')}
                    description={t('correction.emptyDescription')}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-brand-fg/40">{t('correction.resultCount').replace('{count}', String(results.length))}</p>
                    {results.map((item) => (
                      <div key={item.id} className="flex flex-col justify-between gap-3 rounded-card border border-line bg-surface/50 px-4 py-3 transition hover:bg-brand/5 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-brand-fg">{item.name}</p>
                          <p className="mt-0.5 break-words text-xs text-brand-fg/50">
                            {item.graduationClass ? (locale === 'zh' ? formatGraduationClass(item.graduationClass) : `${item.graduationClass.replace(/\D/g, '')} Cohort`) : t('correction.unknownCohort')}{item.className && ` · ${locale === 'zh' ? formatClassName(item.className) : `Class ${item.className.replace(/\D/g, '')}`}`}
                          </p>
                        </div>
                        <Button onClick={() => openForm(item)} variant="secondary" size="sm" className="w-full sm:w-auto shrink-0">
                          {t('correction.requestChange')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {selected && !submitted && (
          <div className="mt-6 space-y-4">
            <div className="rounded-card border border-line bg-brand/5 px-4 py-3">
              <p className="text-xs text-brand-fg/40">{t('correction.currentInfo')}</p>
              <p className="mt-1 break-words text-sm font-medium text-brand-fg">{selected.name}</p>
              <p className="break-words text-xs text-brand-fg/60">
                {selected.graduationClass ? (locale === 'zh' ? formatGraduationClass(selected.graduationClass) : `${selected.graduationClass.replace(/\D/g, '')} Cohort`) : t('correction.unknownCohort')}
                {selected.className && ` · ${locale === 'zh' ? formatClassName(selected.className) : `Class ${selected.className.replace(/\D/g, '')}`}`}
              </p>
            </div>

            <input ref={websiteRef} type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />

            {([
              ['requestedName', t('correction.fields.name')],
              ['requestedGraduationClass', t('correction.fields.cohort')],
              ['requestedClassName', t('correction.fields.className')],
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
                  placeholder={t('correction.noChangePlaceholder')}
                />
                </div>
              ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-fg" htmlFor="correction-reason">
                {t('correction.reason')} *
              </label>
              <textarea
                id="correction-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input w-full min-h-[80px] resize-y"
                placeholder={t('correction.reasonPlaceholder')}
                rows={3}
              />
            </div>

            {formError && (
              <FormStatus tone="danger" title={t('correction.submitErrorTitle')} description={formError} />
            )}

            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => setSelected(null)} disabled={submitting} variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                {t('correction.back')}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !contactLoaded || !applicantContact.trim()} className="gap-1.5 w-full sm:w-auto min-h-[44px]" variant="primary">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? t('correction.submitting') : t('correction.submit')}
              </Button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-card bg-success/10 text-success border border-success/20">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="font-heading mt-4 text-lg font-bold text-brand-fg">{t('correction.successTitle')}</h2>
            <FormStatus
              tone="success"
              title={t('correction.reviewTitle')}
              description={t('correction.reviewDescription')}
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
                {t('correction.continueAction')}
              </Button>
              <ButtonLink href="/" variant="primary" className="w-full sm:w-auto min-h-[44px]">
                {t('common.backHome')}
              </ButtonLink>
            </div>
          </div>
        )}
      </GlassCard>
    </PageShell>
  );
}
