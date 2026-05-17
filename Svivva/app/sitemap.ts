import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/seo/sitemap/registry";

/** Single sitemap at /sitemap.xml — avoids conflict with `(seo)/[slug]` and route handlers. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return entries.map(({ url, lastModified, changeFrequency, priority }) => ({
    url,
    lastModified,
    changeFrequency,
    priority,
  }));
}
