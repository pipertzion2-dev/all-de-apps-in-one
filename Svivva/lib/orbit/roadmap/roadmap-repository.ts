import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { orbitProjects } from "@/lib/orbit/schema";
import { getOrbitProjectById } from "../ingest";
import type { OrbitRoadmapConfig, OrbitRoadmapItem } from "./roadmap-types";

export function parseRoadmapConfig(
  metadata: Record<string, unknown> | null | undefined,
): OrbitRoadmapConfig {
  const raw = metadata?.roadmap;
  if (!raw || typeof raw !== "object") return {};
  return raw as OrbitRoadmapConfig;
}

export async function getRoadmapItemsForProject(
  projectId: string,
  userId: string,
): Promise<OrbitRoadmapItem[]> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");
  return parseRoadmapConfig(project.metadata as Record<string, unknown>).items ?? [];
}

export async function appendRoadmapItems(
  projectId: string,
  userId: string,
  items: OrbitRoadmapItem[],
): Promise<OrbitRoadmapConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseRoadmapConfig(meta);
  const existingIds = new Set((current.items ?? []).map((i) => i.pairingId));
  const toAdd = items.filter((i) => !existingIds.has(i.pairingId));
  const merged = [...(current.items ?? []), ...toAdd].slice(-100);

  const next: OrbitRoadmapConfig = {
    ...current,
    items: merged,
    lastPromotedAt: new Date().toISOString(),
  };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, roadmap: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}

export async function updateRoadmapItem(
  projectId: string,
  userId: string,
  itemId: string,
  patch: Partial<OrbitRoadmapItem>,
): Promise<OrbitRoadmapItem | undefined> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseRoadmapConfig(meta);
  let updated: OrbitRoadmapItem | undefined;

  const items = (current.items ?? []).map((item) => {
    if (item.id !== itemId) return item;
    updated = { ...item, ...patch };
    return updated;
  });

  if (!updated) return undefined;

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, roadmap: { ...current, items } },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return updated;
}
