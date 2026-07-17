"use client";

import { useThemeAndLocale } from "./ThemeAndLocaleProvider";

export function LocalizedText({ translationKey }: { translationKey: string }) {
  const { t } = useThemeAndLocale();
  return <>{t(translationKey)}</>;
}
