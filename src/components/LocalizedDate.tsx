"use client";

import { useMemo } from "react";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type DateStyle = "date" | "dateTime" | "event" | "time";

const styles: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  date: { year: "numeric", month: "short", day: "numeric" },
  dateTime: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  event: { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" },
  time: { hour: "2-digit", minute: "2-digit" },
};

export function LocalizedDate({ value, style = "date" }: { value: string | Date; style?: DateStyle }) {
  const { locale } = useThemeAndLocale();
  const text = useMemo(() => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", styles[style]).format(date);
  }, [locale, style, value]);

  return <time dateTime={value instanceof Date ? value.toISOString() : value}>{text}</time>;
}
