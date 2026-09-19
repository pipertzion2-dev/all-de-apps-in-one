import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { processDistributionQueue } from "@/lib/orbit/distribution";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST — process pending orbit_distribution_jobs (cron or admin). */
export async function POST(request: NextRequest) {
  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  const result = await processDistributionQueue({ limit: body.limit ?? 10 });
  return NextResponse.json({ ok: true, ...result });
}
