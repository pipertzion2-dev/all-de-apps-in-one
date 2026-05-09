import { getSitemapChunks } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const index = Number(id) - 1;

  if (!Number.isInteger(index) || index < 0) {
    return new Response("Not found", { status: 404 });
  }

  const chunks = await getSitemapChunks();
  const chunk = chunks[index];

  if (!chunk) {
    return new Response("Not found", { status: 404 });
  }

  const urls = chunk
    .map(
      (entry) =>
        `<url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
