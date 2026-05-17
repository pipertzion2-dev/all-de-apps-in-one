import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runSiteAudit } from "@/lib/seo/audit/run-audit";
import { buildInternalLinkMap } from "@/lib/seo/internal-links/graph";
import { buildAnalyticsMap } from "@/lib/seo/analytics-events";
import { buildPerformanceReport } from "@/lib/seo/performance/budget";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  if (!(await isOrbitAdminAllowed())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [audit, internalLinkMap] = await Promise.all([runSiteAudit(), buildInternalLinkMap()]);

  return NextResponse.json({
    ...audit,
    internal_link_map: internalLinkMap,
    analytics_map: buildAnalyticsMap(),
    performance_report: buildPerformanceReport({
      hasImageConfig: true,
      hasCacheHeaders: true,
    }),
  });
}
