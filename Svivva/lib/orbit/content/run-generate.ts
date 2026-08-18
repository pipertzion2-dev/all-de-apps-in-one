import {
  getOrbitCampaignById,
  updateCampaignStatus,
} from "@/lib/orbit/campaign/campaign-repository";
import { getOrbitProjectById, getOrbitGraph } from "@/lib/orbit/ingest";
import type { CampaignPlan, PlannedAsset } from "@/lib/orbit/campaign/plan-types";
import type {
  AssetGenerationContext,
  GenerateAssetsInput,
  GenerateAssetsResult,
} from "./asset-types";
import { plannedAssetsFromInput } from "./asset-types";
import {
  generateAssetDraft,
  publishStatusForIntent,
  validateAssetContent,
  validationToRecord,
} from "./asset-generators";
import {
  createContentAssetVersion,
  createOrbitContentAsset,
  getLatestAssetForPlannedId,
} from "./content-repository";
import { emitContentValidationOutcome } from "../analytics/emit-outcomes";

function parseCampaignPlan(
  snapshot: Record<string, unknown> | null | undefined,
): CampaignPlan | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const plan = snapshot as CampaignPlan;
  if (!Array.isArray(plan.phases)) return null;
  return plan;
}

function flattenPlannedAssets(plan: CampaignPlan): PlannedAsset[] {
  return plan.phases.flatMap((p) => p.assets);
}

function buildGenerationContext(
  project: NonNullable<Awaited<ReturnType<typeof getOrbitProjectById>>>,
  entities: AssetGenerationContext["entities"],
): AssetGenerationContext {
  const meta = (project.metadata || {}) as Record<string, unknown>;
  const summary = project.normalizedSummary as Record<string, unknown> | undefined;
  const canonicalUrl =
    (meta.canonicalUrl as string | undefined) ||
    (summary?.canonicalUrl as string | undefined) ||
    entities.find((e) => e.url)?.url ||
    undefined;

  return {
    projectId: project.id,
    projectName: project.name,
    productType: String(meta.productType || summary?.productType || "website"),
    description: project.description || undefined,
    summary,
    canonicalUrl: canonicalUrl || undefined,
    entities,
  };
}

export async function generateCampaignAssets(
  input: GenerateAssetsInput,
): Promise<GenerateAssetsResult> {
  const campaign = await getOrbitCampaignById(input.campaignId, input.userId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const plan = parseCampaignPlan(campaign.planSnapshot as Record<string, unknown> | null);
  if (!plan) {
    throw new Error("Campaign has no valid planSnapshot — run plan first");
  }

  const project = await getOrbitProjectById(campaign.orbitProjectId, input.userId);
  if (!project) {
    throw new Error("Orbit project not found");
  }

  const graph = await getOrbitGraph(campaign.orbitProjectId);
  const ctx = buildGenerationContext(project, graph.entities);
  const policy = campaign.approvalPolicy || undefined;

  const allPlanned = flattenPlannedAssets(plan);
  const toGenerate = plannedAssetsFromInput(allPlanned, input);

  const result: GenerateAssetsResult = { generated: 0, skipped: 0, assets: [] };

  for (const planned of toGenerate) {
    const existing = await getLatestAssetForPlannedId(campaign.id, planned.id);
    if (existing && !input.regenerate) {
      result.skipped += 1;
      continue;
    }

    const draft = await generateAssetDraft(ctx, planned, { templateOnly: input.templateOnly });
    const validation = validateAssetContent({
      body: draft.body,
      title: draft.title,
      platform: planned.platform,
      assetType: planned.assetType,
      policy,
    });

    const validationStatus = validation.status === "passed" ? "passed" : "failed";
    const publishStatus = publishStatusForIntent(
      planned.distributionIntent,
      validation.status === "passed",
    );

    const metadata = {
      plannedAssetId: planned.id,
      phase: planned.phase,
      distributionIntent: planned.distributionIntent,
      priority: planned.priority,
      purpose: planned.purpose,
      ...draft.metadata,
    };

    let asset;
    if (existing && input.regenerate) {
      asset = await createContentAssetVersion(existing, {
        body: draft.body,
        title: draft.title,
        metadata,
        model: draft.model,
        validationStatus,
        validationResults: validationToRecord(validation),
      });
    } else {
      asset = await createOrbitContentAsset({
        orbitProjectId: campaign.orbitProjectId,
        orbitCampaignId: campaign.id,
        entityId: draft.entityId,
        assetType: planned.assetType,
        platform: planned.platform,
        title: draft.title,
        body: draft.body,
        bodyFormat: draft.bodyFormat,
        metadata,
        promptTemplateVersion: draft.promptTemplateVersion,
        model: draft.model,
        validationStatus,
        validationResults: validationToRecord(validation),
        publishStatus,
      });
    }

    await emitContentValidationOutcome(asset);

    result.generated += 1;
    result.assets.push({
      id: asset.id,
      plannedAssetId: planned.id,
      validationStatus: asset.validationStatus,
    });
  }

  if (campaign.status === "planning" && result.generated > 0) {
    await updateCampaignStatus(campaign.id, input.userId, "active");
  }

  return result;
}
