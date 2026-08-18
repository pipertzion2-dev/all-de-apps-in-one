import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  getOrbitRouteById,
  updateOrbitRoute,
  deleteOrbitRoute,
  isOrbitRouteChannel,
} from "@/lib/orbit/routes";
import { ORBIT_ROUTE_STATUSES } from "@/lib/orbit/graph-constants";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
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

  return NextResponse.json({ route });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getOrbitRouteById(id, user!.id);
  if (!existing) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  let body: {
    name?: string;
    description?: string;
    orbitProjectId?: string;
    sourceRef?: string;
    destinations?: Array<{ channel: string; order: number; config?: Record<string, unknown> }>;
    status?: string;
    retryPolicy?: { maxAttempts?: number; backoffMs?: number };
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status && !(ORBIT_ROUTE_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (body.destinations) {
    for (const d of body.destinations) {
      if (!isOrbitRouteChannel(d.channel)) {
        return NextResponse.json({ error: `Invalid channel: ${d.channel}` }, { status: 400 });
      }
    }
  }

  try {
    const route = await updateOrbitRoute(id, user!.id, {
      ...body,
      status: body.status as (typeof ORBIT_ROUTE_STATUSES)[number] | undefined,
    });
    return NextResponse.json({ ok: true, route });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const deleted = await deleteOrbitRoute(id, user!.id);
  if (!deleted) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
