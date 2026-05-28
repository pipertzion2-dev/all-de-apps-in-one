import type { MetadataRoute } from "next";
import { getSecuritySitemapUrl, getSiteUrl, getSitemapUrl } from "@/lib/site-url";

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
          "/tools/*",
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
          "/ai-tools-hub",
          "/cyber-security-mini-apps",
          "/seo-pack",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/clutety",
          "/clutety/*",
          "/pyracrypt",
          "/pyracrypt/*",
          "/clutter",
          "/clutter/*",
          "/clutety-shell",
          "/clutety-shell/*",
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
        ],
      },
    ],
    sitemap: [getSitemapUrl(), getSecuritySitemapUrl()],
    host: baseUrl,
  };
}
