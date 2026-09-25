import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { orbitContentAssets, type OrbitContentAsset } from "@/lib/orbit/schema";
import type { OrbitApprovalStatus, OrbitValidationStatus } from "../graph-constants";

export type CreateContentAssetInput = {
  orbitProjectId: string;
  orbitCampaignId?: string;
  entityId?: string;
  assetType: string;
  platform: string;
  title?: string;
  body: string;
  bodyFormat?: string;
  version?: number;
  parentAssetId?: string;
  metadata?: Record<string, unknown>;
  promptTemplateVersion?: string;
  model?: string;
  validationStatus?: OrbitValidationStatus;
  validationResults?: Record<string, unknown>;
  approvalStatus?: OrbitApprovalStatus;
  publishStatus?: string;
};

export async function createOrbitContentAsset(
  input: CreateContentAssetInput,
): Promise<OrbitContentAsset> {
  const [row] = await db
    .insert(orbitContentAssets)
    .values({
      orbitProjectId: input.orbitProjectId,
      orbitCampaignId: input.orbitCampaignId,
      entityId: input.entityId,
      assetType: input.assetType,
      platform: input.platform,
      version: input.version ?? 1,
      parentAssetId: input.parentAssetId,
      title: input.title,
      body: input.body,
      bodyFormat: input.bodyFormat ?? "markdown",
      metadata: input.metadata ?? {},
      promptTemplateVersion: input.promptTemplateVersion,
      model: input.model,
      validationStatus: input.validationStatus ?? "pending",
      validationResults: input.validationResults,
      approvalStatus: input.approvalStatus ?? "pending",
      publishStatus: input.publishStatus ?? "draft",
    })
    .returning();
  return row;
}

export async function listContentAssetsByCampaign(
  campaignId: string,
): Promise<OrbitContentAsset[]> {
  return db
    .select()
    .from(orbitContentAssets)
    .where(eq(orbitContentAssets.orbitCampaignId, campaignId))
    .orderBy(desc(orbitContentAssets.createdAt));
}

export async function getOrbitContentAssetById(
  assetId: string,
): Promise<OrbitContentAsset | undefined> {
  const [row] = await db
    .select()
    .from(orbitContentAssets)
    .where(eq(orbitContentAssets.id, assetId))
    .limit(1);
  return row;
}

export async function getLatestAssetForPlannedId(
  campaignId: string,
  plannedAssetId: string,
): Promise<OrbitContentAsset | undefined> {
  const rows = await db
    .select()
    .from(orbitContentAssets)
    .where(eq(orbitContentAssets.orbitCampaignId, campaignId))
    .orderBy(desc(orbitContentAssets.version), desc(orbitContentAssets.createdAt));

  return rows.find(
    (r) => (r.metadata as Record<string, unknown>)?.plannedAssetId === plannedAssetId,
  );
}

export async function updateContentAssetValidation(
  assetId: string,
  validationStatus: OrbitValidationStatus,
  validationResults: Record<string, unknown>,
): Promise<OrbitContentAsset | undefined> {
  const [row] = await db
    .update(orbitContentAssets)
    .set({
      validationStatus,
      validationResults,
      updatedAt: new Date(),
    })
    .where(eq(orbitContentAssets.id, assetId))
    .returning();
  return row;
}

export async function updateContentAssetApproval(
  assetId: string,
  approvalStatus: OrbitApprovalStatus,
  approvedBy?: string,
): Promise<OrbitContentAsset | undefined> {
  const [row] = await db
    .update(orbitContentAssets)
    .set({
      approvalStatus,
      approvedBy: approvalStatus === "approved" ? approvedBy : null,
      approvedAt: approvalStatus === "approved" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(orbitContentAssets.id, assetId))
    .returning();
  return row;
}

export async function updateContentAssetPublishStatus(
  assetId: string,
  publishStatus: string,
  opts?: { publishedUrl?: string; publishedBy?: string },
): Promise<OrbitContentAsset | undefined> {
  const [row] = await db
    .update(orbitContentAssets)
    .set({
      publishStatus,
      publishedUrl: opts?.publishedUrl,
      publishedAt: publishStatus === "published" ? new Date() : undefined,
      publishedBy: opts?.publishedBy,
      updatedAt: new Date(),
    })
    .where(eq(orbitContentAssets.id, assetId))
    .returning();
  return row;
}

export async function createContentAssetVersion(
  parent: OrbitContentAsset,
  updates: Pick<
    CreateContentAssetInput,
    "body" | "title" | "metadata" | "model" | "validationStatus" | "validationResults"
  >,
): Promise<OrbitContentAsset> {
  return createOrbitContentAsset({
    orbitProjectId: parent.orbitProjectId,
    orbitCampaignId: parent.orbitCampaignId ?? undefined,
    entityId: parent.entityId ?? undefined,
    assetType: parent.assetType,
    platform: parent.platform,
    title: updates.title ?? parent.title ?? undefined,
    body: updates.body,
    bodyFormat: parent.bodyFormat,
    version: parent.version + 1,
    parentAssetId: parent.id,
    metadata: { ...(parent.metadata as Record<string, unknown>), ...updates.metadata },
    promptTemplateVersion: parent.promptTemplateVersion ?? undefined,
    model: updates.model ?? parent.model ?? undefined,
    validationStatus: updates.validationStatus,
    validationResults: updates.validationResults,
    approvalStatus: "pending",
    publishStatus: "draft",
  });
}
