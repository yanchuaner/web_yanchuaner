export const ACHIEVEMENT_CATEGORIES = [
  "ACADEMIC",
  "RESEARCH",
  "CAREER",
  "ENTREPRENEURSHIP",
  "PUBLIC_SERVICE",
  "OTHER",
] as const;

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  ACADEMIC: "升学深造",
  RESEARCH: "科研创新",
  CAREER: "职业发展",
  ENTREPRENEURSHIP: "创业实践",
  PUBLIC_SERVICE: "公益服务",
  OTHER: "其他成就",
};

export const ACHIEVEMENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type AchievementStatus = (typeof ACHIEVEMENT_STATUSES)[number];

export function isAchievementCategory(
  value: string,
): value is AchievementCategory {
  return ACHIEVEMENT_CATEGORIES.includes(value as AchievementCategory);
}

export function isAchievementStatus(
  value: string,
): value is AchievementStatus {
  return ACHIEVEMENT_STATUSES.includes(value as AchievementStatus);
}
