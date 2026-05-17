import { SITEMAP_CHUNK_IDS } from "@/lib/seo/sitemap/registry";
import { getSiteUrl } from "@/lib/site-url";

/** Sitemap index — explicit route so `(seo)/[slug]` does not capture `/sitemap.xml`. */
export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const body = SITEMAP_CHUNK_IDS.map(
    (id) => `  <sitemap>\n    <loc>${base}/sitemap/${id}.xml</loc>\n  </sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
