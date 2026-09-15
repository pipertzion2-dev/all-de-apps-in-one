import { db } from "@/lib/db";
import { eq, and, lte, notInArray, asc } from "drizzle-orm";
import { orbitIndexRecords, type OrbitIndexRecord } from "@/lib/orbit/schema";
import type { OrbitIndexStatus } from "../graph-constants";
import type { IndexProvider } from "./index-types";

export type UpsertIndexRecordInput = {
  orbitProjectId: string;
  url: string;
  provider: IndexProvider;
  contentAssetId?: string;
  canonicalUrl?: string;
  status?: OrbitIndexStatus;
  submittedAt?: Date;
  lastCheckedAt?: Date;
  nextCheckAt?: Date;
  failureReason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function upsertOrbitIndexRecord(
  input: UpsertIndexRecordInput,
): Promise<OrbitIndexRecord> {
  const existing = await findIndexRecord(input.url, input.provider);
  if (existing) {
    const [row] = await db
      .update(orbitIndexRecords)
      .set({
        status: input.status ?? existing.status,
        contentAssetId: input.contentAssetId ?? existing.contentAssetId,
        canonicalUrl: input.canonicalUrl ?? existing.canonicalUrl,
        submittedAt: input.submittedAt ?? existing.submittedAt,
        lastCheckedAt: input.lastCheckedAt ?? existing.lastCheckedAt,
        nextCheckAt: input.nextCheckAt ?? existing.nextCheckAt,
        failureReason:
          input.failureReason !== undefined ? input.failureReason : existing.failureReason,
        metadata: { ...(existing.metadata as Record<string, unknown>), ...input.metadata },
        updatedAt: new Date(),
      })
      .where(eq(orbitIndexRecords.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(orbitIndexRecords)
    .values({
      orbitProjectId: input.orbitProjectId,
      url: input.url,
      provider: input.provider,
      contentAssetId: input.contentAssetId,
      canonicalUrl: input.canonicalUrl ?? input.url,
      status: input.status ?? "created",
      submittedAt: input.submittedAt,
      lastCheckedAt: input.lastCheckedAt,
      nextCheckAt: input.nextCheckAt,
      failureReason: input.failureReason,
      metadata: input.metadata ?? {},
    })
    .returning();
  return row;
}

export async function findIndexRecord(
  url: string,
  provider: IndexProvider,
): Promise<OrbitIndexRecord | undefined> {
  const [row] = await db
    .select()
    .from(orbitIndexRecords)
    .where(and(eq(orbitIndexRecords.url, url), eq(orbitIndexRecords.provider, provider)))
    .limit(1);
  return row;
}

export async function listIndexRecordsForProject(
  projectId: string,
  provider?: IndexProvider,
): Promise<OrbitIndexRecord[]> {
  if (provider) {
    return db
      .select()
      .from(orbitIndexRecords)
      .where(
        and(
          eq(orbitIndexRecords.orbitProjectId, projectId),
          eq(orbitIndexRecords.provider, provider),
        ),
      )
      .orderBy(asc(orbitIndexRecords.createdAt));
  }
  return db
    .select()
    .from(orbitIndexRecords)
    .where(eq(orbitIndexRecords.orbitProjectId, projectId))
    .orderBy(asc(orbitIndexRecords.createdAt));
}

export async function listIndexRecordsDueForRecheck(limit = 50): Promise<OrbitIndexRecord[]> {
  const now = new Date();
  return db
    .select()
    .from(orbitIndexRecords)
    .where(
      and(
        lte(orbitIndexRecords.nextCheckAt, now),
        notInArray(orbitIndexRecords.status, ["indexed", "failed"]),
      ),
    )
    .orderBy(asc(orbitIndexRecords.nextCheckAt))
    .limit(limit);
}

export async function updateIndexRecordStatus(
  id: string,
  updates: {
    status: OrbitIndexStatus;
    lastCheckedAt?: Date;
    nextCheckAt?: Date;
    submittedAt?: Date;
    failureReason?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<OrbitIndexRecord | undefined> {
  const existing = await db
    .select()
    .from(orbitIndexRecords)
    .where(eq(orbitIndexRecords.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  const [row] = await db
    .update(orbitIndexRecords)
    .set({
      status: updates.status,
      lastCheckedAt: updates.lastCheckedAt,
      nextCheckAt: updates.nextCheckAt,
      submittedAt: updates.submittedAt,
      failureReason: updates.failureReason,
      metadata: existing
        ? { ...(existing.metadata as Record<string, unknown>), ...updates.metadata }
        : updates.metadata,
      updatedAt: new Date(),
    })
    .where(eq(orbitIndexRecords.id, id))
    .returning();
  return row;
}

export async function getIndexSummaryForProject(projectId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
}> {
  const rows = await listIndexRecordsForProject(projectId);
  const byStatus: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byProvider[row.provider] = (byProvider[row.provider] || 0) + 1;
  }
  return { total: rows.length, byStatus, byProvider };
}
