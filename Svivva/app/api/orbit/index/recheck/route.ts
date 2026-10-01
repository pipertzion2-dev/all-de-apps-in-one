import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runIndexRecheck } from "@/lib/orbit/indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST — recheck due orbit_index_records (cron or admin). */
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

  const result = await runIndexRecheck(body.limit ?? 50);
  return NextResponse.json({ ok: true, ...result });
}
