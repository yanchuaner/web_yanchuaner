"use client";

import Link from "next/link";
import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

export default function SiteFooter() {
  const { t } = useThemeAndLocale();

  return (
    <footer className="glass relative z-10 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-main/65 md:flex-row md:text-left">
          <p>{t("footer.copyright")}</p>
          <p>{t("footer.technical")}</p>
        </div>
        <div className="mt-2 flex flex-col items-center justify-between gap-2 text-center text-xs text-main/45 md:flex-row md:text-left">
          <p>{t("footer.operations")}</p>
          <p>{t("footer.disclaimer")}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href="/privacy"
            className="text-xs text-brand/60 transition hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t("footer.privacy")}
          </Link>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("footer.filingLabel")}
            className="text-xs text-brand/45 transition hover:text-brand/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            粤ICP备2026024784号-2
          </a>
        </div>
      </div>
    </footer>
  );
}
