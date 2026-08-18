import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runOrbitRoute, getOrbitRouteById } from "@/lib/orbit/routes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteParams = { params: Promise<{ id: string }> };

/** POST — resume a paused route from its last checkpoint. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const route = await getOrbitRouteById(id, user!.id);
  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  if (route.status !== "paused") {
    return NextResponse.json({ error: "Route is not paused" }, { status: 400 });
  }

  try {
    const result = await runOrbitRoute(id, user!.id, { resume: true });
    return NextResponse.json({ ok: result.status === "completed", ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
