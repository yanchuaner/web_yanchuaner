"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import zh from "@/locales/zh.json";
import en from "@/locales/en.json";

type Theme = "light" | "dark";
type Locale = "zh" | "en";

interface ThemeAndLocaleContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const ThemeAndLocaleContext = createContext<ThemeAndLocaleContextType | undefined>(undefined);

const dicts: Record<Locale, unknown> = { zh, en };

function resolveTranslation(dictionary: unknown, parts: string[]): string | null {
  let current = dictionary;
  for (const part of parts) {
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return null;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : null;
}

function readStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storeValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory preference when persistent storage is unavailable.
  }
}

export function ThemeAndLocaleProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    // Read theme from localStorage with safe validation
    const rawTheme = readStoredValue("theme");
    const savedTheme: Theme = (rawTheme === "light" || rawTheme === "dark") ? rawTheme : "dark";
    setThemeState(savedTheme);

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Read locale from localStorage with safe validation
    const rawLocale = readStoredValue("locale");
    const savedLocale: Locale = (rawLocale === "zh" || rawLocale === "en") ? rawLocale : "zh";
    setLocaleState(savedLocale);

    // Dynamically update document HTML lang attribute
    document.documentElement.lang = savedLocale === "zh" ? "zh-CN" : "en";
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeValue("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const nextTheme = prevTheme === "light" ? "dark" : "light";
      storeValue("theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return nextTheme;
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    storeValue("locale", newLocale);
    document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
  }, []);

  // Safe nested translate function with fallback to default zh locale
  const t = useCallback((key: string): string => {
    const parts = key.split(".");
    return (
      resolveTranslation(dicts[locale], parts) ??
      (locale === "en" ? resolveTranslation(dicts.zh, parts) : null) ??
      key
    );
  }, [locale]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    locale,
    setLocale,
    t
  }), [theme, locale, t, setTheme, toggleTheme, setLocale]);

  return (
    <ThemeAndLocaleContext.Provider value={value}>
      {children}
    </ThemeAndLocaleContext.Provider>
  );
}

export function useThemeAndLocale() {
  const context = useContext(ThemeAndLocaleContext);
  if (!context) {
    throw new Error("useThemeAndLocale must be used within a ThemeAndLocaleProvider");
  }
  return context;
}

export const useTranslation = () => {
  const { t, locale } = useThemeAndLocale();
  return { t, locale };
};
