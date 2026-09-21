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
      // Answer-engine / SearchDock crawlers — explicit allow for GEO manifests
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: [getSitemapUrl(), getSecuritySitemapUrl()],
    host: baseUrl,
  };
}
