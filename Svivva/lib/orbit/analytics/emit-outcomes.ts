import type { OrbitDistributionJob } from "@/lib/orbit/schema";
import type { OrbitIndexRecord } from "@/lib/orbit/schema";
import type { OrbitContentAsset } from "@/lib/orbit/schema";
import type { OrbitEventType, OrbitEventSource } from "../graph-constants";
import { emitOrbitEvent } from "./event-repository";

export async function emitDistributionOutcome(
  job: Pick<
    OrbitDistributionJob,
    | "id"
    | "orbitProjectId"
    | "orbitCampaignId"
    | "contentAssetId"
    | "provider"
    | "status"
    | "externalUrl"
    | "errorMessage"
  >,
): Promise<void> {
  let eventType: OrbitEventType;
  if (job.status === "succeeded") eventType = "distribution_succeeded";
  else if (job.status === "ready_for_manual") eventType = "distribution_manual_ready";
  else eventType = "distribution_failed";

  await emitOrbitEvent({
    orbitProjectId: job.orbitProjectId,
    orbitCampaignId: job.orbitCampaignId ?? undefined,
    contentAssetId: job.contentAssetId,
    distributionJobId: job.id,
    eventType,
    source: "distribution",
    idempotencyKey: `distribution:${job.id}:${job.status}`,
    dimensions: {
      provider: job.provider,
      status: job.status,
      externalUrl: job.externalUrl,
    },
    metadata: { errorMessage: job.errorMessage },
  });
}

export async function emitIndexStatusChange(
  record: Pick<
    OrbitIndexRecord,
    "id" | "orbitProjectId" | "contentAssetId" | "url" | "status" | "provider" | "failureReason"
  >,
  previousStatus?: string,
): Promise<void> {
  if (previousStatus === record.status) return;

  const typeMap: Record<string, OrbitEventType> = {
    submitted: "index_submitted",
    crawl_detected: "index_crawl_detected",
    indexed: "index_indexed",
    failed: "index_failed",
    not_indexed: "index_not_indexed",
  };

  const eventType = typeMap[record.status];
  if (!eventType) return;

  await emitOrbitEvent({
    orbitProjectId: record.orbitProjectId,
    contentAssetId: record.contentAssetId ?? undefined,
    indexRecordId: record.id,
    eventType,
    source: "indexing",
    idempotencyKey: `index:${record.id}:${record.status}`,
    dimensions: {
      url: record.url,
      provider: record.provider,
      status: record.status,
      previousStatus,
    },
    metadata: { failureReason: record.failureReason },
  });
}

export async function emitContentValidationOutcome(
  asset: Pick<
    OrbitContentAsset,
    "id" | "orbitProjectId" | "orbitCampaignId" | "platform" | "assetType" | "validationStatus"
  >,
): Promise<void> {
  const passed = asset.validationStatus === "passed";
  await emitOrbitEvent({
    orbitProjectId: asset.orbitProjectId,
    orbitCampaignId: asset.orbitCampaignId ?? undefined,
    contentAssetId: asset.id,
    eventType: passed ? "content_validation_passed" : "content_validation_failed",
    source: "content",
    idempotencyKey: `content:${asset.id}:validation:${asset.validationStatus}`,
    dimensions: {
      platform: asset.platform,
      assetType: asset.assetType,
      validationStatus: asset.validationStatus,
    },
  });
}

export async function emitContentGenerated(
  asset: Pick<
    OrbitContentAsset,
    "id" | "orbitProjectId" | "orbitCampaignId" | "platform" | "assetType" | "validationStatus"
  >,
): Promise<void> {
  await emitOrbitEvent({
    orbitProjectId: asset.orbitProjectId,
    orbitCampaignId: asset.orbitCampaignId ?? undefined,
    contentAssetId: asset.id,
    eventType: "content_generated",
    source: "content",
    idempotencyKey: `content:${asset.id}:generated:v1`,
    dimensions: {
      platform: asset.platform,
      assetType: asset.assetType,
      validationStatus: asset.validationStatus,
    },
  });
}

export async function emitPolicyBlockedEvent(input: {
  orbitProjectId: string;
  orbitCampaignId?: string;
  contentAssetId?: string;
  code: string;
  message: string;
}): Promise<void> {
  await emitOrbitEvent({
    orbitProjectId: input.orbitProjectId,
    orbitCampaignId: input.orbitCampaignId,
    contentAssetId: input.contentAssetId,
    eventType: "distribution_policy_blocked",
    source: "policy",
    idempotencyKey: `policy:${input.orbitProjectId}:${input.contentAssetId || input.orbitCampaignId || "project"}:${input.code}`,
    dimensions: { code: input.code },
    metadata: { message: input.message },
  });
}

export async function emitExternalEvent(input: {
  orbitProjectId: string;
  eventType: OrbitEventType;
  source: OrbitEventSource;
  idempotencyKey: string;
  orbitCampaignId?: string;
  dimensions?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}): Promise<void> {
  await emitOrbitEvent({
    ...input,
    occurredAt: new Date(),
  });
}
