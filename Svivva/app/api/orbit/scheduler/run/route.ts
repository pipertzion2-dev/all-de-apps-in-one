import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runOrbitScheduler, getSchedulerStatus } from "@/lib/orbit/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** POST — run multi-project Orbit production scheduler (cron or admin). */
export async function POST(request: NextRequest) {
  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { maxProjects?: number; runAutopilot?: boolean; skipGlobalSteps?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  const result = await runOrbitScheduler(body);
  return NextResponse.json({ ok: true, ...result });
}

/** GET — latest scheduler run status. */
export async function GET(request: NextRequest) {
  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getSchedulerStatus();
  return NextResponse.json(status);
}
