import type { MetadataRoute } from "next";
import { getSiteUrl, getPyracryptSitemapUrl, getSitemapUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/*",
          "/tools",
          "/tools/category/*",
          "/lp/*",
          "/about",
          "/contact",
          "/docs",
          "/privacy",
          "/terms",
          "/orbit",
          "/seeds",
          "/referrals",
          "/clutety",
          "/ai-tools-hub",
          "/cyber-security-mini-apps",
          "/seo-pack",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/api",
          "/api/*",
          "/_next",
          "/_next/*",
          "/gate",
          "/gate/*",
          "/play",
          "/play/*",
          "/playground",
          "/playground/*",
          "/test",
          "/badge",
          "/api-card",
          "/api-card/*",
          "/*?*",
        ],
      },
    ],
    sitemap: [getSitemapUrl(), getPyracryptSitemapUrl()],
    host: baseUrl,
  };
}
