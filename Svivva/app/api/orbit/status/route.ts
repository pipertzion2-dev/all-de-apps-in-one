import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq, sql, isNotNull, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { getSiteUrl, getGoogleSearchConsoleInspectBase } from "@/lib/site-url";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [
      seoRows,
      blogRows,
      aeoRows,
      seedRows,
      credRows,
      miniRows,
      integRows,
      usecaseRows,
      templateRows,
      paaRows,
    ] = await Promise.all([
      db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "seo-landing")),
      db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.published, true)),
      db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "aeo")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "seed-marketing")),
      db
        .select({
          indexnowKey: seedCredentials.indexnowKey,
          lastIndexnowSubmit: seedCredentials.lastIndexnowSubmit,
        })
        .from(seedCredentials)
        .where(isNotNull(seedCredentials.indexnowKey))
        .orderBy(desc(seedCredentials.updatedAt))
        .limit(1),
      db
        .select({ slug: seoLandingPages.slug })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "seed-marketing"))
        .limit(50),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "integration")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "usecase")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "template")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, "paa")),
    ]);

    const comparisons = seoRows.filter((p) => p.slug.startsWith("svivva-vs-"));
    const hubPage = await db
      .select({ id: seoLandingPages.id })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, "ai-tools-hub"))
      .limit(1);

    const cred = credRows[0];

    const BASE = getSiteUrl();
    const gscBase = getGoogleSearchConsoleInspectBase();

    const coreUrls = [
      { label: "Homepage", url: `${BASE}/` },
      { label: "Pyracrypt", url: `${BASE}/pyracrypt` },
      { label: "Blog", url: `${BASE}/blog` },
      { label: "Tools Hub", url: `${BASE}/tools` },
      { label: "LP: AI API Builder", url: `${BASE}/lp/ai-api-builder` },
      { label: "LP: Prompt to API", url: `${BASE}/lp/prompt-to-api` },
      { label: "LP: AI App Generator", url: `${BASE}/lp/ai-app-generator` },
    ].map(({ label, url }) => ({ label, url, gscLink: gscBase + encodeURIComponent(url) }));

    const toolUrls = [
      ...seoRows.map((p) => ({
        label: p.slug,
        url: `${BASE}/${p.slug}`,
        gscLink: gscBase + encodeURIComponent(`${BASE}/${p.slug}`),
      })),
      ...aeoRows.map((p) => ({
        label: p.slug,
        url: `${BASE}/${p.slug}`,
        gscLink: gscBase + encodeURIComponent(`${BASE}/${p.slug}`),
      })),
      ...miniRows.map((p) => ({
        label: p.slug,
        url: `${BASE}/${p.slug}`,
        gscLink: gscBase + encodeURIComponent(`${BASE}/${p.slug}`),
      })),
    ];

    return NextResponse.json({
      seoPages: seoRows.length,
      comparisons: comparisons.length,
      blogPosts: blogRows.length,
      aeoPages: aeoRows.length,
      seedMarketing: Number((seedRows[0] as any)?.count ?? 0),
      hubExists: hubPage.length > 0,
      indexNowKey: !!cred?.indexnowKey,
      indexNowSubmitted: !!cred?.lastIndexnowSubmit,
      integrationPages: Number((integRows[0] as any)?.count ?? 0),
      usecasePages: Number((usecaseRows[0] as any)?.count ?? 0),
      templatePages: Number((templateRows[0] as any)?.count ?? 0),
      paaPages: Number((paaRows[0] as any)?.count ?? 0),
      coreUrls,
      toolUrls,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
