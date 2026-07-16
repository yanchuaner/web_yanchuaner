import type { MetadataRoute } from "next";

const BASE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString();

  return [
    { url: BASE_URL, lastModified, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/ecosystem`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: "yearly" as const, priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
  ];
}
