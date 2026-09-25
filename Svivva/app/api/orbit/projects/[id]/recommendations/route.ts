import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { listOpenRecommendations } from "@/lib/orbit/analytics";

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

  const campaignId = request.nextUrl.searchParams.get("campaignId") || undefined;
  const recommendations = await listOpenRecommendations(projectId, campaignId);

  return NextResponse.json({
    recommendations: recommendations.map((r) => ({
      id: r.id,
      kind: r.kind,
      priority: r.priority,
      status: r.status,
      title: r.title,
      rationale: r.rationale,
      orbitCampaignId: r.orbitCampaignId,
      triggerEventId: r.triggerEventId,
      actionPayload: r.actionPayload,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
}
