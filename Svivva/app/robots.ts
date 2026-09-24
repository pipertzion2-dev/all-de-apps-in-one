import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-config";
import { getSecuritySitemapUrl, getSiteUrl, getSitemapUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().replace(/\/$/, "");
  let host = "zzaizzai.com";
  try {
    host = new URL(baseUrl).host;
  } catch {
    /* keep default */
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/static/"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      // Answer-engine / SearchDock crawlers — explicit allow for GEO manifests
      {
        userAgent: "GPTBot",
        allow: ["/", "/_next/static/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/_next/static/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/_next/static/", "/llms.txt", "/llms-full.txt", "/brand.json"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/_next/static/"],
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: [getSitemapUrl(), getSecuritySitemapUrl()],
    host,
  };
}
