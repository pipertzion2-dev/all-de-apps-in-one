import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { emitExternalEvent } from "@/lib/orbit/analytics";
import { ORBIT_EVENT_SOURCES, ORBIT_EVENT_TYPES } from "@/lib/orbit/graph-constants";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

type IngestBody = {
  eventType?: string;
  source?: string;
  idempotencyKey?: string;
  orbitCampaignId?: string;
  dimensions?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const project = await getOrbitProjectById(projectId, user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: IngestBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.eventType || !ORBIT_EVENT_TYPES.includes(body.eventType as (typeof ORBIT_EVENT_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid or missing eventType" }, { status: 400 });
  }

  const source = body.source || "webhook";
  if (!ORBIT_EVENT_SOURCES.includes(source as (typeof ORBIT_EVENT_SOURCES)[number])) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (!body.idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
  }

  const event = await emitExternalEvent({
    orbitProjectId: projectId,
    eventType: body.eventType as (typeof ORBIT_EVENT_TYPES)[number],
    source: source as (typeof ORBIT_EVENT_SOURCES)[number],
    idempotencyKey: body.idempotencyKey,
    orbitCampaignId: body.orbitCampaignId,
    dimensions: body.dimensions,
    metrics: body.metrics,
  });

  return NextResponse.json({ ok: true, event });
}
