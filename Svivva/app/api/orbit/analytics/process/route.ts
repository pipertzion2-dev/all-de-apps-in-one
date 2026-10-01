import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed, isInternalSecretAuthorized } from "@/lib/orbit/admin-access";
import { getOrbitProjectById, getOrbitProjectByIdInternal } from "@/lib/orbit/ingest";
import { processProjectAnalytics } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST — backfill events and generate recommendations for a project (cron or admin). */
export async function POST(request: NextRequest) {
  const internal = isInternalSecretAuthorized(request);
  let userId: string | undefined;

  if (!internal) {
    const { user, error } = await requireUser();
    if (error) return error;
    if (!(await isOrbitAdminAllowed(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    userId = user!.id;
  }

  let body: { projectId?: string; userId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "projectId required in JSON body" }, { status: 400 });
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  if (internal) {
    const project = await getOrbitProjectByIdInternal(body.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    userId = body.userId || project.userId;
  } else if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOrbitProjectById(body.projectId, userId!);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const result = await processProjectAnalytics(body.projectId, userId!);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
