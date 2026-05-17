import { NextRequest, NextResponse } from "next/server";
import { getInternalAppOrigin } from "@/lib/internal-app-origin";

export const dynamic = "force-dynamic";

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

  if (job === "growth" || job === "all") {
    const growth = await fetch(`${origin}/api/growth/tasks`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(90_000),
    }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }));
    out.growth = growth;
  }

  return NextResponse.json({ success: true, ...out });
}
