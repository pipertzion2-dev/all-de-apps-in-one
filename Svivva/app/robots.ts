import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/*", "/tools", "/tools/*", "/lp/*", "/about", "/contact", "/docs", "/privacy", "/terms"],
        disallow: ["/dashboard", "/dashboard/*", "/api", "/api/*", "/_next", "/gate", "/play", "/seeds"],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/pyracrypt/sitemap.xml`],
  };
}
