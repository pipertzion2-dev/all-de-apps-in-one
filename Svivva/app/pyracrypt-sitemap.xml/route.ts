import { getSiteUrl } from "@/lib/site-url";
import { sitemapUrlsetXml } from "@/lib/seo/sitemap/xml";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const xml = sitemapUrlsetXml([
    {
      url: `${base}/clutter`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
