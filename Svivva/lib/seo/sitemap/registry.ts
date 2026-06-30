import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { blogPosts, seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { isNonIndexableSlug } from "@/lib/seo/legacy-paths";
import { scorePageContent } from "@/lib/seo/content-quality/score";

export const SITEMAP_CHUNK_IDS = ["pages", "blog", "tools", "features", "images"] as const;

export type SitemapChunkId = (typeof SITEMAP_CHUNK_IDS)[number];

export type SitemapEntry = MetadataRoute.Sitemap[number] & {
  chunk: SitemapChunkId;
};

const PRIORITY_BY_CATEGORY: Record<string, number> = {
  "seo-landing": 0.85,
  "seed-marketing": 0.8,
  aeo: 0.8,
  "parasite-seo": 0.75,
};

function base(): string {
  return getSiteUrl().replace(/\/$/, "");
}

function staticPagesEntries(): SitemapEntry[] {
  const b = base();
  const now = new Date();
  const defs: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.9, changeFrequency: "daily" },
    { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
    { path: "/ai-tools-hub", priority: 0.88, changeFrequency: "weekly" },
    { path: "/cyber-security-mini-apps", priority: 0.92, changeFrequency: "weekly" },
    { path: "/seo-pack", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.6, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/orbit", priority: 0.8, changeFrequency: "weekly" },
    { path: "/seeds", priority: 0.7, changeFrequency: "weekly" },
    { path: "/referrals", priority: 0.6, changeFrequency: "monthly" },
  ];

  return defs.map(({ path, priority, changeFrequency }) => ({
    url: `${b}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    chunk: "pages" as const,
  }));
}

function lpEntries(): SitemapEntry[] {
  const b = base();
  const now = new Date();
  return ["ai-api-builder", "prompt-to-api", "ai-app-generator"].map((slug) => ({
    url: `${b}/lp/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
    chunk: "features" as const,
  }));
}

/** Minimal sitemap when DB or runtime fails — keeps GSC from seeing 500 on /sitemap.xml. */
export function getStaticSitemapFallback(): SitemapEntry[] {
  return [...staticPagesEntries(), ...lpEntries()];
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const b = base();
  const entries: SitemapEntry[] = getStaticSitemapFallback();

  try {
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true));
    for (const post of posts) {
      entries.push({
        url: `${b}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || post.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        chunk: "blog",
      });
    }
  } catch {
    /* db */
  }

  try {
    const pages = await db
      .select()
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    for (const page of pages) {
      if (!page.slug || isNonIndexableSlug(page.slug)) continue;
      if (page.slug.startsWith("svivva-seo-tool-fill-")) continue;

      const quality = scorePageContent({
        title: page.title,
        content: page.content || "",
        howItWorks: page.howItWorks || undefined,
        whoItsFor: page.whoItsFor || undefined,
        hasFaq: /\[FAQ_JSON\]/i.test(page.content || ""),
      });
      if (!quality.passed) continue;

      const isTool =
        page.category === "seed-marketing" || page.category === "seo-landing" || !!page.toolUrl;
      entries.push({
        url: `${b}/${page.slug}`,
        lastModified: page.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: PRIORITY_BY_CATEGORY[page.category || ""] ?? 0.7,
        chunk: isTool ? "tools" : "pages",
      });
    }
  } catch {
    /* db */
  }

  try {
    const categories = await db.select().from(pageCategories);
    for (const cat of categories) {
      entries.push({
        url: `${b}/tools/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        chunk: "tools",
      });
    }
  } catch {
    /* db */
  }

  return entries;
}

export async function buildSitemapChunk(id: SitemapChunkId): Promise<MetadataRoute.Sitemap> {
  const all = await getSitemapEntries();
  if (id === "images") {
    const b = base();
    return all
      .filter((e) => e.chunk === "pages" || e.chunk === "tools")
      .slice(0, 20)
      .map((e) => ({
        url: e.url,
        lastModified: e.lastModified,
        changeFrequency: e.changeFrequency,
        priority: (e.priority ?? 0.5) * 0.9,
        images: [`${b}/svivva-logo.png`],
      }));
  }
  return all
    .filter((e) => e.chunk === id)
    .map(({ url, lastModified, changeFrequency, priority }) => ({
      url,
      lastModified,
      changeFrequency,
      priority,
    }));
}

/** Flat URL list for IndexNow — aligned with sitemap (canonical paths only). */
export async function getCanonicalUrlsForIndexing(): Promise<string[]> {
  const entries = await getSitemapEntries();
  return [...new Set(entries.map((e) => e.url))].sort();
}
