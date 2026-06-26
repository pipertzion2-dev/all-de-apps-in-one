import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runFullTrafficAutomation } from "@/lib/orbit/full-traffic-automation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await runFullTrafficAutomation();

    return NextResponse.json({
      ok: true,
      summary: result.summaryLines.join("\n"),
      stepCompletion: result.stepCompletion,
      automationContext: {
        indexNowOk: result.indexing.indexNow.ok,
        googleSitemapOk: result.indexing.googleSitemap.ok,
        googleIndexingSubmitted: result.indexing.googleIndexing.submitted,
      },
      counts: result.marketing.counts,
      indexNow: result.indexing.indexNow,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
