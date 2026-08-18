import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  createOrbitRoute,
  getHybridRouteSceneByStrategy,
  HYBRID_ROUTE_SCENES,
} from "@/lib/orbit/routes";

export const dynamic = "force-dynamic";

type Body = {
  hybridStrategyId?: string;
  name?: string;
  orbitProjectId?: string;
  sourceRef?: string;
  status?: string;
};

/** POST — create an OaaS route scene from a hybrid GTM playbook. */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.hybridStrategyId?.trim()) {
    return NextResponse.json({ error: "hybridStrategyId is required" }, { status: 400 });
  }

  const scene = getHybridRouteSceneByStrategy(body.hybridStrategyId.trim());
  if (!scene) {
    return NextResponse.json({ error: "Unknown hybrid strategy" }, { status: 400 });
  }

  try {
    const route = await createOrbitRoute({
      userId: user!.id,
      name: body.name?.trim() || scene.name,
      description: scene.description,
      orbitProjectId: body.orbitProjectId,
      sourceChannel: scene.sourceChannel,
      sourceRef: body.sourceRef,
      destinations: scene.destinations,
      status: (body.status as "active" | "draft") || "active",
      retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
      metadata: {
        scene: { type: "hybrid", hybridStrategyId: scene.hybridStrategyId, motion: scene.motion },
      },
    });
    return NextResponse.json({ ok: true, route, scene: { id: scene.id, motion: scene.motion } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET — list hybrid route scenes (playbook → pipeline mappings). */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    scenes: HYBRID_ROUTE_SCENES.map((s) => ({
      id: s.id,
      hybridStrategyId: s.hybridStrategyId,
      motion: s.motion,
      name: s.name,
      description: s.description,
      stepCount: s.destinations.length,
    })),
  });
}
