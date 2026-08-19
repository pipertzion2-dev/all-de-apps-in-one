import { getSiteUrl } from "@/lib/site-url";

/** @deprecated Prefer {@link getSitemapEntries} from lib/seo/sitemap/registry — kept for legacy chunk helpers. */
export interface SitemapChunk {
  id: number;
  urls: string[];
}

/** @deprecated Use lib/seo/sitemap/registry for canonical sitemap generation. */
export async function getSitemapChunks(): Promise<SitemapChunk[]> {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const staticUrls = [`${siteUrl}/`, `${siteUrl}/orbit`, `${siteUrl}/referrals`, `${siteUrl}/marketing`];

  const CHUNK_SIZE = 1000;
  const chunks: SitemapChunk[] = [];

  for (let i = 0; i < staticUrls.length; i += CHUNK_SIZE) {
    chunks.push({
      id: chunks.length + 1,
      urls: staticUrls.slice(i, i + CHUNK_SIZE),
    });
  }

  return chunks;
}

/** @deprecated */
export async function getSitemapChunk(id: number): Promise<string> {
  const chunks = await getSitemapChunks();
  const chunk = chunks.find((c) => c.id === id);

  if (!chunk) return "";

  return chunk.urls
    .map(
      (url) =>
        `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("\n");
}
