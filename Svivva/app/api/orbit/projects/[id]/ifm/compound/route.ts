import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { compoundIfmWinnersForProject } from "@/lib/orbit/ifm/ifm-compound";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** POST — rescore with per-pair GA4, expand winners, and ship new bridge pages. */
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

  let body: {
    expandCount?: number;
    shipExpanded?: boolean;
    autoPrune?: boolean;
    syncGa4?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const summary = await compoundIfmWinnersForProject(projectId, user!.id, body);
    return NextResponse.json({
      ok: true,
      ...summary,
      winners: summary.winners.map((p) => ({
        id: p.id,
        fusionTitle: p.fusionTitle,
        score: p.score?.total ?? 0,
        sessions7d: p.score?.sessions7d,
        conversions7d: p.score?.conversions7d,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
