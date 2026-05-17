import { getSitemapEntries } from "@/lib/seo/sitemap/registry";
import { sitemapUrlsetXml } from "@/lib/seo/sitemap/xml";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getSitemapEntries();
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
