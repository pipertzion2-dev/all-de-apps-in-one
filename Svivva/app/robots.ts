import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-config";
import { getSecuritySitemapUrl, getSiteUrl, getSitemapUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: [getSitemapUrl(), getSecuritySitemapUrl()],
    host: baseUrl,
  };
}
