import { getCanonicalUrlsForIndexing } from "@/lib/seo/sitemap/registry";
import { getMiniAppUrlsForIndexing } from "@/lib/orbit/mini-app-curation";

/**
 * Public URLs for IndexNow, Orbit, and marketing dashboards.
 * Single source of truth with split sitemaps — canonical paths only (/{slug}, not /tools/{slug}).
 */
export async function getAllSiteUrlsForIndexing(): Promise<string[]> {
  return getCanonicalUrlsForIndexing();
}

/** Mini-app hub + native tool URLs — submitted first so every slice gets indexed. */
export async function getPriorityMiniAppUrlsForIndexing(): Promise<string[]> {
  const all = new Set(await getCanonicalUrlsForIndexing());
  return getMiniAppUrlsForIndexing().filter((url) => all.has(url));
}
