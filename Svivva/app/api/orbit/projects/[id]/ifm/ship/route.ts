import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { shipIfmBridgesForProject } from "@/lib/orbit/ifm";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** POST — ship planned IFM pairings as published SEO bridge pages. */
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

  let body: { pairingIds?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const summary = await shipIfmBridgesForProject(projectId, user!.id, {
      pairingIds: body.pairingIds,
    });
    return NextResponse.json({
      ...summary,
      ok: summary.failed === 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
