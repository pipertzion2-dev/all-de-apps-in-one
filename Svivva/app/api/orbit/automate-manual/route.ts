import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await runAutomatableManualActions();
    return NextResponse.json({
      ok: true,
      summary: result.summaryLines.join("\n"),
      ...result,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
