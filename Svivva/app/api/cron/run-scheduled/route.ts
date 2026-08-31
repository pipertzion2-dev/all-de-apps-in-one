import { NextRequest, NextResponse } from "next/server";
import { getInternalAppOrigin } from "@/lib/internal-app-origin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Vercel Cron (GET) — secure with CRON_SECRET (sent as Authorization: Bearer).
 * Runs the same jobs as the local `server/index.ts` schedulers.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = req.nextUrl.searchParams.get("job") || "seo";
  const origin = getInternalAppOrigin();
  const orbit = process.env.ORBIT_INTERNAL_SECRET || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(orbit ? { "x-internal-secret": orbit } : {}),
  };

  const out: Record<string, unknown> = { job, origin };

  if (job === "seo" || job === "all") {
    const indexNow = await fetch(`${origin}/api/indexnow/submit`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(45_000),
    }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }));
    const gsc = await fetch(`${origin}/api/gsc/save`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "submit_sitemap" }),
      signal: AbortSignal.timeout(35_000),
    }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }));
    const { runSeoMonitor } = await import("@/lib/seo/monitoring/detector");
    const monitor = await runSeoMonitor();
    out.seo = { indexNow, gsc, monitor };
  }

  // Burns System — runs every ZZAI feature against zzaizzai.com itself as a
  // dependency graph. Superset of the `seo` job (it submits IndexNow, pushes the
  // GSC sitemap and runs the SEO monitor as graph nodes), so the 6am slot points
  // here instead of running both and double-submitting.
  if (job === "burns" || job === "all") {
    try {
      const { runBurnsSystem } = await import("@/lib/burns/burns-runner");
      const { recordBurnsAudit, saveBurnsRun } = await import("@/lib/burns/burns-store");
      const run = await runBurnsSystem({ trigger: "cron" });
      await saveBurnsRun(run);
      await recordBurnsAudit(run);
      out.burns = {
        ok: run.ok,
        summary: run.summary,
        counts: run.counts,
        truncated: run.truncated,
      };
    } catch (e) {
      out.burns = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
  }

  if (job === "growth" || job === "all") {
    const growth = await fetch(`${origin}/api/growth/tasks`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(90_000),
    }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }));
    out.growth = growth;
  }

  // Full on-site traffic engine — safe to repeat weekly: fills content gaps and
  // re-notifies search engines. Does NOT auto-post to social (avoids spam/bans).
  if (job === "autopilot" || job === "all") {
    try {
      const { runFullTrafficAutomation } = await import("@/lib/orbit/full-traffic-automation");
      const result = await runFullTrafficAutomation();
      out.autopilot = {
        ok: true,
        counts: result.marketing.counts,
        indexNow: result.indexing.indexNow.ok,
        googleSitemap: result.indexing.googleSitemap.ok,
      };
    } catch (e) {
      out.autopilot = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }

    // Weekly SEO routine — GSC insights, 14-step checklist, learning roadmap
    try {
      const { runSeoWeeklyRoutine } = await import("@/lib/orbit/seo-weekly-routine");
      const seoWeekly = await runSeoWeeklyRoutine();
      out.seoWeekly = {
        ok: seoWeekly.ok,
        stats: seoWeekly.stats,
        roadmapPercent: seoWeekly.roadmap.overallPercent,
        gscConnected: !!seoWeekly.gsc,
      };
    } catch (e) {
      out.seoWeekly = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
  }

  if (job === "channel-intel" || job === "all") {
    try {
      const { runDueChannelIntelWatches } = await import("@/lib/marketing/channel-intel-watch");
      out.channelIntel = await runDueChannelIntelWatches();
    } catch (e) {
      out.channelIntel = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
  }

  return NextResponse.json({ success: true, ...out });
}
