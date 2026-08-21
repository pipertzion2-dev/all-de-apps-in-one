import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orbitGscDailyMetrics,
  orbitGscPageMetrics,
  orbitGscQueryMetrics,
  orbitPublicApps,
  orbitSeoOpportunities,
} from "@/lib/orbit/seo/schema";

/**
 * Derive actionable SEO opportunities from stored GSC snapshots + app metadata.
 * Does not iframe GSC — Orbit owns the UX.
 */
export async function recalculateSeoOpportunities(workspaceId: string) {
  const openKinds = new Set<string>();
  const created: string[] = [];

  async function upsertOpp(row: {
    kind: string;
    title: string;
    explanation: string;
    recommendedAction: string;
    severity?: string;
    appId?: string | null;
    metrics?: Record<string, number | string>;
  }) {
    const key = `${row.kind}:${row.appId || ""}:${row.title}`;
    if (openKinds.has(key)) return;
    openKinds.add(key);
    await db.insert(orbitSeoOpportunities).values({
      workspaceId,
      appId: row.appId || null,
      kind: row.kind,
      title: row.title,
      explanation: row.explanation,
      recommendedAction: row.recommendedAction,
      severity: row.severity || "medium",
      metrics: row.metrics,
      status: "open",
    });
    created.push(row.kind);
  }

  // Clear prior open auto opportunities (idempotent refresh)
  await db
    .update(orbitSeoOpportunities)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(orbitSeoOpportunities.workspaceId, workspaceId),
        eq(orbitSeoOpportunities.status, "open"),
      ),
    );

  const apps = await db
    .select()
    .from(orbitPublicApps)
    .where(eq(orbitPublicApps.workspaceId, workspaceId));

  const queries = await db
    .select()
    .from(orbitGscQueryMetrics)
    .where(eq(orbitGscQueryMetrics.workspaceId, workspaceId))
    .orderBy(desc(orbitGscQueryMetrics.impressions))
    .limit(200);

  for (const q of queries) {
    if (q.impressions >= 50 && q.ctr < 0.02) {
      await upsertOpp({
        kind: "high_impressions_low_ctr",
        title: `Low CTR for “${q.query}”`,
        explanation: `This query has ${q.impressions} impressions but CTR ${(q.ctr * 100).toFixed(1)}%.`,
        recommendedAction: "Tighten the title/meta description to match intent and improve the H1.",
        severity: "high",
        metrics: { impressions: q.impressions, ctr: q.ctr, position: q.position },
      });
    }
    if (q.position >= 4 && q.position <= 10) {
      await upsertOpp({
        kind: "positions_4_10",
        title: `Near page-one win: “${q.query}”`,
        explanation: `Average position ${q.position.toFixed(1)} (positions 4–10).`,
        recommendedAction:
          "Strengthen crawlable content, FAQs, and internal links to this mini-app.",
        metrics: { position: q.position, impressions: q.impressions },
      });
    }
    if (q.position >= 11 && q.position <= 20) {
      await upsertOpp({
        kind: "positions_11_20",
        title: `Page-two keyword: “${q.query}”`,
        explanation: `Average position ${q.position.toFixed(1)} (positions 11–20).`,
        recommendedAction: "Add clearer how-to sections and related internal links from hubs.",
        severity: "low",
        metrics: { position: q.position },
      });
    }
  }

  const pages = await db
    .select()
    .from(orbitGscPageMetrics)
    .where(eq(orbitGscPageMetrics.workspaceId, workspaceId))
    .limit(200);

  const pagesWithTraffic = new Set(pages.filter((p) => p.impressions > 0).map((p) => p.pageUrl));

  for (const app of apps) {
    if (app.status === "published" && app.isPublic) {
      const urlPart = `/apps/${app.slug}`;
      const hit = [...pagesWithTraffic].some((u) => u.includes(urlPart));
      if (!hit && pages.length > 0) {
        await upsertOpp({
          kind: "no_organic_impressions",
          title: `${app.name} has no organic impressions yet`,
          explanation: "No GSC snapshot rows show impressions for this public mini-app URL.",
          recommendedAction:
            "Confirm sitemap inclusion, internal links from /apps and hubs, then request indexing via Search Console (Orbit does not invent “Google Indexed” status).",
          appId: app.id,
          severity: "medium",
        });
      }
    }
  }

  const daily = await db
    .select()
    .from(orbitGscDailyMetrics)
    .where(eq(orbitGscDailyMetrics.workspaceId, workspaceId))
    .orderBy(desc(orbitGscDailyMetrics.date))
    .limit(14);

  if (daily.length >= 7) {
    const recent = daily.slice(0, 3).reduce((s, d) => s + d.clicks, 0);
    const prior = daily.slice(3, 6).reduce((s, d) => s + d.clicks, 0);
    if (prior > 10 && recent < prior * 0.6) {
      await upsertOpp({
        kind: "pages_losing_clicks",
        title: "Organic clicks declining",
        explanation: `Recent 3-day clicks (${recent}) are down vs prior 3-day (${prior}).`,
        recommendedAction:
          "Review top landing pages for title changes, cannibalization, or ranking drops.",
        severity: "high",
        metrics: { recent, prior },
      });
    }
  }

  return { created: created.length };
}

/** Optional premium layer — core indexing works without Ahrefs. */
export async function fetchAhrefsInsights(_workspaceId: string): Promise<{
  enabled: boolean;
  message: string;
  modules: string[];
}> {
  if (!process.env.AHREFS_API_KEY?.trim()) {
    return {
      enabled: false,
      message: "Ahrefs not configured. Orbit indexing, sitemap, and GSC snapshots work without it.",
      modules: [],
    };
  }
  return {
    enabled: true,
    message:
      "Ahrefs API key detected — Site Audit, backlinks, and keyword modules can be refreshed via jobs.",
    modules: [
      "site_audit",
      "backlinks",
      "referring_domains",
      "organic_keywords",
      "competitors",
      "ranking_opportunities",
      "technical_seo",
    ],
  };
}
