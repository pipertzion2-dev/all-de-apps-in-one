import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { getRecommendationById, updateRecommendationStatus } from "./recommendation-repository";
import { emitOrbitEvent } from "./event-repository";
import type { ApplyRecommendationResult } from "./event-types";
import type { OrbitRecommendationKind } from "../graph-constants";

export async function applyRecommendation(
  recommendationId: string,
  userId: string,
  action: "apply" | "dismiss" = "apply",
): Promise<ApplyRecommendationResult> {
  const rec = await getRecommendationById(recommendationId);
  if (!rec) throw new Error("Recommendation not found");

  const project = await getOrbitProjectById(rec.orbitProjectId, userId);
  if (!project) throw new Error("Project not found");

  if (action === "dismiss") {
    await updateRecommendationStatus(recommendationId, "dismissed");
    return {
      recommendationId,
      kind: rec.kind as OrbitRecommendationKind,
      ok: true,
      message: "Recommendation dismissed",
    };
  }

  const payload = (rec.actionPayload || {}) as Record<string, unknown>;
  let result: unknown;
  let message = "Applied";

  switch (rec.kind as OrbitRecommendationKind) {
    case "retry_distribution":
    case "run_distribution": {
      const { enqueueAssetDistribution, enqueueCampaignDistribution } = await import(
        "../distribution/run-enqueue"
      );
      if (payload.contentAssetId && typeof payload.contentAssetId === "string") {
        const job = await enqueueAssetDistribution(payload.contentAssetId, userId);
        result = { job };
        message = job ? "Distribution job enqueued" : "Asset not eligible";
      } else if (rec.orbitCampaignId) {
        result = await enqueueCampaignDistribution({
          campaignId: rec.orbitCampaignId,
          userId,
          processNow: false,
        });
        message = "Campaign distribution enqueued";
      }
      break;
    }
    case "index_recheck": {
      const { runIndexRecheck } = await import("../indexing/run-recheck");
      result = await runIndexRecheck(25);
      message = "Index recheck completed";
      break;
    }
    case "regenerate_content": {
      const { generateCampaignAssets } = await import("../content/run-generate");
      if (!rec.orbitCampaignId) throw new Error("Campaign required for regenerate");
      result = await generateCampaignAssets({
        campaignId: rec.orbitCampaignId,
        userId,
        plannedAssetIds: Array.isArray(payload.assetIds)
          ? (payload.assetIds as string[])
          : undefined,
        regenerate: true,
        templateOnly: true,
      });
      message = "Content regeneration started";
      break;
    }
    case "replan_campaign": {
      message = "Replan requires manual POST to /api/orbit/projects/[id]/campaigns/plan";
      result = { hint: message, projectId: rec.orbitProjectId };
      break;
    }
    case "manual_publish_review": {
      message = "Open campaign approval queue to copy manual-ready content";
      result = {
        href: rec.orbitCampaignId
          ? `/dashboard/orbit/campaigns/${rec.orbitCampaignId}`
          : `/dashboard/orbit/campaigns`,
      };
      break;
    }
    case "expand_content": {
      const { generateCampaignAssets } = await import("../content/run-generate");
      if (!rec.orbitCampaignId) throw new Error("Campaign required");
      result = await generateCampaignAssets({
        campaignId: rec.orbitCampaignId,
        userId,
        templateOnly: true,
      });
      message = "Generated additional template content";
      break;
    }
    default:
      throw new Error(`Unknown recommendation kind: ${rec.kind}`);
  }

  await updateRecommendationStatus(recommendationId, "applied");
  await emitOrbitEvent({
    orbitProjectId: rec.orbitProjectId,
    orbitCampaignId: rec.orbitCampaignId ?? undefined,
    eventType: "recommendation_applied",
    source: "internal",
    idempotencyKey: `recommendation:${recommendationId}:applied`,
    dimensions: { kind: rec.kind },
    metadata: { recommendationId },
  });

  return {
    recommendationId,
    kind: rec.kind as OrbitRecommendationKind,
    ok: true,
    message,
    result,
  };
}
