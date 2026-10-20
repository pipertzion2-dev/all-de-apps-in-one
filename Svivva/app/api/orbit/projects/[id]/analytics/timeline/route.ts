import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { listEventsForProject } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
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

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 100), 500);
  const campaignId = request.nextUrl.searchParams.get("campaignId") || undefined;
  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  const events = await listEventsForProject(projectId, {
    limit,
    since: since && !Number.isNaN(since.getTime()) ? since : undefined,
    campaignId,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      occurredAt: e.occurredAt,
      orbitCampaignId: e.orbitCampaignId,
      contentAssetId: e.contentAssetId,
      dimensions: e.dimensions,
      metrics: e.metrics,
      metadata: e.metadata,
    })),
  });
}
