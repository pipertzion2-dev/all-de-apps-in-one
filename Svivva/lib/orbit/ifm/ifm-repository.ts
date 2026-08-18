import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { orbitProjects, orbitEntities, orbitEntityLinks } from "@/lib/orbit/schema";
import { getOrbitProjectById } from "../ingest";
import type { IfmPairing, IfmProjectConfig } from "./ifm-types";

export function parseIfmConfig(metadata: Record<string, unknown> | null | undefined): IfmProjectConfig {
  const raw = metadata?.ifm;
  if (!raw || typeof raw !== "object") return {};
  return raw as IfmProjectConfig;
}

export async function getIfmPairingsForProject(
  projectId: string,
  userId: string,
): Promise<IfmPairing[]> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");
  return parseIfmConfig(project.metadata as Record<string, unknown>).pairings ?? [];
}

export async function appendIfmPairings(
  projectId: string,
  userId: string,
  pairings: IfmPairing[],
): Promise<IfmProjectConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseIfmConfig(meta);
  const merged = [...(current.pairings ?? []), ...pairings].slice(-100);

  const next: IfmProjectConfig = {
    ...current,
    pairings: merged,
    lastGeneratedAt: new Date().toISOString(),
  };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, ifm: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}

export async function persistIfmPairingEntities(
  projectId: string,
  pairing: IfmPairing,
): Promise<{ pageEntityId: string; linkCount: number }> {
  const [pageEntity] = await db
    .insert(orbitEntities)
    .values({
      orbitProjectId: projectId,
      entityType: "page",
      externalId: pairing.id,
      name: pairing.fusionTitle,
      slug: pairing.slug,
      url: `/ifm/${pairing.slug}`,
      description: pairing.bridgePrinciple,
      metadata: {
        ifm: true,
        toolA: pairing.toolA.path,
        toolB: pairing.toolB.path,
        microToolIdea: pairing.microToolIdea,
        faq: pairing.faq,
        status: pairing.status,
      },
    })
    .returning({ id: orbitEntities.id });

  const toolEntities: Array<{ id: string; path: string }> = [];
  for (const tool of [pairing.toolA, pairing.toolB]) {
    const [row] = await db
      .insert(orbitEntities)
      .values({
        orbitProjectId: projectId,
        entityType: "tool",
        externalId: tool.path,
        name: tool.name,
        slug: tool.path.replace(/^\//, ""),
        url: tool.url,
        description: tool.description,
        metadata: { hub: tool.hub, ifmSource: true },
      })
      .returning({ id: orbitEntities.id });
    toolEntities.push({ id: row.id, path: tool.path });
  }

  let linkCount = 0;
  for (const tool of toolEntities) {
    await db.insert(orbitEntityLinks).values({
      orbitProjectId: projectId,
      fromEntityId: pageEntity.id,
      toEntityId: tool.id,
      linkType: "related_to",
      metadata: { ifmBridge: true },
    });
    linkCount += 1;
  }

  return { pageEntityId: pageEntity.id, linkCount };
}

export async function replaceIfmPairings(
  projectId: string,
  userId: string,
  pairings: IfmPairing[],
): Promise<IfmProjectConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseIfmConfig(meta);
  const next: IfmProjectConfig = { ...current, pairings: pairings.slice(-100) };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, ifm: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}

export async function updateIfmProjectConfig(
  projectId: string,
  userId: string,
  patch: Partial<IfmProjectConfig>,
): Promise<IfmProjectConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseIfmConfig(meta);
  const next: IfmProjectConfig = { ...current, ...patch };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, ifm: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}
