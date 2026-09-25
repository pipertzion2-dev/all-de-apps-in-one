import { db } from "@/lib/db";
import { eq, and, desc, gte } from "drizzle-orm";
import { orbitEvents, type OrbitEvent } from "@/lib/orbit/schema";
import type { EmitOrbitEventInput } from "./event-types";

export async function emitOrbitEvent(input: EmitOrbitEventInput): Promise<OrbitEvent | null> {
  try {
    const existing = await db
      .select()
      .from(orbitEvents)
      .where(eq(orbitEvents.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing[0]) return existing[0];

    const [row] = await db
      .insert(orbitEvents)
      .values({
        orbitProjectId: input.orbitProjectId,
        orbitCampaignId: input.orbitCampaignId,
        contentAssetId: input.contentAssetId,
        distributionJobId: input.distributionJobId,
        indexRecordId: input.indexRecordId,
        routeId: input.routeId,
        entityId: input.entityId,
        eventType: input.eventType,
        source: input.source,
        occurredAt: input.occurredAt || new Date(),
        idempotencyKey: input.idempotencyKey,
        dimensions: input.dimensions ?? {},
        metrics: input.metrics ?? {},
        metadata: input.metadata ?? {},
      })
      .returning();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listEventsForProject(
  projectId: string,
  opts: { limit?: number; since?: Date; campaignId?: string } = {},
): Promise<OrbitEvent[]> {
  const conditions = [eq(orbitEvents.orbitProjectId, projectId)];
  if (opts.since) {
    conditions.push(gte(orbitEvents.occurredAt, opts.since));
  }
  if (opts.campaignId) {
    conditions.push(eq(orbitEvents.orbitCampaignId, opts.campaignId));
  }

  return db
    .select()
    .from(orbitEvents)
    .where(and(...conditions))
    .orderBy(desc(orbitEvents.occurredAt))
    .limit(opts.limit ?? 100);
}

export async function getEventById(eventId: string): Promise<OrbitEvent | undefined> {
  const [row] = await db.select().from(orbitEvents).where(eq(orbitEvents.id, eventId)).limit(1);
  return row;
}

export async function countEventsByType(
  projectId: string,
  since?: Date,
): Promise<Record<string, number>> {
  const events = await listEventsForProject(projectId, { limit: 5000, since });
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.eventType] = (counts[e.eventType] || 0) + 1;
  }
  return counts;
}
