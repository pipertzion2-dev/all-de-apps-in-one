import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages, blogPosts, seedCredentials } from "@/lib/schema";
import { eq, sql, isNotNull, desc } from "drizzle-orm";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getSiteUrl, getGoogleSearchConsoleInspectBase } from "@/lib/site-url";
import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { stepCompletionFromCounts } from "@/lib/orbit/fill-marketing-gaps";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import {
  TARGET_TOTAL_MARKETING_PAGES,
  TARGET_TOOL_SEO_PAGES,
  sumMarketingPages,
  computePagesPercent,
  computeIndexedPercent,
  computeIndexHealthScore,
} from "@/lib/orbit/marketing-targets";

export async function GET() {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

    const orbitFreeAi = !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim());
    const hasPaidOpenAiKey = !!(
      getOpenAIApiKey()?.trim() && getOpenAIApiKey()!.trim().startsWith("sk-")
    );

    const counts = {
      seoPages: seoRows.length,
      comparisons: comparisons.length,
      blogPosts: blogRows.length,
      aeoPages: aeoRows.length,
      seedMarketing: Number((seedRows[0] as { count?: number })?.count ?? 0),
      hubExists: hubPage.length > 0,
      indexNowKey: !!cred?.indexnowKey,
      indexNowSubmitted: !!cred?.lastIndexnowSubmit,
      integrationPages: Number((integRows[0] as { count?: number })?.count ?? 0),
      usecasePages: Number((usecaseRows[0] as { count?: number })?.count ?? 0),
      templatePages: Number((templateRows[0] as { count?: number })?.count ?? 0),
      paaPages: Number((paaRows[0] as { count?: number })?.count ?? 0),
    };

    const totalPages = sumMarketingPages(counts);
    const pagesPercent = computePagesPercent(totalPages);
    let indexableUrlCount = 0;
    if (cred?.indexnowKey) {
      try {
        indexableUrlCount = (await getAllSiteUrlsForIndexing()).length;
      } catch {
        indexableUrlCount = totalPages;
      }
    }
    const toolSeoComplete = counts.seedMarketing >= TARGET_TOOL_SEO_PAGES;
    const indexedPercent = computeIndexedPercent({
      indexNowSubmitted: counts.indexNowSubmitted,
      indexNowOk: counts.indexNowSubmitted,
      submittedCount: counts.indexNowSubmitted ? indexableUrlCount : 0,
      totalUrls: indexableUrlCount || totalPages,
      toolSeoComplete,
    });
    const indexHealthScore = computeIndexHealthScore(counts, {
      totalPages,
      indexedPercent,
    });

    const warnings: string[] = [];
    if (!cred?.indexnowKey)
      warnings.push(
        "IndexNow key not set yet — run “Set Up IndexNow” before expecting Bing/Yandex indexing.",
      );
    if (!cred?.lastIndexnowSubmit && !toolSeoComplete)
      warnings.push(
        "IndexNow has not been submitted yet — search engines may not have your latest URLs.",
      );
    if (toolSeoComplete && !cred?.lastIndexnowSubmit)
      warnings.push("Run Complete Now to submit all 300 tool pages to IndexNow.");
    if (!orbitFreeAi)
      warnings.push(
        "Orbit AI prose is in template mode. Add GEMINI_API_KEY (Google AI Studio, free tier) or OLLAMA_URL for AI-generated copy — paid OpenAI is not used in Orbit.",
      );

    const BASE = getSiteUrl();
    const gscBase = getGoogleSearchConsoleInspectBase();

    const coreUrls = [
      { label: "Homepage", url: `${BASE}/` },
      { label: "Pyracrypt", url: `${BASE}/pyracrypt` },
      { label: "Blog", url: `${BASE}/blog` },
      { label: "Tools Hub", url: `${BASE}/tools` },
      { label: "LP: Builder", url: `${BASE}/lp/ai-api-builder` },
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
      ...counts,
      totalPages,
      targetPages: TARGET_TOTAL_MARKETING_PAGES,
      targetToolSeoPages: TARGET_TOOL_SEO_PAGES,
      pagesPercent,
      indexedPercent,
      indexableUrlCount,
      stepCompletion: stepCompletionFromCounts(counts),
      coreUrls,
      toolUrls,
      deploymentCommit: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
      preflight: {
        orbitFreeAi,
        hasPaidOpenAiKey,
        indexHealthScore,
        warnings,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
