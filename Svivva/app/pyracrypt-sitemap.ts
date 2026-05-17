import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Pyracrypt product URLs — referenced from robots.txt */
export default function pyracryptSitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();
  return [
    {
      url: `${base}/pyracrypt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];
}
