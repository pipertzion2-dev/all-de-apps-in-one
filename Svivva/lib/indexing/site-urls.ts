import { getCanonicalUrlsForIndexing } from "@/lib/seo/sitemap/registry";

/**
 * Public URLs for IndexNow, Orbit, and marketing dashboards.
 * Single source of truth with split sitemaps — canonical paths only (/{slug}, not /tools/{slug}).
 */
export async function getAllSiteUrlsForIndexing(): Promise<string[]> {
  return getCanonicalUrlsForIndexing();
}
