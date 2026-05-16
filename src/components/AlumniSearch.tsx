'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

type Result = { id: number; name: string; graduationClass: string; tags: string };

export default function AlumniSearch() {
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
      <div className="flex items-center gap-2 rounded-2xl border border-[#7C3AED]/20 bg-white/70 px-4 py-3 backdrop-blur-md transition focus-within:border-[#7C3AED]/40 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.10)]">
        <Search size={18} className="shrink-0 text-[#7C3AED]/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索校友姓名、届别或城市..."
          aria-label="多维检索引擎"
          className="w-full bg-transparent text-sm text-[#4C1D95] outline-none placeholder:text-[#7C3AED]/50"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="shrink-0 text-[#7C3AED]/50 hover:text-[#4C1D95]">
            <X size={16} />
          </button>
        )}
        {loading && (
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#7C3AED]/30 border-t-[#7C3AED]" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#7C3AED]/15 bg-white/95 p-2 shadow-[0_0_30px_rgba(124,58,237,0.10)] backdrop-blur-xl">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl px-4 py-3 transition hover:bg-[#7C3AED]/5">
              <p className="text-sm font-medium text-[#4C1D95]">{r.name}</p>
              <p className="mt-0.5 text-xs text-gray-600">
                {r.graduationClass} · {(r.tags || '').replace(/\|/g, ' · ')}
              </p>
            </div>
          ))}
          {results.length >= 20 && (
            <p className="px-4 py-2 text-xs text-gray-500">仅显示前 20 条结果，请细化搜索词</p>
          )}
        </div>
      )}
    </div>
  );
}
