import type { MetadataRoute } from "next";
import {
  SITEMAP_CHUNK_IDS,
  buildSitemapChunk,
  type SitemapChunkId,
} from "@/lib/seo/sitemap/registry";

export async function generateSitemaps() {
  return SITEMAP_CHUNK_IDS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<SitemapChunkId>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  return buildSitemapChunk(id);
}
