import { getSitemapEntries, getStaticSitemapFallback } from "@/lib/seo/sitemap/registry";
import { sitemapUrlsetXml } from "@/lib/seo/sitemap/xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Canonical /sitemap.xml — Node route handler (replaces metadata sitemap.ts for stable DB access). */
export async function GET() {
  let entries;
  try {
    entries = await getSitemapEntries();
  } catch (err) {
    console.error("[sitemap.xml] generation failed, serving static fallback:", err);
    entries = getStaticSitemapFallback();
  }

  const xml = sitemapUrlsetXml(
    entries.map(({ url, lastModified, changeFrequency, priority }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    })),
  );

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
