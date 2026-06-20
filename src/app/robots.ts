import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about"],
      disallow: ["/admin/", "/api/", "/me/", "/news/", "/events/", "/contact", "/teachers", "/students/", "/alumni/"],
    },
    sitemap: "https://yanchuaner.cn/sitemap.xml",
  };
}
