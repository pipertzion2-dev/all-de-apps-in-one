import { db } from "@/lib/db";
import { eq, and, desc, asc, lte, or, isNull, inArray } from "drizzle-orm";
import { orbitDistributionJobs, type OrbitDistributionJob } from "@/lib/orbit/schema";
import type { OrbitDistributionStatus } from "../graph-constants";
import type { PublishProvider } from "./distribution-types";

export type CreateDistributionJobInput = {
  orbitProjectId: string;
  orbitCampaignId?: string;
  contentAssetId: string;
  provider: PublishProvider;
  action?: string;
  idempotencyKey: string;
  scheduledAt?: Date;
  requestPayload?: Record<string, unknown>;
};

export async function createDistributionJob(
  input: CreateDistributionJobInput,
): Promise<{ job: OrbitDistributionJob; created: boolean }> {
  const existing = await findJobByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { job: existing, created: false };
  }

  const [row] = await db
    .insert(orbitDistributionJobs)
    .values({
      orbitProjectId: input.orbitProjectId,
      orbitCampaignId: input.orbitCampaignId,
      contentAssetId: input.contentAssetId,
      provider: input.provider,
      action: input.action || "publish",
      status: "pending",
      scheduledAt: input.scheduledAt,
      idempotencyKey: input.idempotencyKey,
      requestPayload: input.requestPayload ?? {},
    })
    .returning();

  return { job: row, created: true };
}

export async function findJobByIdempotencyKey(
  idempotencyKey: string,
): Promise<OrbitDistributionJob | undefined> {
  const [row] = await db
    .select()
    .from(orbitDistributionJobs)
    .where(eq(orbitDistributionJobs.idempotencyKey, idempotencyKey))
    .limit(1);
  return row;
}

export async function getDistributionJobById(
  jobId: string,
): Promise<OrbitDistributionJob | undefined> {
  const [row] = await db
    .select()
    .from(orbitDistributionJobs)
    .where(eq(orbitDistributionJobs.id, jobId))
    .limit(1);
  return row;
}

export async function listPendingDistributionJobs(limit = 20): Promise<OrbitDistributionJob[]> {
  const now = new Date();
  return db
    .select()
    .from(orbitDistributionJobs)
    .where(
      and(
        eq(orbitDistributionJobs.status, "pending"),
        or(isNull(orbitDistributionJobs.scheduledAt), lte(orbitDistributionJobs.scheduledAt, now)),
      ),
    )
    .orderBy(asc(orbitDistributionJobs.createdAt))
    .limit(limit);
}

export async function listDistributionJobsForCampaign(
  campaignId: string,
): Promise<OrbitDistributionJob[]> {
  return db
    .select()
    .from(orbitDistributionJobs)
    .where(eq(orbitDistributionJobs.orbitCampaignId, campaignId))
    .orderBy(desc(orbitDistributionJobs.createdAt));
}

export async function listDistributionJobsForProject(
  projectId: string,
): Promise<OrbitDistributionJob[]> {
  return db
    .select()
    .from(orbitDistributionJobs)
    .where(eq(orbitDistributionJobs.orbitProjectId, projectId))
    .orderBy(desc(orbitDistributionJobs.createdAt));
}

export async function markJobRunning(jobId: string): Promise<OrbitDistributionJob | undefined> {
  const [row] = await db
    .update(orbitDistributionJobs)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orbitDistributionJobs.id, jobId), eq(orbitDistributionJobs.status, "pending")))
    .returning();
  return row;
}

export async function completeDistributionJob(
  jobId: string,
  updates: {
    status: OrbitDistributionStatus;
    externalId?: string;
    externalUrl?: string;
    errorMessage?: string | null;
    responsePayload?: Record<string, unknown>;
    retryCount?: number;
    scheduledAt?: Date | null;
  },
): Promise<OrbitDistributionJob | undefined> {
  const [row] = await db
    .update(orbitDistributionJobs)
    .set({
      status: updates.status,
      externalId: updates.externalId,
      externalUrl: updates.externalUrl,
      errorMessage: updates.errorMessage ?? null,
      responsePayload: updates.responsePayload,
      retryCount: updates.retryCount,
      scheduledAt: updates.scheduledAt,
      completedAt: ["succeeded", "failed", "ready_for_manual", "cancelled"].includes(updates.status)
        ? new Date()
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orbitDistributionJobs.id, jobId))
    .returning();
  return row;
}

export async function cancelDistributionJob(
  jobId: string,
): Promise<OrbitDistributionJob | undefined> {
  return completeDistributionJob(jobId, { status: "cancelled", errorMessage: "Cancelled by user" });
}

export async function getJobsByIds(jobIds: string[]): Promise<OrbitDistributionJob[]> {
  if (jobIds.length === 0) return [];
  return db.select().from(orbitDistributionJobs).where(inArray(orbitDistributionJobs.id, jobIds));
}

export function buildIdempotencyKey(
  contentAssetId: string,
  provider: PublishProvider,
  version: number,
  action = "publish",
): string {
  return `${contentAssetId}:${provider}:${action}:v${version}`;
}

export async function getDistributionSummary(projectId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
}> {
  const jobs = await listDistributionJobsForProject(projectId);
  const byStatus: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    byProvider[job.provider] = (byProvider[job.provider] || 0) + 1;
  }
  return { total: jobs.length, byStatus, byProvider };
}
