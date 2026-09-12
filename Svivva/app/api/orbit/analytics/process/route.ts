import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { processProjectAnalytics } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST — backfill events and generate recommendations for a project (cron or admin). */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { projectId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "projectId required in JSON body" }, { status: 400 });
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  try {
    const result = await processProjectAnalytics(body.projectId, user!.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
