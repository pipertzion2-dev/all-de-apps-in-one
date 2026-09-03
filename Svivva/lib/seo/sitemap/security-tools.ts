import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { isNonIndexableSlug } from "@/lib/seo/legacy-paths";
import {
  getAiHubFeatureSitemapPaths,
  getCyberFeatureSitemapPaths,
} from "@/lib/tools/catalogs/hub-feature-pages";

function featureEntries(base: string, now: Date): MetadataRoute.Sitemap {
  return [
    ...getCyberFeatureSitemapPaths().map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...getAiHubFeatureSitemapPaths().map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })),
  ];
}

/** Public indexable security / mini-app URLs (no auth, no redirects). */
export async function getSecuritySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();

  const hubs: MetadataRoute.Sitemap = [
    {
      url: `${base}/cyber-security-mini-apps`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${base}/ai-tools-hub`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = [...featureEntries(base, now)];

  try {
    const pages = await db
      .select({
        slug: seoLandingPages.slug,
        createdAt: seoLandingPages.createdAt,
        category: seoLandingPages.category,
        keyword: seoLandingPages.keyword,
      })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));

    for (const page of pages) {
      if (!page.slug || isNonIndexableSlug(page.slug)) continue;
      const isSecurity =
        page.category === "seed-marketing" ||
        /security|cyber|threat|password|scan|vuln|encrypt|shield|feed/i.test(
          `${page.slug} ${page.keyword ?? ""}`,
        );
      if (!isSecurity) continue;

      toolPages.push({
        url: `${base}/${page.slug}`,
        lastModified: page.createdAt || now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch {
    /* db unavailable during build */
  }

  return [...hubs, ...toolPages];
}

/** Hubs + feature pages — used when DB sitemap generation fails. */
export function getSecuritySitemapFallback(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();
  return [
    {
      url: `${base}/cyber-security-mini-apps`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${base}/ai-tools-hub`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    },
    ...featureEntries(base, now),
  ];
}
