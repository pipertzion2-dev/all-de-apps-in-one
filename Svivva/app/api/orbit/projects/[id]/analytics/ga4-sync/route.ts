import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { pullGa4MetricsForProject } from "@/lib/orbit/analytics/ga4-data-api";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** POST — pull 7-day GA4 metrics for a project when ga4PropertyId is configured. */
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

  try {
    const result = await pullGa4MetricsForProject(projectId, user!.id);
    return NextResponse.json({
      ...result,
      ok: Boolean(result.ok && !result.skipped),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
