import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { createOrbitRoute, getIfmRouteScene } from "@/lib/orbit/routes";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  orbitProjectId?: string;
  sourceRef?: string;
  pairCount?: number;
  status?: string;
};

/** POST — create an IFM weekly route scene. */
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

  const scene = getIfmRouteScene();
  const pairCount = Math.min(Math.max(body.pairCount ?? 3, 1), 10);
  const destinations = scene.destinations.map((d) =>
    d.channel === "ifm" ? { ...d, config: { ...d.config, pairCount } } : d,
  );

  try {
    const route = await createOrbitRoute({
      userId: user!.id,
      name: body.name?.trim() || scene.name,
      description: scene.description,
      orbitProjectId: body.orbitProjectId,
      sourceChannel: scene.sourceChannel,
      sourceRef: body.sourceRef,
      destinations,
      status: (body.status as "active" | "draft") || "active",
      retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
      metadata: {
        scene: { type: "ifm", pairCount },
      },
    });
    return NextResponse.json({ ok: true, route, scene: { id: scene.id } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET — IFM route scene definition. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scene = getIfmRouteScene();
  return NextResponse.json({
    scene: {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      stepCount: scene.destinations.length,
      destinations: scene.destinations,
    },
  });
}
