"use client";

import { useThemeAndLocale } from "./ThemeAndLocaleProvider";
import { Sun, Moon, Globe } from "lucide-react";

export default function ThemeAndLocaleSwitcher() {
  const { theme, toggleTheme, locale, setLocale } = useThemeAndLocale();
  const languageLabel = locale === "zh" ? "Switch to English" : "切换为中文";
  const themeLabel = theme === "light"
    ? locale === "zh" ? "切换为暗色模式" : "Switch to dark mode"
    : locale === "zh" ? "切换为亮色模式" : "Switch to light mode";

  return (
    <div className="flex items-center gap-2">
      {/* Language Switch */}
      <button
        type="button"
        onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
        aria-label={languageLabel}
        title={languageLabel}
        className="inline-flex h-9 min-w-11 items-center justify-center rounded-full border border-line bg-surface/40 px-2 text-main transition-colors hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <Globe size={16} />
        <span className="ml-1 text-xs font-mono font-medium select-none uppercase">
          {locale}
        </span>
      </button>

      {/* Theme Switch */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/40 text-main transition-colors hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
}
