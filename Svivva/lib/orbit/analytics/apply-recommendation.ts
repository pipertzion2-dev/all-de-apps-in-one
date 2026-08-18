import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { getRecommendationById, updateRecommendationStatus } from "./recommendation-repository";
import { emitOrbitEvent } from "./event-repository";
import type { ApplyRecommendationResult } from "./event-types";
import type { OrbitRecommendationKind } from "../graph-constants";
import type { PlanCampaignInput } from "../campaign/plan-types";

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
      const { planCampaignForProject } = await import("../campaign/run-plan");
      result = await planCampaignForProject(rec.orbitProjectId, userId, {
        objective: (payload.objective as PlanCampaignInput["objective"]) || undefined,
        mode: "assisted",
        name: payload.name as string | undefined,
      });
      message = "New campaign plan created";
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
    case "expand_ifm_pair": {
      const pairingId = payload.pairingId as string;
      if (!pairingId) throw new Error("pairingId required");
      const { expandIfmPairFromWinner } = await import("../ifm/ifm-performance");
      result = await expandIfmPairFromWinner(rec.orbitProjectId, userId, pairingId);
      message = `Expanded IFM pair — ${(result as { created: number }).created} new pairing(s)`;
      break;
    }
    case "prune_ifm_pair": {
      const pairingId = payload.pairingId as string;
      if (!pairingId) throw new Error("pairingId required");
      const { pruneIfmPairing } = await import("../ifm/ifm-performance");
      result = await pruneIfmPairing(rec.orbitProjectId, userId, pairingId);
      message = "IFM pairing archived";
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
