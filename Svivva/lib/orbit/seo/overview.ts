import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orbitGscDailyMetrics,
  orbitIndexingChecks,
  orbitPublicApps,
  orbitSeoOpportunities,
} from "@/lib/orbit/seo/schema";
import { recalculateSeoOpportunities } from "./opportunities";
import { refreshIndexingCheck, syncCuratedMiniAppsToOrbit } from "./publish-pipeline";

/** Idempotent background refresh for Orbit SEO. Safe to retry. */
export async function runOrbitSeoJobs(workspaceId: string) {
  const sync = await syncCuratedMiniAppsToOrbit(workspaceId).catch((e) => ({
    error: e instanceof Error ? e.message : "sync failed",
  }));

  const apps = await db
    .select({ id: orbitPublicApps.id })
    .from(orbitPublicApps)
    .where(eq(orbitPublicApps.workspaceId, workspaceId));

  for (const a of apps) {
    await refreshIndexingCheck(workspaceId, a.id);
  }

  const opportunities = await recalculateSeoOpportunities(workspaceId).catch((e) => ({
    created: 0,
    error: e instanceof Error ? e.message : "opportunities failed",
  }));

  return {
    synced: Array.isArray(sync) ? sync.length : 0,
    checksRefreshed: apps.length,
    opportunities,
  };
}

export async function getSeoOverview(workspaceId: string) {
  let publicApps = 0;
  let indexable = 0;
  let needsAttention = 0;
  try {
    const apps = await db
      .select()
      .from(orbitPublicApps)
      .where(eq(orbitPublicApps.workspaceId, workspaceId));
    publicApps = apps.filter((a) => a.isPublic && a.status === "published").length;
    indexable = apps.filter((a) => a.indexable && a.isPublic && a.status === "published").length;
  } catch {
    /* tables may not exist yet */
  }

  try {
    const checks = await db
      .select()
      .from(orbitIndexingChecks)
      .where(eq(orbitIndexingChecks.workspaceId, workspaceId));
    needsAttention = checks.filter((c) => c.needsAttention).length;
  } catch {
    /* */
  }

  let clicks = 0;
  let impressions = 0;
  let ctr = 0;
  let position = 0;
  try {
    const daily = await db
      .select()
      .from(orbitGscDailyMetrics)
      .where(eq(orbitGscDailyMetrics.workspaceId, workspaceId))
      .orderBy(desc(orbitGscDailyMetrics.date))
      .limit(28);
    if (daily.length) {
      clicks = daily.reduce((s, d) => s + d.clicks, 0);
      impressions = daily.reduce((s, d) => s + d.impressions, 0);
      ctr = impressions > 0 ? clicks / impressions : 0;
      position = daily.reduce((s, d) => s + d.position, 0) / daily.length;
    }
  } catch {
    /* */
  }

  let topOpportunities: Array<{ id: string; title: string; recommendedAction: string }> = [];
  try {
    topOpportunities = await db
      .select({
        id: orbitSeoOpportunities.id,
        title: orbitSeoOpportunities.title,
        recommendedAction: orbitSeoOpportunities.recommendedAction,
      })
      .from(orbitSeoOpportunities)
      .where(
        and(
          eq(orbitSeoOpportunities.workspaceId, workspaceId),
          eq(orbitSeoOpportunities.status, "open"),
        ),
      )
      .limit(8);
  } catch {
    /* */
  }

  return {
    totalPublicMiniApps: publicApps,
    indexableApps: indexable,
    appsNeedingAttention: needsAttention,
    organicClicks: clicks,
    searchImpressions: impressions,
    ctr,
    averageGooglePosition: position,
    topOpportunities,
    disclaimer:
      "Orbit never claims a URL is “Google Indexed” unless verified from an appropriate Google-supported source. GSC metrics here are from Orbit-stored snapshots.",
  };
}
