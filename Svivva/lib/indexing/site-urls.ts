import { db } from "@/lib/db";
import { blogPosts, seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Public URLs for IndexNow, Orbit, and marketing dashboards.
 * Keep aligned with `app/sitemap.ts` (same paths; sitemap adds lastModified only).
 */
export async function getAllSiteUrlsForIndexing(): Promise<string[]> {
  const baseUrl = getSiteUrl().replace(/\/$/, "");

  const staticUrls = [
    baseUrl,
    `${baseUrl}/blog`,
    `${baseUrl}/tools`,
    `${baseUrl}/pyracrypt`,
    `${baseUrl}/ai-tools-hub`,
    `${baseUrl}/cyber-security-mini-apps`,
    `${baseUrl}/seo-pack`,
    `${baseUrl}/orbit`,
    `${baseUrl}/seeds`,
    `${baseUrl}/referrals`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/docs`,
    `${baseUrl}/privacy`,
    `${baseUrl}/terms`,
  ];

  let blogUrls: string[] = [];
  try {
    const posts = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    blogUrls = posts.map((p) => `${baseUrl}/blog/${p.slug}`);
  } catch {
    /* db unavailable */
  }

  let seoUrls: string[] = [];
  try {
    const pages = await db
      .select({ slug: seoLandingPages.slug })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    seoUrls = pages.map((p) => `${baseUrl}/${p.slug}`);
  } catch {
    /* db unavailable */
  }

  let categoryUrls: string[] = [];
  try {
    const categories = await db.select({ slug: pageCategories.slug }).from(pageCategories);
    categoryUrls = categories.map((c) => `${baseUrl}/tools/category/${c.slug}`);
  } catch {
    /* db unavailable */
  }

  const lpUrls = [
    `${baseUrl}/lp/ai-api-builder`,
    `${baseUrl}/lp/prompt-to-api`,
    `${baseUrl}/lp/ai-app-generator`,
  ];

  const marketingHubUrls = [
    `${baseUrl}/marketing-hub`,
    `${baseUrl}/marketing-hub/campaigns`,
    `${baseUrl}/marketing-hub/leads`,
    `${baseUrl}/marketing-hub/referrals`,
    `${baseUrl}/marketing-hub/utm`,
    `${baseUrl}/marketing-hub/amplify`,
    `${baseUrl}/marketing-hub/ab-tests`,
  ];

  const merged = [
    ...staticUrls,
    ...blogUrls,
    ...seoUrls,
    ...categoryUrls,
    ...lpUrls,
    ...marketingHubUrls,
  ];
  return [...new Set(merged)].sort();
}
