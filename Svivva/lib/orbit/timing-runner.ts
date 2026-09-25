import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { runIndexHealth } from "@/lib/seo/index-health";
import { runSeoMonitor } from "@/lib/seo/monitoring/detector";
import { fetchGscSearchAnalytics } from "@/lib/seo/gsc-search-analytics";
import { healOrphanInternalLinks } from "@/lib/seo/internal-links/graph";
import { profileForTimingStep } from "@/lib/orbit/timing-cadence";
import type { TimingPlanStep } from "@/lib/orbit/timing-plan";

export type TimingRunResult = {
  ok: boolean;
  summary: string;
  detail?: Record<string, unknown>;
};

async function runTimingIndexingStep(stepId: string): Promise<TimingRunResult> {
  const profile = profileForTimingStep(stepId);
  if (!profile) {
    return { ok: false, summary: `No indexing profile for ${stepId}` };
  }
  const indexing = await runAutomatableManualActions({
    skipIndexingApi: profile.skipIndexingApi,
    skipGoogleSitemap: profile.skipGoogleSitemap,
    indexNowMaxUrlsOverride: profile.indexNowMaxUrls,
    indexingApiMaxUrls: profile.indexingApiMaxUrls || undefined,
    googleMaxBatches: 1,
  });
  const ok =
    indexing.indexNow.ok ||
    indexing.googleIndexing.submitted > 0 ||
    (profile.skipIndexingApi && indexing.indexNow.submittedCount > 0);
  return {
    ok,
    summary: indexing.summaryLines.join("\n"),
    detail: {
      indexNow: indexing.indexNow,
      googleIndexing: indexing.googleIndexing,
      profile,
    },
  };
}

export async function runTimingAutomatedStep(step: TimingPlanStep): Promise<TimingRunResult> {
  switch (step.id) {
    case "foundation-sitemap": {
      const userId = await resolveGscCredentialsUserId();
      const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
      if (!accessToken) {
        return {
          ok: false,
          summary:
            "Connect Google at /dashboard/gsc-connect first — this step only registers the sitemap via API.",
        };
      }
      const setup = await runGscAutoSetup({
        userId,
        accessToken,
        skipIndexingApi: true,
      });
      return {
        ok: setup.ok && setup.sitemapOk,
        summary: setup.message,
        detail: {
          siteUrl: setup.siteUrl,
          sitemapOk: setup.sitemapOk,
          securitySitemapOk: setup.securitySitemapOk,
        },
      };
    }
    case "baseline-audit":
    case "seo-monitor": {
      const monitor = await runSeoMonitor();
      const critical = monitor.alerts.filter((a) => a.severity === "critical").length;
      const isBaseline = step.id === "baseline-audit";
      return {
        ok: isBaseline ? true : critical === 0,
        summary:
          critical === 0
            ? `${isBaseline ? "Baseline" : "Monitor"} OK — ${monitor.metrics.sitemapUrls} sitemap URLs, ${monitor.metrics.orphanCount} orphans, ${monitor.alerts.length} alert(s).`
            : `${critical} critical alert(s): ${monitor.alerts
                .filter((a) => a.severity === "critical")
                .slice(0, 3)
                .map((a) => a.message)
                .join(" · ")}`,
        detail: { alerts: monitor.alerts.slice(0, 8), metrics: monitor.metrics },
      };
    }
    case "internal-link-heal": {
      const heal = await healOrphanInternalLinks();
      return {
        ok: true,
        summary: heal.updated
          ? `✓ Healed internal links on ${heal.updated} page(s) — crawl paths improved before indexing nudges.`
          : "✓ No orphan pages needed link heal (or graph already healthy).",
        detail: { updated: heal.updated },
      };
    }
    case "index-batch-1":
    case "index-batch-2":
    case "index-weekly":
    case "index-weekly-maintain":
      return runTimingIndexingStep(step.id);
    case "health-sample": {
      const health = await runIndexHealth({ sampleLimit: 40 });
      const ok = health.score >= 70;
      return {
        ok,
        summary: `${health.summary} (score ${health.score}/100, sampled ${health.sampled}/${health.total})`,
        detail: { health },
      };
    }
    case "performance-review": {
      const gsc = await fetchGscSearchAnalytics({ days: 28, rowLimit: 100 });
      if (!gsc.ok) {
        return { ok: false, summary: gsc.error || "Could not load Search Console analytics." };
      }
      const impressions = gsc.queries.reduce((n, q) => n + q.impressions, 0);
      const clicks = gsc.queries.reduce((n, q) => n + q.clicks, 0);
      return {
        ok: true,
        summary: `Property ${gsc.siteUrl}: ${impressions.toLocaleString()} impressions, ${clicks} clicks, ${gsc.pages.length} pages with data (28d). Zero is common early — keep weekly Timing, not daily floods.`,
        detail: {
          impressions,
          clicks,
          topQueries: gsc.queries.slice(0, 5),
          topPages: gsc.pages.slice(0, 5),
        },
      };
    }
    default:
      return { ok: false, summary: `No automated runner for step ${step.id}` };
  }
}
