import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { getCanonicalUrlsForIndexing } from "@/lib/seo/sitemap/registry";
import { isNonIndexableSlug } from "@/lib/seo/legacy-paths";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { recordSubmission } from "@/lib/seo/index-health";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type MiniAppCheck = {
  slug: string;
  url: string;
  name: string;
  inSitemap: boolean;
  httpStatus: number;
  live: boolean;
  indexable: boolean;
  funnelLink: boolean;
  notes: string;
};

async function checkPage(url: string): Promise<{
  httpStatus: number;
  live: boolean;
  indexable: boolean;
  funnelLink: boolean;
  notes: string;
}> {
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
      headers: { "User-Agent": "Svivva-MiniAppAudit/1.0" },
      cache: "no-store",
    });
    const xRobots = (r.headers.get("x-robots-tag") || "").toLowerCase();
    let noindex = xRobots.includes("noindex");
    let funnelLink = false;
    if (r.ok) {
      const body = await r.text();
      const meta = body.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || "";
      if (/noindex/i.test(meta)) noindex = true;
      // Funnel = at least one internal link toward the main product/CTA.
      funnelLink =
        /href=["'](\/|\/orbit|\/tools|\/seeds|\/pricing|\/signup|\/dashboard|https?:\/\/[^"']*svivva\.com)/i.test(
          body,
        );
    }
    return {
      httpStatus: r.status,
      live: r.ok,
      indexable: r.ok && !noindex,
      funnelLink,
      notes: r.ok ? (noindex ? "noindex" : "ok") : `HTTP ${r.status}`,
    };
  } catch (e) {
    return {
      httpStatus: 0,
      live: false,
      indexable: false,
      funnelLink: false,
      notes: e instanceof Error ? e.message : "fetch failed",
    };
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/**
 * POST — audit the mini-app / tool funnel pages.
 * Body: { sampleLimit?: number, submit?: boolean }
 * Confirms each tool page is in the sitemap, live, indexable, and links back to
 * the main product (engineering-as-marketing funnel), then optionally submits
 * them all to IndexNow + queues them first for Google.
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    sampleLimit?: number;
    submit?: boolean;
  };
  const sampleLimit = body.sampleLimit ?? 60;
  const base = getSiteUrl().replace(/\/$/, "");

  // Mini-apps = published tool/landing pages (the on-site funnel surface).
  const rows = await db
    .select({
      slug: seoLandingPages.slug,
      keyword: seoLandingPages.keyword,
      category: seoLandingPages.category,
      toolUrl: seoLandingPages.toolUrl,
    })
    .from(seoLandingPages)
    .where(eq(seoLandingPages.published, true));

  const toolRows = rows.filter(
    (r) =>
      r.slug &&
      !isNonIndexableSlug(r.slug) &&
      (r.category === "seed-marketing" || r.category === "seo-landing" || !!r.toolUrl),
  );

  const sitemapUrls = new Set(await getCanonicalUrlsForIndexing());
  const allToolUrls = toolRows.map((r) => `${base}/${r.slug}`);
  const inSitemapCount = allToolUrls.filter((u) => sitemapUrls.has(u)).length;

  // Crawl a sample to verify they actually render + funnel.
  const sample = [...toolRows].sort(() => Math.random() - 0.5).slice(0, sampleLimit);
  const checks: MiniAppCheck[] = await mapWithConcurrency(sample, 8, async (r) => {
    const url = `${base}/${r.slug}`;
    const c = await checkPage(url);
    return {
      slug: r.slug,
      url,
      name: r.keyword || r.slug,
      inSitemap: sitemapUrls.has(url),
      ...c,
    };
  });

  const live = checks.filter((c) => c.live).length;
  const indexable = checks.filter((c) => c.indexable).length;
  const withFunnel = checks.filter((c) => c.funnelLink).length;
  const problems = checks.filter((c) => !c.indexable || !c.inSitemap || !c.funnelLink);

  // Submit every tool page to IndexNow now; queue them first for Google.
  let indexNow: { ok: boolean; submitted: number; total: number } = {
    ok: false,
    submitted: 0,
    total: allToolUrls.length,
  };
  if (body.submit !== false && allToolUrls.length > 0) {
    try {
      const r = await submitIndexNowBatched(allToolUrls);
      indexNow = { ok: r.ok, submitted: r.submittedCount, total: r.totalUrls };
      await recordSubmission(allToolUrls);
    } catch {
      /* best effort */
    }
  }

  return NextResponse.json({
    ok: problems.length === 0,
    totalMiniApps: toolRows.length,
    inSitemap: inSitemapCount,
    sampled: checks.length,
    live,
    indexable,
    withFunnelLink: withFunnel,
    indexNow,
    summary:
      `${toolRows.length} mini-app/tool pages found · ${inSitemapCount} in sitemap · ` +
      `sample: ${live}/${checks.length} live, ${indexable}/${checks.length} indexable, ` +
      `${withFunnel}/${checks.length} link to the main product.`,
    problems: problems.slice(0, 25),
  });
}
