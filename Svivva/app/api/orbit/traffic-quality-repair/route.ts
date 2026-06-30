import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runTrafficQualityRepair } from "@/lib/orbit/traffic-quality-repair";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { submitIndexNowBatched } from "@/lib/indexing/indexnow-submit";
import { getAllSiteUrlsForIndexing } from "@/lib/indexing/site-urls";

export const maxDuration = 300;

/** POST — fix thin/duplicate SEO pages, heal links, re-submit sitemap URLs. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const repair = await runTrafficQualityRepair();

    const urls = await getAllSiteUrlsForIndexing();
    const indexNow = await submitIndexNowBatched(urls);

    const indexing = await runAutomatableManualActions({ googleMaxBatches: 2 });

    return NextResponse.json({
      ok: true,
      summary: [...repair.summaryLines, "", ...indexing.summaryLines].join("\n"),
      repair,
      indexNow: {
        ok: indexNow.ok,
        submitted: indexNow.submittedCount,
        total: indexNow.totalUrls,
      },
      indexing: {
        googleSitemap: indexing.googleSitemap,
        googleIndexing: indexing.googleIndexing,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
