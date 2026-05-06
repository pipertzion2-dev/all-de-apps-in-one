import { getSiteUrl, getSitemapChunks } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();
  const chunks = await getSitemapChunks();

  const sitemapLinks = chunks
    .map(
      (_chunk, index) =>
        `<sitemap><loc>${siteUrl}/sitemaps/${index + 1}.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
