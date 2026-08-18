import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import {
  orbitProjects,
  orbitEntities,
  orbitEntityLinks,
  type OrbitProject,
} from "@/lib/orbit/schema";
import type { IngestSnapshot, PersistedOrbitGraph } from "./types";
import type { OrbitProjectSourceType } from "../graph-constants";

export async function findOrbitProjectBySource(
  userId: string,
  sourceType: OrbitProjectSourceType,
  sourceRef: string,
): Promise<OrbitProject | undefined> {
  const [row] = await db
    .select()
    .from(orbitProjects)
    .where(
      and(
        eq(orbitProjects.userId, userId),
        eq(orbitProjects.sourceType, sourceType),
        eq(orbitProjects.sourceRef, sourceRef),
      ),
    )
    .limit(1);
  return row;
}

export async function listOrbitProjectsForUser(
  userId: string,
  limit = 50,
): Promise<OrbitProject[]> {
  return db
    .select()
    .from(orbitProjects)
    .where(eq(orbitProjects.userId, userId))
    .orderBy(desc(orbitProjects.updatedAt))
    .limit(limit);
}

export async function getOrbitProjectById(
  projectId: string,
  userId: string,
): Promise<OrbitProject | undefined> {
  const [row] = await db
    .select()
    .from(orbitProjects)
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)))
    .limit(1);
  return row;
}

export async function getOrbitGraph(projectId: string) {
  const entities = await db
    .select()
    .from(orbitEntities)
    .where(eq(orbitEntities.orbitProjectId, projectId));
  const links = await db
    .select()
    .from(orbitEntityLinks)
    .where(eq(orbitEntityLinks.orbitProjectId, projectId));
  return { entities, links };
}

export async function persistIngestSnapshot(
  userId: string,
  sourceType: OrbitProjectSourceType,
  sourceRef: string,
  snapshot: IngestSnapshot,
): Promise<PersistedOrbitGraph> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(orbitProjects)
      .where(
        and(
          eq(orbitProjects.userId, userId),
          eq(orbitProjects.sourceType, sourceType),
          eq(orbitProjects.sourceRef, sourceRef),
        ),
      )
      .limit(1);

    let projectId: string;

    if (existing[0]) {
      projectId = existing[0].id;
      await tx.delete(orbitEntityLinks).where(eq(orbitEntityLinks.orbitProjectId, projectId));
      await tx.delete(orbitEntities).where(eq(orbitEntities.orbitProjectId, projectId));
      await tx
        .update(orbitProjects)
        .set({
          name: snapshot.projectName,
          description: snapshot.description,
          status: "ready",
          normalizedSummary: snapshot.summary,
          ingestError: null,
          ingestedAt: new Date(),
          updatedAt: new Date(),
          metadata: { productType: snapshot.productType },
        })
        .where(eq(orbitProjects.id, projectId));
    } else {
      const [inserted] = await tx
        .insert(orbitProjects)
        .values({
          userId,
          name: snapshot.projectName,
          description: snapshot.description,
          sourceType,
          sourceRef,
          status: "ready",
          normalizedSummary: snapshot.summary,
          ingestedAt: new Date(),
          metadata: { productType: snapshot.productType },
        })
        .returning({ id: orbitProjects.id });
      projectId = inserted.id;
    }

    const refToId = new Map<string, string>();

    for (const draft of snapshot.entities) {
      const [entity] = await tx
        .insert(orbitEntities)
        .values({
          orbitProjectId: projectId,
          entityType: draft.entityType,
          externalId: draft.externalId,
          name: draft.name,
          slug: draft.slug,
          url: draft.url,
          description: draft.description,
          metadata: draft.metadata ?? {},
        })
        .returning({ id: orbitEntities.id });
      refToId.set(draft.ref, entity.id);
    }

    let linkCount = 0;
    for (const link of snapshot.links) {
      const fromId = refToId.get(link.fromRef);
      const toId = refToId.get(link.toRef);
      if (!fromId || !toId) continue;
      await tx.insert(orbitEntityLinks).values({
        orbitProjectId: projectId,
        fromEntityId: fromId,
        toEntityId: toId,
        linkType: link.linkType,
        metadata: link.metadata ?? {},
      });
      linkCount++;
    }

    return {
      projectId,
      entityCount: snapshot.entities.length,
      linkCount,
      snapshot,
    };
  });
}

export async function markOrbitProjectIngestError(
  userId: string,
  sourceType: OrbitProjectSourceType,
  sourceRef: string,
  error: string,
): Promise<void> {
  const existing = await findOrbitProjectBySource(userId, sourceType, sourceRef);
  if (existing) {
    await db
      .update(orbitProjects)
      .set({ status: "error", ingestError: error.slice(0, 2000), updatedAt: new Date() })
      .where(eq(orbitProjects.id, existing.id));
    return;
  }
  await db.insert(orbitProjects).values({
    userId,
    name: "Ingest failed",
    sourceType,
    sourceRef,
    status: "error",
    ingestError: error.slice(0, 2000),
  });
}
