import type { MetadataRoute } from "next";

export function sitemapUrlsetXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((e) => {
      const loc = escapeXml(e.url);
      const lastmod = e.lastModified
        ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>`
        : "";
      const changefreq = e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : "";
      const priority = e.priority !== undefined ? `<priority>${e.priority}</priority>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
