import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import {
  generateIfmPairings,
  appendIfmPairings,
  persistIfmPairingEntities,
  getIfmPairingsForProject,
  updateIfmProjectConfig,
} from "@/lib/orbit/ifm";
import { emitOrbitEvent } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** POST — generate and persist IFM pairings for a project. */
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

  let body: { count?: number; weekSeed?: string } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  const count = Math.min(Math.max(body.count ?? 3, 1), 10);
  const existing = await getIfmPairingsForProject(projectId, user!.id);
  const excludePairKeys = existing.map((p) =>
    [p.toolA.path, p.toolB.path].sort().join("|"),
  );

  const pairings = generateIfmPairings({
    count,
    weekSeed: body.weekSeed,
    excludePairKeys,
  });

  if (!pairings.length) {
    return NextResponse.json({ ok: true, created: 0, pairings: [] });
  }

  await appendIfmPairings(projectId, user!.id, pairings);
  for (const pairing of pairings) {
    await persistIfmPairingEntities(projectId, pairing);
    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_pair_generated",
      source: "internal",
      idempotencyKey: `ifm:${projectId}:${pairing.id}`,
      dimensions: {
        fusionTitle: pairing.fusionTitle,
        toolA: pairing.toolA.path,
        toolB: pairing.toolB.path,
      },
    });
  }

  return NextResponse.json({ ok: true, created: pairings.length, pairings });
}

/** GET — list persisted IFM pairings for a project. */
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

  const pairings = await getIfmPairingsForProject(projectId, user!.id);
  return NextResponse.json({ pairings });
}

/** PATCH — enable/disable IFM for a project. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  let body: { enabled?: boolean; pairCountPerRun?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const config = await updateIfmProjectConfig(projectId, user!.id, body);
  return NextResponse.json({ ok: true, ifm: config });
}
