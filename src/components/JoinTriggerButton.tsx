"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

export function JoinTriggerButton() {
  const { t } = useThemeAndLocale();

  return (
    <Link
      href="/register"
      aria-label={t("auth.register.openRegistration")}
      className="group flex min-h-[168px] flex-col items-center justify-center rounded-card border border-brand/30 bg-device-bg/60 px-5 py-6 text-center shadow-sm backdrop-blur-lg transition-all duration-300 touch-manipulation hover:-translate-y-0.5 hover:scale-[1.02] hover:border-brand/60 hover:bg-surface/10 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-sm transition-all duration-300 group-hover:bg-brand/25 group-hover:text-brand group-hover:shadow-md">
        <Send size={24} aria-hidden="true" />
      </span>
      <p className="font-heading mt-4 text-base font-semibold text-main/60">
        {t("home.ctaJoin")}
      </p>
      <p className="mt-1 text-xs text-brand">
        {t("auth.register.openRegistration")}
      </p>
    </Link>
  );
}
