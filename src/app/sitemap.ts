import type { MetadataRoute } from "next";
import prisma from "@/lib/db";

const BASE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date().toISOString();

  const [news, events] = await Promise.all([
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const newsUrls = news.map((item) => ({
    url: `${BASE_URL}/news/${item.id}`,
    lastModified: item.updatedAt.toISOString(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const eventUrls = events.map((item) => ({
    url: `${BASE_URL}/events/${item.id}`,
    lastModified: item.updatedAt.toISOString(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, lastModified, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/news`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/events`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/teachers`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/students`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/alumni/radar`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/alumni/stories`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/alumni/memories`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/alumni/certificate`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 },
    ...newsUrls,
    ...eventUrls,
  ];
}
