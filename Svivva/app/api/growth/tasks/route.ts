import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { db } from "@/lib/db";
import { growthTasks } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { getInternalAppOrigin } from "@/lib/internal-app-origin";
import { getSecuritySitemapUrl, getSitemapUrl } from "@/lib/site-url";
import { forbidden, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  const tasks = await db.select().from(growthTasks).orderBy(desc(growthTasks.runAt)).limit(100);
  return ok({ tasks });
}

export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  const isInternal =
    !!process.env.ORBIT_INTERNAL_SECRET &&
    req.headers.get("x-internal-secret") === process.env.ORBIT_INTERNAL_SECRET;

  const internalSecret = process.env.ORBIT_INTERNAL_SECRET || "";
  const results: { task: string; status: string; detail?: string }[] = [];
  const appOrigin = getInternalAppOrigin();

  const mainSitemap = getSitemapUrl();
  const securitySitemap = getSecuritySitemapUrl();

  // 1. Ping Svivva sitemap (Bing only — Google retired ?ping= in June 2023.
  //    The real GSC submission happens via the scheduler's submit_sitemap action,
  //    which calls the Webmasters v3 API with a stored service-account.)
  try {
    const b = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(mainSitemap)}`, {
      signal: AbortSignal.timeout(8000),
    });
    await db.insert(growthTasks).values({
      taskType: "sitemap_ping",
      product: "svivva",
      status: "completed",
      details: { bing: b.status },
    });
    results.push({ task: "Svivva sitemap ping", status: "ok", detail: `Bing ${b.status}` });
  } catch (e: any) {
    results.push({ task: "Svivva sitemap ping", status: "error", detail: e.message });
  }

  // 2. Ping security / cyber mini-apps sitemap (Bing only)
  try {
    const b = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(securitySitemap)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    await db.insert(growthTasks).values({
      taskType: "sitemap_ping",
      product: "mini_apps",
      status: "completed",
      details: { bing: b.status },
    });
    results.push({
      task: "Security tools sitemap ping",
      status: "ok",
      detail: `Bing ${b.status}`,
    });
  } catch (e: any) {
    results.push({ task: "Security tools sitemap ping", status: "error", detail: e.message });
  }

  // 3. IndexNow submission for Svivva
  try {
    const r = await fetch(`${appOrigin}/api/indexnow/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
      },
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json().catch(() => ({}));
    await db.insert(growthTasks).values({
      taskType: "indexnow_submit",
      product: "svivva",
      status: r.ok ? "completed" : "failed",
      details: d,
    });
    results.push({
      task: "IndexNow submission",
      status: r.ok ? "ok" : "warn",
      detail: d.error || `${d.urlCount ?? 0} URLs submitted`,
    });
  } catch (e: any) {
    results.push({ task: "IndexNow submission", status: "error", detail: e.message });
  }

  // 4. Log weekly run summary
  await db.insert(growthTasks).values({
    taskType: "weekly_run",
    status: "completed",
    details: {
      results,
      triggeredBy: isInternal ? "internal_scheduler" : "manual",
      timestamp: new Date().toISOString(),
    },
  });

  return ok({ success: true, results });
}
