import type { OrbitRouteChannel, OrbitRouteDestination, OrbitRouteStatus } from "../graph-constants";

export type CreateRouteInput = {
  userId: string;
  orbitProjectId?: string;
  name: string;
  description?: string;
  sourceChannel: string;
  sourceRef?: string;
  destinations: OrbitRouteDestination[];
  status?: OrbitRouteStatus;
  retryPolicy?: { maxAttempts?: number; backoffMs?: number };
  metadata?: Record<string, unknown>;
};

export type UpdateRouteInput = Partial<
  Omit<CreateRouteInput, "userId" | "destinations"> & {
    destinations: OrbitRouteDestination[];
  }
>;

export type RouteRunContext = {
  userId: string;
  routeId: string;
  projectId?: string;
  campaignId?: string;
};

export type RouteStepResult = {
  channel: OrbitRouteChannel;
  order: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
};

export type RouteRunResult = {
  routeId: string;
  status: "completed" | "failed";
  projectId?: string;
  campaignId?: string;
  steps: RouteStepResult[];
  error?: string;
};

export function sortDestinations(destinations: OrbitRouteDestination[]): OrbitRouteDestination[] {
  return [...destinations].sort((a, b) => a.order - b.order);
}

export function validateRouteDestinations(
  destinations: OrbitRouteDestination[],
): { ok: true } | { ok: false; error: string } {
  if (!destinations.length) {
    return { ok: false, error: "At least one destination is required" };
  }
  const orders = new Set<number>();
  for (const d of destinations) {
    if (orders.has(d.order)) {
      return { ok: false, error: `Duplicate destination order: ${d.order}` };
    }
    orders.add(d.order);
    if (!d.channel?.trim()) {
      return { ok: false, error: "Each destination requires a channel" };
    }
  }
  return { ok: true };
}
