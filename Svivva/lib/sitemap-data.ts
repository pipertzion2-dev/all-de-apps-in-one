import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

export interface SitemapChunk {
  id: number;
  urls: string[];
}

export async function getSitemapChunks(): Promise<SitemapChunk[]> {
  // Static pages only for now - will add dynamic pages from schema later
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/marketing`,
    `${SITE_URL}/referrals`,
    `${SITE_URL}/orbit`,
  ];

  const CHUNK_SIZE = 1000;
  const chunks: SitemapChunk[] = [];

  const allUrls = [...staticUrls];

  for (let i = 0; i < allUrls.length; i += CHUNK_SIZE) {
    chunks.push({
      id: chunks.length + 1,
      urls: allUrls.slice(i, i + CHUNK_SIZE),
    });
  }

  return chunks;
}

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
