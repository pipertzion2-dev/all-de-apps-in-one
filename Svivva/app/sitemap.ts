import type { MetadataRoute } from "next";
import { getSitemapEntries, getStaticSitemapFallback } from "@/lib/seo/sitemap/registry";

/** Single sitemap at /sitemap.xml — metadata route wins over `(seo)/[slug]`. */
export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await getSitemapEntries();
    return entries.map(({ url, lastModified, changeFrequency, priority }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }));
  } catch (err) {
    console.error("[sitemap.xml] generation failed, serving static fallback:", err);
    return getStaticSitemapFallback().map(({ url, lastModified, changeFrequency, priority }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }));
  }
}
