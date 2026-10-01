import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import {
  getRoadmapItemsForProject,
  feedIfmWinnersToRoadmap,
  parseRoadmapConfig,
} from "@/lib/orbit/roadmap";
import { db } from "@/lib/db";
import { orbitProjects } from "@/lib/orbit/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/** GET — list product roadmap items promoted from IFM winners. */
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

  const items = await getRoadmapItemsForProject(projectId, user!.id);
  const config = parseRoadmapConfig(project.metadata as Record<string, unknown>);
  return NextResponse.json({ items, roadmap: config });
}

/** POST — promote IFM winners to roadmap and ship micro-tools. */
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
    pairingIds?: string[];
    maxPromote?: number;
    shipMicroTools?: boolean;
    scoreThreshold?: number;
  } = {};
  try {
    body = await request.json();
  } catch {
    // defaults ok
  }

  try {
    const result = await feedIfmWinnersToRoadmap(projectId, user!.id, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — enable auto-promote for roadmap feed. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  let body: {
    autoPromote?: boolean;
    promoteScoreThreshold?: number;
    autoApprove?: boolean;
    approveScoreThreshold?: number;
    autoShip?: boolean;
    shipScoreThreshold?: number;
    approvalMode?: "manual" | "assisted" | "autonomous";
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const project = await getOrbitProjectById(projectId, user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseRoadmapConfig(meta);
  const next = { ...current, ...body };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, roadmap: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, user!.id)));

  return NextResponse.json({ ok: true, roadmap: next });
}
