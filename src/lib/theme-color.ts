export function themeRgb(variable: string, alpha = 1): string {
  if (typeof document === "undefined") return `rgb(var(${variable}) / ${alpha})`;
  const channels = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return `rgb(${channels} / ${alpha})`;
}
