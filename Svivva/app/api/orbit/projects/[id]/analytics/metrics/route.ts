import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed, isInternalSecretAuthorized } from "@/lib/orbit/admin-access";
import { getOrbitProjectById, getOrbitProjectByIdInternal } from "@/lib/orbit/ingest";
import { ingestExternalMetrics, syncExternalSignalsForProject } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

type MetricsBody = {
  sessions7d?: number;
  conversions7d?: number;
  previousSessions7d?: number;
  sync?: boolean;
};

/** POST — ingest external analytics metrics (GA4 proxy / webhook batch). */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const { id: projectId } = await params;

  if (internal) {
    const project = await getOrbitProjectByIdInternal(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    userId = project.userId;
  }

  let body: MetricsBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const project = await getOrbitProjectById(projectId, userId!);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const config = await ingestExternalMetrics(projectId, userId!, {
    sessions7d: body.sessions7d,
    conversions7d: body.conversions7d,
    previousSessions7d: body.previousSessions7d,
  });

  let sync = { emitted: 0, config };
  if (body.sync !== false) {
    sync = await syncExternalSignalsForProject(projectId, userId!);
  }

  return NextResponse.json({ ok: true, config, sync });
}
