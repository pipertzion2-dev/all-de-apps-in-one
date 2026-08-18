import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  createOrbitRoute,
  listOrbitRoutesForUser,
  getRouteTemplate,
  ROUTE_TEMPLATES,
  isOrbitRouteChannel,
} from "@/lib/orbit/routes";
import { ORBIT_ROUTE_STATUSES } from "@/lib/orbit/graph-constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const routes = await listOrbitRoutesForUser(user!.id);
  const templates = request.nextUrl.searchParams.get("templates") === "1";

  return NextResponse.json({
    routes: routes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      orbitProjectId: r.orbitProjectId,
      sourceChannel: r.sourceChannel,
      sourceRef: r.sourceRef,
      destinations: r.destinations,
      status: r.status,
      lastRunAt: r.lastRunAt,
      lastError: r.lastError,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    ...(templates ? { templates: ROUTE_TEMPLATES } : {}),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (!(await isOrbitAdminAllowed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: string;
    description?: string;
    orbitProjectId?: string;
    sourceChannel?: string;
    sourceRef?: string;
    destinations?: Array<{ channel: string; order: number; config?: Record<string, unknown> }>;
    status?: string;
    templateId?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const template = body.templateId ? getRouteTemplate(body.templateId) : undefined;
  const destinations = body.destinations?.length
    ? body.destinations
    : template?.destinations;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!destinations?.length) {
    return NextResponse.json({ error: "destinations or templateId required" }, { status: 400 });
  }

  for (const d of destinations) {
    if (!isOrbitRouteChannel(d.channel)) {
      return NextResponse.json({ error: `Invalid channel: ${d.channel}` }, { status: 400 });
    }
  }

  const status = body.status || "draft";
  if (!(ORBIT_ROUTE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const route = await createOrbitRoute({
      userId: user!.id,
      name: body.name.trim(),
      description: body.description,
      orbitProjectId: body.orbitProjectId,
      sourceChannel: body.sourceChannel || template?.sourceChannel || "url",
      sourceRef: body.sourceRef,
      destinations,
      status: status as (typeof ORBIT_ROUTE_STATUSES)[number],
    });
    return NextResponse.json({ ok: true, route });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
