import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runIndexHealth, getCoverageSnapshot } from "@/lib/seo/index-health";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET — fast coverage snapshot (no crawl). */
export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const snapshot = await getCoverageSnapshot();
  return NextResponse.json({ snapshot });
}

/**
 * POST — thorough index-health check.
 * Body: { resubmit?: boolean, googleMaxBatches?: number, sampleLimit?: number }
 * When resubmit is true, also re-pings IndexNow + Google for the stalest URLs.
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    resubmit?: boolean;
    googleMaxBatches?: number;
    sampleLimit?: number;
  };

  const health = await runIndexHealth({ sampleLimit: body.sampleLimit ?? 60 });

  let resubmission: unknown = null;
  if (body.resubmit) {
    const actions = await runAutomatableManualActions({
      googleMaxBatches: body.googleMaxBatches ?? 2,
    });
    resubmission = {
      summary: actions.summaryLines,
      indexNow: actions.indexNow,
      googleIndexing: actions.googleIndexing,
    };
  }

  return NextResponse.json({ ok: true, health, resubmission });
}
