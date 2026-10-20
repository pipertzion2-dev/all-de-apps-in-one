import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { updateRoadmapItem } from "@/lib/orbit/roadmap";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string; itemId: string }> };

/** PATCH — update a single roadmap item (approve, archive, notes). */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId, itemId } = await params;
  const project = await getOrbitProjectById(projectId, user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: {
    status?: "proposed" | "approved" | "shipped" | "archived";
    notes?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const item = await updateRoadmapItem(projectId, user!.id, itemId, body);
    if (!item) {
      return NextResponse.json({ error: "Roadmap item not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
