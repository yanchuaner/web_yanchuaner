'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { formatGraduationClass } from '@/lib/identity-fields';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

type Result = { id: number; name: string; graduationClass: string; city: string; university: string; major: string };

export default function AlumniSearch() {
  const { t, locale } = useThemeAndLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/alumni/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-surface/70 px-4 py-3 backdrop-blur-md transition focus-within:border-brand/40 focus-within:shadow-md">
        <Search size={18} className="shrink-0 text-brand/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("alumniMap.searchPlaceholder")}
          aria-label={t("alumniMap.searchLabel")}
          className="w-full bg-transparent text-sm text-main outline-none placeholder:text-brand/50"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="shrink-0 text-brand/50 hover:text-main">
            <X size={16} />
          </button>
        )}
        {loading && (
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-brand/15 bg-surface/95 p-2 shadow-lg backdrop-blur-xl">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl px-4 py-3 transition hover:bg-brand/5">
              <p className="text-sm font-medium text-main">{r.name}</p>
              <p className="mt-0.5 text-xs text-main/60">
                {locale === 'zh' ? formatGraduationClass(r.graduationClass) : `${r.graduationClass.replace(/\D/g, '')} Cohort`}
                {r.university && ` · ${r.university}`}
                {r.major && ` · ${r.major}`}
                {r.city && ` · ${r.city}`}
              </p>
            </div>
          ))}
          {results.length >= 20 && (
            <p className="px-4 py-2 text-xs text-main/60">{t("alumniMap.resultLimit")}</p>
          )}
        </div>
      )}
    </div>
  );
}
