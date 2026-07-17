"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useThemeAndLocale();
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-warning/25 bg-warning/10 p-8 text-center backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-warning">{t('admin.error.eyebrow')}</p>
        <p className="mt-3 text-sm leading-6 text-brand-fg/70">{t('admin.error.description')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full border border-warning/25 bg-surface px-4 py-2 text-sm text-warning transition hover:bg-warning/10">{t('admin.error.retry')}</button>
          <Link href="/admin" className="btn-secondary text-sm">{t('admin.error.dashboard')}</Link>
        </div>
      </div>
    </div>
  );
}
