import { NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import { fillMarketingGaps } from "@/lib/orbit/fill-marketing-gaps";

export const maxDuration = 300;

export async function POST() {
  try {
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
    const result = await fillMarketingGaps(userId);

    return NextResponse.json({
      ok: result.indexNow.ok,
      summary: result.steps.join("\n"),
      details: {
        totalUrls: result.indexNow.totalUrls,
        indexNowOk: result.indexNow.ok,
        counts: result.counts,
        stepCompletion: result.counts,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
