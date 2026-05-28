import { getSecuritySitemapEntries } from "@/lib/seo/sitemap/security-tools";
import { sitemapUrlsetXml } from "@/lib/seo/sitemap/xml";

export const dynamic = "force-dynamic";

/** Security & cyber mini-app URLs — indexable public funnel pages on Svivva. */
export async function GET() {
  const entries = await getSecuritySitemapEntries();
  const xml = sitemapUrlsetXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
