import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getOrbitProjectById } from "@/lib/orbit/ingest";
import {
  OAAS_GROWTH_MATRIX,
  getSceneMatrix,
  runSceneMatrixForProject,
} from "@/lib/orbit/routes/scene-matrix";
import { emitOrbitEvent } from "@/lib/orbit/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET — list available OaaS scene matrices. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    matrices: [
      {
        id: OAAS_GROWTH_MATRIX.id,
        name: OAAS_GROWTH_MATRIX.name,
        description: OAAS_GROWTH_MATRIX.description,
        sceneCount: OAAS_GROWTH_MATRIX.scenes.length,
        scenes: OAAS_GROWTH_MATRIX.scenes.map((s) => ({
          id: s.id,
          label: s.label,
          templateId: s.templateId,
          hybridStrategyId: s.hybridStrategyId,
        })),
      },
    ],
  });
}

/** POST — create and/or run scene matrix routes for a project. */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    projectId?: string;
    matrixId?: string;
    createMissing?: boolean;
    runRoutes?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.projectId?.trim()) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await getOrbitProjectById(body.projectId.trim(), user!.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const matrixId = body.matrixId || OAAS_GROWTH_MATRIX.id;
  if (!getSceneMatrix(matrixId)) {
    return NextResponse.json({ error: "Unknown matrix" }, { status: 400 });
  }

  try {
    const result = await runSceneMatrixForProject(user!.id, project.id, matrixId, {
      createMissing: body.createMissing,
      runRoutes: body.runRoutes,
    });

    await emitOrbitEvent({
      orbitProjectId: project.id,
      eventType: "scene_matrix_completed",
      source: "internal",
      idempotencyKey: `matrix:${matrixId}:${project.id}:${Date.now()}`,
      dimensions: {
        matrixId,
        routesCreated: result.routesCreated,
        routesRun: result.routesRun,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
