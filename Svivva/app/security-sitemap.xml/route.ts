import {
  getSecuritySitemapEntries,
  getSecuritySitemapFallback,
} from "@/lib/seo/sitemap/security-tools";
import { sitemapUrlsetXml } from "@/lib/seo/sitemap/xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Security & cyber mini-app URLs — indexable public funnel pages on Svivva. */
export async function GET() {
  let entries;
  try {
    entries = await getSecuritySitemapEntries();
  } catch (err) {
    console.error("[security-sitemap.xml] generation failed, serving hub fallback:", err);
    entries = getSecuritySitemapFallback();
  }
  const xml = sitemapUrlsetXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
