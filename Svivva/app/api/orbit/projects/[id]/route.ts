import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById, getOrbitGraph } from "@/lib/orbit/ingest";
import { updateExternalAnalyticsConfig } from "@/lib/orbit/analytics/external-signals";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const project = await getOrbitProjectById(id, user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const graph = await getOrbitGraph(id);

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      sourceType: project.sourceType,
      sourceRef: project.sourceRef,
      status: project.status,
      metadata: project.metadata,
      normalizedSummary: project.normalizedSummary,
      ingestedAt: project.ingestedAt,
      ingestError: project.ingestError,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    entities: graph.entities,
    links: graph.links,
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const project = await getOrbitProjectById(id, user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: { ga4PropertyId?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.ga4PropertyId === undefined) {
    return NextResponse.json({ error: "ga4PropertyId required" }, { status: 400 });
  }

  const config = await updateExternalAnalyticsConfig(id, user!.id, {
    ga4PropertyId: body.ga4PropertyId?.trim() || undefined,
  });

  return NextResponse.json({ ok: true, externalAnalytics: config });
}
