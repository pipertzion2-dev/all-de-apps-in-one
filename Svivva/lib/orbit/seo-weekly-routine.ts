/**
 * SEO Weekly Routine — automates the 14-step weekly SEO checklist from the Orbit playbook.
 * Runs via Orbit admin UI, cron (Mondays), and marketing autopilot.
 */
import { db } from "@/lib/db";
import { growthTasks } from "@/lib/schema";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { fillMarketingGaps } from "@/lib/orbit/fill-marketing-gaps";
import { generateIntentFusionPages } from "@/lib/orbit/intent-fusion-pages";
import {
  buildSeoLearningRoadmap,
  SEO_WEEKLY_ROUTINE_TASK_TYPE,
} from "@/lib/orbit/seo-learning-roadmap";
import { runTrafficQualityRepair } from "@/lib/orbit/traffic-quality-repair";
import { healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";
import { runIndexHealth } from "@/lib/seo/index-health";
import { runSeoMonitor } from "@/lib/seo/monitoring/detector";
import {
  fetchGscSearchAnalytics,
  type GscSearchAnalyticsReport,
} from "@/lib/seo/gsc-search-analytics";
import { runSiteAudit } from "@/lib/seo/audit/run-audit";
import { checkSeoDeployGates } from "@/lib/seo/audit/deploy-gates";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";
import { generateJson, getMarketingModel, isOrbitAiConfigured } from "@/lib/orbit/ai-client";
import { getSiteUrl } from "@/lib/site-url";

export type WeeklyTaskStatus = "done" | "partial" | "skipped" | "needs_credentials" | "failed";

export type WeeklyTaskResult = {
  id: string;
  label: string;
  status: WeeklyTaskStatus;
  message: string;
  data?: Record<string, unknown>;
};

export type SeoWeeklyRoutineResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  tasks: WeeklyTaskResult[];
  gsc: GscSearchAnalyticsReport | null;
  roadmap: Awaited<ReturnType<typeof buildSeoLearningRoadmap>>;
  summary: string;
  stats: {
    done: number;
    partial: number;
    failed: number;
    needsCredentials: number;
  };
};

function task(
  id: string,
  label: string,
  status: WeeklyTaskStatus,
  message: string,
  data?: Record<string, unknown>,
): WeeklyTaskResult {
  return { id, label, status, message, data };
}

function statsFromTasks(tasks: WeeklyTaskResult[]) {
  return {
    done: tasks.filter((t) => t.status === "done").length,
    partial: tasks.filter((t) => t.status === "partial").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    needsCredentials: tasks.filter((t) => t.status === "needs_credentials").length,
  };
}

function buildSummary(tasks: WeeklyTaskResult[], gsc: GscSearchAnalyticsReport | null): string {
  const lines = [
    "═══ SEO Weekly Routine ═══",
    "",
    ...tasks.map((t) => {
      const icon =
        t.status === "done"
          ? "✓"
          : t.status === "partial"
            ? "◐"
            : t.status === "needs_credentials"
              ? "🔑"
              : "✗";
      return `${icon} ${t.label}: ${t.message}`;
    }),
  ];
  if (gsc?.ok) {
    lines.push(
      "",
      `GSC (${gsc.startDate} → ${gsc.endDate}):`,
      `  · ${gsc.queries.length} queries tracked`,
      `  · ${gsc.nearPageOne.length} keywords in positions 5–20`,
      `  · ${gsc.lowCtrPages.length} pages with high impressions, low CTR`,
      `  · ${gsc.newQueries.length} new/rising queries`,
    );
  } else if (gsc?.error) {
    lines.push("", `GSC: ${gsc.error}`);
  }
  return lines.join("\n");
}

type KeywordIdea = {
  keyword: string;
  contentType: "blog" | "seo-landing" | "comparison";
  titleSuggestion: string;
};

async function researchKeywordsFromGsc(gsc: GscSearchAnalyticsReport): Promise<KeywordIdea[]> {
  const seeds = [
    ...gsc.nearPageOne.slice(0, 5).map((q) => q.keys[0]),
    ...gsc.newQueries.slice(0, 5).map((q) => q.keys[0]),
  ].filter(Boolean);

  if (!isOrbitAiConfigured() || seeds.length === 0) {
    return seeds.slice(0, 8).map((kw) => ({
      keyword: kw,
      contentType: "seo-landing" as const,
      titleSuggestion: kw.slice(0, 60),
    }));
  }

  try {
    const prompt = `ZZAI is an AI API builder + free tools platform at zzaizzai.com.
Given these GSC queries with ranking opportunity, propose 8 NEW long-tail keywords we should target next.
Do NOT repeat these seeds: ${seeds.join(", ")}

Return ONLY a JSON array: [{ "keyword": "...", "contentType": "blog|seo-landing|comparison", "titleSuggestion": "..." }]`;
    const ideas = await generateJson<KeywordIdea[]>(prompt, { maxTokens: 2000 });
    return Array.isArray(ideas) ? ideas.slice(0, 8) : [];
  } catch {
    return [];
  }
}

/** Execute the full 14-step weekly SEO routine. */
export async function runSeoWeeklyRoutine(opts?: {
  skipContentGeneration?: boolean;
  fusionPages?: number;
}): Promise<SeoWeeklyRoutineResult> {
  const startedAt = new Date().toISOString();
  const tasks: WeeklyTaskResult[] = [];
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";

  // 1. Check Google Search Console
  const gsc = await fetchGscSearchAnalytics({ days: 28 });
  tasks.push(
    task(
      "gsc-check",
      "Check Google Search Console",
      gsc.ok ? "done" : "needs_credentials",
      gsc.ok
        ? `Connected — ${gsc.queries.length} queries, site ${gsc.siteUrl}`
        : gsc.error || "GSC not connected",
      gsc.ok
        ? {
            queryCount: gsc.queries.length,
            clickSum: gsc.queries.reduce((s, q) => s + q.clicks, 0),
            impressionSum: gsc.queries.reduce((s, q) => s + q.impressions, 0),
          }
        : undefined,
    ),
  );

  // 2. Look at new search queries
  tasks.push(
    task(
      "new-queries",
      "Review new search queries",
      gsc.ok ? (gsc.newQueries.length ? "done" : "partial") : "skipped",
      gsc.ok
        ? `${gsc.newQueries.length} new/rising queries found`
        : "Skipped — connect GSC for query data",
      gsc.ok ? { queries: gsc.newQueries.slice(0, 10).map((q) => q.keys[0]) } : undefined,
    ),
  );

  // 3. Find pages getting impressions
  tasks.push(
    task(
      "impression-pages",
      "Find pages getting impressions",
      gsc.ok ? "done" : "skipped",
      gsc.ok ? `${gsc.pages.length} pages with search impressions` : "Skipped — connect GSC",
      gsc.ok
        ? {
            topPages: gsc.pages
              .slice(0, 5)
              .map((p) => ({ page: p.keys[0], impressions: p.impressions })),
          }
        : undefined,
    ),
  );

  // 4. Keywords ranking positions 5–20
  tasks.push(
    task(
      "near-page-one",
      "Keywords ranking positions 5–20",
      gsc.ok ? (gsc.nearPageOne.length ? "done" : "partial") : "skipped",
      gsc.ok ? `${gsc.nearPageOne.length} keywords close to page 1` : "Skipped — connect GSC",
      gsc.ok
        ? {
            keywords: gsc.nearPageOne.slice(0, 10).map((q) => ({
              query: q.keys[0],
              position: q.position,
              impressions: q.impressions,
            })),
          }
        : undefined,
    ),
  );

  // 5. High impressions, low CTR
  tasks.push(
    task(
      "low-ctr",
      "Pages with high impressions, low CTR",
      gsc.ok ? (gsc.lowCtrPages.length ? "done" : "partial") : "skipped",
      gsc.ok
        ? `${gsc.lowCtrPages.length} pages need title/meta improvements`
        : "Skipped — connect GSC",
      gsc.ok
        ? {
            pages: gsc.lowCtrPages.slice(0, 5).map((p) => ({
              page: p.keys[0],
              ctr: Math.round(p.ctr * 1000) / 10,
              impressions: p.impressions,
            })),
          }
        : undefined,
    ),
  );

  // 6. Improve existing pages
  let qualityMsg = "No changes needed";
  let qualityStatus: WeeklyTaskStatus = "done";
  try {
    const repair = await runTrafficQualityRepair();
    const improved = repair.expandedThin + repair.duplicateTitlesFixed + repair.unpublishedFiller;
    qualityMsg = improved
      ? `Expanded ${repair.expandedThin} thin pages, fixed ${repair.duplicateTitlesFixed} dup titles, unpublished ${repair.unpublishedFiller} filler`
      : "All pages pass quality gate";
    if (repair.stillThin > 0) qualityStatus = "partial";
  } catch (e) {
    qualityStatus = "failed";
    qualityMsg = e instanceof Error ? e.message : String(e);
  }
  tasks.push(task("improve-pages", "Improve existing pages", qualityStatus, qualityMsg));

  // 7. Add internal links
  let linkMsg = "No orphans to heal";
  let linkStatus: WeeklyTaskStatus = "done";
  try {
    const heal = await healOrphanInternalLinks();
    linkMsg = heal.updated
      ? `Added related links on ${heal.updated} pages`
      : "Internal link graph healthy";
    if (heal.updated === 0 && gsc?.ok && gsc.lowCtrPages.length > 0) linkStatus = "partial";
  } catch (e) {
    linkStatus = "failed";
    linkMsg = e instanceof Error ? e.message : String(e);
  }
  tasks.push(task("internal-links", "Add internal links", linkStatus, linkMsg));

  // 8. Research new keywords
  let keywordIdeas: KeywordIdea[] = [];
  try {
    keywordIdeas = gsc.ok ? await researchKeywordsFromGsc(gsc) : [];
    tasks.push(
      task(
        "keyword-research",
        "Research new keywords",
        keywordIdeas.length ? "done" : isOrbitAiConfigured() ? "partial" : "partial",
        keywordIdeas.length
          ? `${keywordIdeas.length} keyword opportunities (${isOrbitAiConfigured() ? getMarketingModel() : "GSC seeds"})`
          : "No new keywords identified — run again after GSC data accumulates",
        { ideas: keywordIdeas.slice(0, 5) },
      ),
    );
  } catch (e) {
    tasks.push(
      task(
        "keyword-research",
        "Research new keywords",
        "failed",
        e instanceof Error ? e.message : String(e),
      ),
    );
  }

  // 9–10. Create landing pages + content
  if (!opts?.skipContentGeneration) {
    try {
      const marketing = await fillMarketingGaps(userId);
      const fusion = await generateIntentFusionPages(opts?.fusionPages ?? 3);
      const created =
        marketing.counts.seoPages +
        marketing.counts.blogPosts +
        marketing.counts.comparisons +
        fusion.created;
      tasks.push(
        task(
          "landing-pages",
          "Create useful landing pages",
          created ? "done" : "partial",
          created
            ? `Filled content gaps — ${marketing.counts.seoPages} SEO, ${fusion.created} fusion pages`
            : "No new pages needed — targets met",
          { counts: marketing.counts, fusion: fusion.slugs },
        ),
      );
      tasks.push(
        task(
          "content",
          "Create useful content",
          marketing.counts.blogPosts ? "done" : "partial",
          marketing.counts.blogPosts
            ? `${marketing.counts.blogPosts} new blog posts, ${marketing.counts.comparisons} comparisons`
            : "Blog/comparison targets already met",
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tasks.push(task("landing-pages", "Create useful landing pages", "failed", msg));
      tasks.push(task("content", "Create useful content", "failed", msg));
    }
  } else {
    tasks.push(task("landing-pages", "Create useful landing pages", "skipped", "Skipped this run"));
    tasks.push(task("content", "Create useful content", "skipped", "Skipped this run"));
  }

  // 11. Backlink opportunities
  const backlinkTargets = gsc.ok
    ? gsc.lowCtrPages.slice(0, 5).map((p) => ({
        page: p.keys[0],
        action: "Improve title/meta and pitch as resource to relevant communities",
      }))
    : [];
  tasks.push(
    task(
      "backlinks",
      "Backlink opportunities",
      backlinkTargets.length ? "partial" : "skipped",
      backlinkTargets.length
        ? `${backlinkTargets.length} high-impression pages flagged for outreach`
        : "Connect GSC or wait for impression data",
      { targets: backlinkTargets },
    ),
  );

  // 12. Check indexing problems
  let indexMsg = "Index health OK";
  let indexStatus: WeeklyTaskStatus = "done";
  try {
    const health = await runIndexHealth({ sampleLimit: 40 });
    if (health.blocked > 0 || health.problems.length > 5) {
      indexStatus = "partial";
      indexMsg = `${health.blocked} blocked URLs, ${health.problems.length} problems (score ${health.score}/100)`;
    } else {
      indexMsg = `Index health ${health.score}/100 — ${health.indexable}/${health.sampled} sample URLs indexable`;
    }
  } catch (e) {
    indexStatus = "failed";
    indexMsg = e instanceof Error ? e.message : String(e);
  }
  tasks.push(task("indexing", "Check indexing problems", indexStatus, indexMsg));

  // 13. Technical SEO issues
  let techStatus: WeeklyTaskStatus = "done";
  let techMsg = "No critical technical issues";
  try {
    const [monitor, gates] = await Promise.all([runSeoMonitor(), checkSeoDeployGates()]);
    const critical = monitor.alerts.filter((a) => a.severity === "critical").length;
    if (critical > 0 || !gates.pass) {
      techStatus = "partial";
      techMsg = `${critical} critical alerts, ${gates.issues.length} deploy gate issue(s)`;
    } else {
      techMsg = `Monitor OK — ${monitor.metrics.sitemapUrls} sitemap URLs, ${monitor.metrics.orphanCount} orphans`;
    }
    tasks.push(
      task("technical-seo", "Check technical SEO issues", techStatus, techMsg, {
        alerts: monitor.alerts.slice(0, 5),
        gates: gates.issues.slice(0, 5),
      }),
    );
  } catch (e) {
    tasks.push(
      task(
        "technical-seo",
        "Check technical SEO issues",
        "failed",
        e instanceof Error ? e.message : String(e),
      ),
    );
  }

  // 14. Measure signups and conversions
  tasks.push(
    task(
      "conversions",
      "Measure signups & conversions from organic",
      "partial",
      "Track in GA4 (G-QL8EXZZMS6) + Search Console Performance report — connect GSC for click→signup funnel",
      {
        ga4: process.env.NEXT_PUBLIC_GA_ID || "G-QL8EXZZMS6",
        gscPerformanceUrl: gsc.siteUrl
          ? "https://search.google.com/search-console/performance/search-analytics"
          : undefined,
        site: getSiteUrl(),
      },
    ),
  );

  // Re-submit updated URLs to search engines
  try {
    const urls = await getAllSiteUrlsForIndexing();
    await submitIndexNowBatched(urls.slice(0, 200));
  } catch {
    /* non-blocking */
  }

  const roadmap = await buildSeoLearningRoadmap();
  const finishedAt = new Date().toISOString();
  const stats = statsFromTasks(tasks);
  const summary = buildSummary(tasks, gsc);
  const ok = stats.failed === 0 && stats.needsCredentials <= 1;

  const result: SeoWeeklyRoutineResult = {
    ok,
    startedAt,
    finishedAt,
    tasks,
    gsc: gsc.ok ? gsc : null,
    roadmap,
    summary,
    stats,
  };

  try {
    await db.insert(growthTasks).values({
      taskType: SEO_WEEKLY_ROUTINE_TASK_TYPE,
      product: "orbit",
      status: ok ? "completed" : "partial",
      details: {
        result,
        summary,
        stats,
        gscConnected: gsc.ok,
      },
    });
  } catch {
    /* DB optional */
  }

  return result;
}

/** Load the most recent weekly routine result from growth_tasks. */
export async function loadLatestSeoWeeklyRoutine(): Promise<SeoWeeklyRoutineResult | null> {
  try {
    const { desc, eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(growthTasks)
      .where(eq(growthTasks.taskType, SEO_WEEKLY_ROUTINE_TASK_TYPE))
      .orderBy(desc(growthTasks.runAt))
      .limit(1);
    const details = rows[0]?.details as { result?: SeoWeeklyRoutineResult } | null;
    return details?.result?.startedAt ? details.result : null;
  } catch {
    return null;
  }
}

/** Quick audit-only pass (no content generation) for deploy checks. */
export async function runSeoTechnicalCheck(): Promise<{
  audit: Awaited<ReturnType<typeof runSiteAudit>>;
  gates: Awaited<ReturnType<typeof checkSeoDeployGates>>;
  monitor: Awaited<ReturnType<typeof runSeoMonitor>>;
}> {
  const [audit, gates, monitor] = await Promise.all([
    runSiteAudit(),
    checkSeoDeployGates(),
    runSeoMonitor(),
  ]);
  return { audit, gates, monitor };
}
