import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed, isInternalSecretAuthorized } from "@/lib/orbit/admin-access";
import { getOrbitProjectById, getOrbitProjectByIdInternal } from "@/lib/orbit/ingest";
import { emitExternalEvent } from "@/lib/orbit/analytics";
import { verifyProjectWebhookAuth } from "@/lib/orbit/analytics/webhook-auth";
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
  const { id: projectId } = await params;
  const rawBody = await request.text();

  let body: IngestBody = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const webhookOk = await verifyProjectWebhookAuth(
    projectId,
    rawBody,
    request.headers.get("x-orbit-webhook-signature"),
  );
  const internal = isInternalSecretAuthorized(request);

  let authorized = webhookOk || internal;

  if (!authorized) {
    const { user, error } = await requireUser();
    if (error) return error;
    authorized = await isOrbitAdminAllowed(request);
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const project = await getOrbitProjectById(projectId, user!.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  } else {
    const project = await getOrbitProjectByIdInternal(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  if (!body.eventType || !ORBIT_EVENT_TYPES.includes(body.eventType as (typeof ORBIT_EVENT_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid or missing eventType" }, { status: 400 });
  }

  const source = body.source || (webhookOk ? "webhook" : "internal");
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
