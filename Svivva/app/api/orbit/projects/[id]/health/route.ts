import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { buildProjectHealthSnapshot, dispatchProjectAlerts } from "@/lib/orbit/monitoring";

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

  const health = await buildProjectHealthSnapshot(projectId, user!.id);

  const dispatch = request.nextUrl.searchParams.get("dispatchAlerts") === "1";
  let alertDispatch;
  if (dispatch) {
    alertDispatch = await dispatchProjectAlerts({
      projectId,
      projectName: project.name,
      alerts: health.alerts,
    });
  }

  return NextResponse.json({ health, alertDispatch });
}
