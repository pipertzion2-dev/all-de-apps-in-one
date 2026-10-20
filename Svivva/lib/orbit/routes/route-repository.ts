import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { orbitRoutes, type OrbitRoute } from "@/lib/orbit/schema";
import type { OrbitRouteStatus } from "../graph-constants";
import type { CreateRouteInput, UpdateRouteInput } from "./route-types";
import { validateRouteDestinations } from "./route-types";

export async function createOrbitRoute(input: CreateRouteInput): Promise<OrbitRoute> {
  const validation = validateRouteDestinations(input.destinations);
  if (!validation.ok) throw new Error(validation.error);

  const [row] = await db
    .insert(orbitRoutes)
    .values({
      userId: input.userId,
      orbitProjectId: input.orbitProjectId,
      name: input.name,
      description: input.description,
      sourceChannel: input.sourceChannel,
      sourceRef: input.sourceRef,
      destinations: input.destinations,
      status: input.status || "draft",
      retryPolicy: input.retryPolicy,
      metadata: input.metadata ?? {},
    })
    .returning();
  return row;
}

export async function listOrbitRoutesForUser(userId: string, limit = 50): Promise<OrbitRoute[]> {
  return db
    .select()
    .from(orbitRoutes)
    .where(eq(orbitRoutes.userId, userId))
    .orderBy(desc(orbitRoutes.updatedAt))
    .limit(limit);
}

export async function listOrbitRoutesForProject(
  projectId: string,
  userId: string,
): Promise<OrbitRoute[]> {
  return db
    .select()
    .from(orbitRoutes)
    .where(and(eq(orbitRoutes.orbitProjectId, projectId), eq(orbitRoutes.userId, userId)))
    .orderBy(desc(orbitRoutes.updatedAt));
}

export async function listActiveOrbitRoutes(limit = 20): Promise<OrbitRoute[]> {
  return db
    .select()
    .from(orbitRoutes)
    .where(eq(orbitRoutes.status, "active"))
    .orderBy(desc(orbitRoutes.updatedAt))
    .limit(limit);
}

export async function getOrbitRouteById(
  routeId: string,
  userId: string,
): Promise<OrbitRoute | undefined> {
  const [row] = await db
    .select()
    .from(orbitRoutes)
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .limit(1);
  return row;
}

export async function updateOrbitRoute(
  routeId: string,
  userId: string,
  patch: UpdateRouteInput,
): Promise<OrbitRoute | undefined> {
  if (patch.destinations) {
    const validation = validateRouteDestinations(patch.destinations);
    if (!validation.ok) throw new Error(validation.error);
  }

  const [row] = await db
    .update(orbitRoutes)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning();
  return row;
}

export async function deleteOrbitRoute(routeId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(orbitRoutes)
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning({ id: orbitRoutes.id });
  return result.length > 0;
}

export async function markRouteRunning(routeId: string, userId: string): Promise<OrbitRoute | undefined> {
  const [row] = await db
    .update(orbitRoutes)
    .set({ status: "running", updatedAt: new Date() })
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning();
  return row;
}

export async function completeRouteRun(
  routeId: string,
  userId: string,
  input: {
    status: OrbitRouteStatus;
    lastRunResult: Record<string, unknown>;
    lastError?: string | null;
    orbitProjectId?: string;
  },
): Promise<OrbitRoute | undefined> {
  const [row] = await db
    .update(orbitRoutes)
    .set({
      status: input.status,
      lastRunAt: new Date(),
      lastRunResult: input.lastRunResult,
      lastError: input.lastError ?? null,
      ...(input.orbitProjectId ? { orbitProjectId: input.orbitProjectId } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning();
  return row;
}

type RoutePauseState = {
  fromOrder: number;
  runId: string;
  context: { projectId?: string; campaignId?: string };
  reason: string;
};

export function getRoutePauseState(route: {
  metadata?: Record<string, unknown> | null;
}): RoutePauseState | null {
  const raw = route.metadata?.pausedRun;
  if (!raw || typeof raw !== "object") return null;
  return raw as RoutePauseState;
}

export async function saveRoutePauseState(
  routeId: string,
  userId: string,
  pause: RoutePauseState,
): Promise<OrbitRoute | undefined> {
  const route = await getOrbitRouteById(routeId, userId);
  if (!route) return undefined;
  const meta = (route.metadata || {}) as Record<string, unknown>;
  const [row] = await db
    .update(orbitRoutes)
    .set({
      status: "paused",
      metadata: { ...meta, pausedRun: pause },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning();
  return row;
}

export async function clearRoutePauseState(
  routeId: string,
  userId: string,
): Promise<OrbitRoute | undefined> {
  const route = await getOrbitRouteById(routeId, userId);
  if (!route) return undefined;
  const meta = { ...(route.metadata as Record<string, unknown>) };
  delete meta.pausedRun;
  const [row] = await db
    .update(orbitRoutes)
    .set({ metadata: meta, updatedAt: new Date() })
    .where(and(eq(orbitRoutes.id, routeId), eq(orbitRoutes.userId, userId)))
    .returning();
  return row;
}
