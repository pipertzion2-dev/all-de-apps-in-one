import { db } from "@/server/db";
import { blogPosts, seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
const SITEMAP_CHUNK_SIZE = 500;

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function uniqueByLoc(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (!entry.loc || seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

export async function getAllSitemapEntries(): Promise<SitemapEntry[]> {
  const nowIso = new Date().toISOString();

  const staticPages: SitemapEntry[] = [
    { loc: SITE_URL, lastmod: nowIso },
    { loc: absoluteUrl("/blog"), lastmod: nowIso },
    { loc: absoluteUrl("/tools"), lastmod: nowIso },
    { loc: absoluteUrl("/pyracrypt"), lastmod: nowIso },
    { loc: absoluteUrl("/about"), lastmod: nowIso },
    { loc: absoluteUrl("/contact"), lastmod: nowIso },
    { loc: absoluteUrl("/docs"), lastmod: nowIso },
    { loc: absoluteUrl("/privacy"), lastmod: nowIso },
    { loc: absoluteUrl("/terms"), lastmod: nowIso },
    { loc: absoluteUrl("/lp/ai-api-builder"), lastmod: nowIso },
    { loc: absoluteUrl("/lp/prompt-to-api"), lastmod: nowIso },
    { loc: absoluteUrl("/lp/ai-app-generator"), lastmod: nowIso },
  ];

  let blogPages: SitemapEntry[] = [];
  try {
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true));
    blogPages = posts.map((post) => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      lastmod: (post.updatedAt || post.publishedAt || post.createdAt || new Date()).toISOString(),
    }));
  } catch {}

  const PRIORITY_CATEGORIES: Record<string, number> = {
    "seo-landing": 0.85,
    "seed-marketing": 0.8,
    aeo: 0.8,
    "parasite-seo": 0.75,
  };
  void PRIORITY_CATEGORIES;

  let seoPages: SitemapEntry[] = [];
  try {
    const pages = await db.select().from(seoLandingPages).where(eq(seoLandingPages.published, true));
    seoPages = pages.map((page) => ({
      loc: absoluteUrl(`/${page.slug}`),
      lastmod: (page.createdAt || new Date()).toISOString(),
    }));
  } catch {}

  let categoryPages: SitemapEntry[] = [];
  try {
    const categories = await db.select().from(pageCategories);
    categoryPages = categories.map((cat) => ({
      loc: absoluteUrl(`/tools/category/${cat.slug}`),
      lastmod: nowIso,
    }));
  } catch {}

  return uniqueByLoc([...staticPages, ...blogPages, ...seoPages, ...categoryPages]);
}

export async function getSitemapChunks(): Promise<SitemapEntry[][]> {
  const entries = await getAllSitemapEntries();
  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += SITEMAP_CHUNK_SIZE) {
    chunks.push(entries.slice(i, i + SITEMAP_CHUNK_SIZE));
  }
  return chunks;
}

export function getSiteUrl(): string {
  return SITE_URL;
}
