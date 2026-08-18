import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { rescoreIfmPairingsForProject } from "@/lib/orbit/ifm";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** POST — rescore IFM pairings from index status, events, and external analytics. */
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

  let body: { autoPrune?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const summary = await rescoreIfmPairingsForProject(projectId, user!.id, {
      autoPrune: body.autoPrune,
    });
    return NextResponse.json({
      ok: true,
      ...summary,
      leaderboard: summary.leaderboard.slice(0, 20).map((p) => ({
        id: p.id,
        fusionTitle: p.fusionTitle,
        slug: p.slug,
        status: p.status,
        score: p.score?.total ?? 0,
        toolA: p.toolA.name,
        toolB: p.toolB.name,
      })),
      winners: summary.winners.map((p) => ({
        id: p.id,
        fusionTitle: p.fusionTitle,
        score: p.score?.total ?? 0,
      })),
      pruneCandidates: summary.pruneCandidates.map((p) => ({
        id: p.id,
        fusionTitle: p.fusionTitle,
        score: p.score?.total ?? 0,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
