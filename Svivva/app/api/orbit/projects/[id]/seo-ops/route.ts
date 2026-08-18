import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import {
  parseSeoOpsSnapshot,
  runSeoOpsGate,
  saveSeoOpsSnapshot,
} from "@/lib/orbit/routes/seo-ops-gate";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** GET — last SEO ops gate snapshot for a project. */
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

  const snapshot = parseSeoOpsSnapshot(project.metadata as Record<string, unknown>);
  return NextResponse.json({ seoOps: snapshot });
}

/** POST — run SEO ops gate now and persist snapshot. */
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

  let body: { minIndexHealthScore?: number; strict?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const result = await runSeoOpsGate({
      strict: body.strict !== false,
      minIndexHealthScore: body.minIndexHealthScore ?? 70,
      indexHealthSample: 30,
    });
    const snapshot = await saveSeoOpsSnapshot(projectId, user!.id, result);
    return NextResponse.json({ ...snapshot, ok: snapshot.ok });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
