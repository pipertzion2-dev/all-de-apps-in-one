import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { blogPosts, seoLandingPages, pageCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
  const allProjects = getAllWorkspaceProjects();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${baseUrl}/pyracrypt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/ai-tools-hub`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/cyber-security-mini-apps`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/seo-pack`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${baseUrl}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${baseUrl}/orbit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/seeds`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/referrals`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true));
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || post.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {}

  // All published seoLandingPages are served at root /{slug} by the (seo)/[slug] route.
  // Never use /tools/ prefix here — that would conflict with what Google has indexed.
  const PRIORITY_CATEGORIES: Record<string, number> = {
    "seo-landing": 0.85,
    "seed-marketing": 0.8,
    aeo: 0.8,
    "parasite-seo": 0.75,
  };

  let seoPages: MetadataRoute.Sitemap = [];
  try {
    const pages = await db
      .select()
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    seoPages = pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.createdAt,
      changeFrequency: "weekly" as const,
      priority: PRIORITY_CATEGORIES[page.category || ""] ?? 0.7,
    }));
  } catch {}

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await db.select().from(pageCategories);
    categoryPages = categories.map((cat) => ({
      url: `${baseUrl}/tools/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {}

  const lpPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/lp/ai-api-builder`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lp/prompt-to-api`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/lp/ai-app-generator`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  const marketingHubPages: MetadataRoute.Sitemap = [
    "/marketing-hub",
    "/marketing-hub/campaigns",
    "/marketing-hub/leads",
    "/marketing-hub/referrals",
    "/marketing-hub/utm",
    "/marketing-hub/amplify",
    "/marketing-hub/ab-tests",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...seoPages, ...categoryPages, ...lpPages, ...marketingHubPages];
}
