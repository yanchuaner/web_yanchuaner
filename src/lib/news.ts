export const NEWS_CATEGORIES = [
  { value: "STUDENT_GUIDE", labelKey: "contentPages.news.categories.studentGuide" },
  { value: "CAMPUS_MEMORY", labelKey: "contentPages.news.categories.campusMemory" },
  { value: "ALUMNI_STORY", labelKey: "contentPages.news.categories.alumniStory" },
  { value: "TEACHER_VOICE", labelKey: "contentPages.news.categories.teacherVoice" },
  { value: "ALUMNI_UPDATE", labelKey: "contentPages.news.categories.alumniUpdate" },
  { value: "SEASONAL", labelKey: "contentPages.news.categories.seasonal" },
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]["value"];

export const DEFAULT_NEWS_CATEGORY: NewsCategory = "ALUMNI_UPDATE";

export function isNewsCategory(value: string): value is NewsCategory {
  return NEWS_CATEGORIES.some((category) => category.value === value);
}

export function getNewsCategory(value: string) {
  return NEWS_CATEGORIES.find((category) => category.value === value) ??
    NEWS_CATEGORIES.find((category) => category.value === DEFAULT_NEWS_CATEGORY)!;
}

export function isNewsContentFormat(value: string): value is "PLAIN" | "MARKDOWN" {
  return value === "PLAIN" || value === "MARKDOWN";
}

export function isPreoptimizedNewsImage(value: string | null | undefined) {
  return Boolean(value && /^\/uploads\/wechat-[a-z0-9-]+\.webp$/.test(value));
}
