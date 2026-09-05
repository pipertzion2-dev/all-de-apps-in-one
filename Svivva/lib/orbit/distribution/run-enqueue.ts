import { getOrbitCampaignById } from "@/lib/orbit/campaign/campaign-repository";
import {
  getOrbitContentAssetById,
  listContentAssetsByCampaign,
} from "@/lib/orbit/content/content-repository";
import type { EnqueueDistributionInput, EnqueueDistributionResult } from "./distribution-types";
import { getDistributionIntent, isEligibleForDistribution } from "./distribution-types";
import { buildIdempotencyKey, createDistributionJob } from "./distribution-repository";
import { resolveProviderForAsset } from "./distribution-providers";
import { loadMarketingPlatformCredentials } from "../marketing-autopilot-credentials";
import { parseAssetPayload } from "./asset-payload-parser";
import { processDistributionQueue } from "./run-distribute";
import { checkDistributionPolicyGates } from "./policy-gates";
import { emitPolicyBlockedEvent } from "../analytics/emit-outcomes";

export class DistributionPolicyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function enqueueAssetDistribution(
  assetId: string,
  userId: string,
): Promise<EnqueueDistributionResult["jobs"][0] | null> {
  const asset = await getOrbitContentAssetById(assetId);
  if (!asset) throw new Error("Content asset not found");

  if (!asset.orbitCampaignId) {
    throw new Error("Asset is not linked to a campaign");
  }

  const campaign = await getOrbitCampaignById(asset.orbitCampaignId, userId);
  if (!campaign) throw new Error("Campaign not found");

  if (!isEligibleForDistribution(asset)) {
    return null;
  }

  const gate = await checkDistributionPolicyGates(campaign, asset);
  if (!gate.ok) {
    await emitPolicyBlockedEvent({
      orbitProjectId: asset.orbitProjectId,
      orbitCampaignId: asset.orbitCampaignId ?? undefined,
      contentAssetId: asset.id,
      code: gate.code || "policy_blocked",
      message: gate.message || "Blocked by policy",
    });
    throw new DistributionPolicyError(gate.code || "policy_blocked", gate.message || "Blocked by policy");
  }

  const creds = await loadMarketingPlatformCredentials();
  const provider = resolveProviderForAsset(asset, creds);
  if (!provider) return null;

  const payload = parseAssetPayload(asset);
  const idempotencyKey = buildIdempotencyKey(asset.id, provider, asset.version);

  const { job, created } = await createDistributionJob({
    orbitProjectId: asset.orbitProjectId,
    orbitCampaignId: asset.orbitCampaignId ?? undefined,
    contentAssetId: asset.id,
    provider,
    idempotencyKey,
    requestPayload: {
      platform: asset.platform,
      distributionIntent: getDistributionIntent(asset),
      title: payload.title,
    },
  });

  if (!created) {
    return {
      id: job.id,
      contentAssetId: job.contentAssetId,
      provider: job.provider as EnqueueDistributionResult["jobs"][0]["provider"],
      status: job.status,
    };
  }

  return {
    id: job.id,
    contentAssetId: job.contentAssetId,
    provider: job.provider as EnqueueDistributionResult["jobs"][0]["provider"],
    status: job.status,
  };
}

export async function enqueueCampaignDistribution(
  input: EnqueueDistributionInput,
): Promise<EnqueueDistributionResult> {
  const campaign = await getOrbitCampaignById(input.campaignId, input.userId);
  if (!campaign) throw new Error("Campaign not found");

  const assets = await listContentAssetsByCampaign(campaign.id);
  const targetAssets = input.assetIds?.length
    ? assets.filter((a) => input.assetIds!.includes(a.id))
    : assets;

  const result: EnqueueDistributionResult = {
    enqueued: 0,
    skipped: 0,
    jobs: [],
  };

  for (const asset of targetAssets) {
    if (!isEligibleForDistribution(asset)) {
      result.skipped += 1;
      continue;
    }

    try {
      const job = await enqueueAssetDistribution(asset.id, input.userId);
      if (job) {
        result.enqueued += 1;
        result.jobs.push(job);
      } else {
        result.skipped += 1;
      }
    } catch (e) {
      if (e instanceof DistributionPolicyError) {
        result.skipped += 1;
        continue;
      }
      throw e;
    }
  }

  if (input.processNow && result.jobs.length > 0) {
    result.processed = await processDistributionQueue({
      jobIds: result.jobs.map((j) => j.id),
    });
  }

  return result;
}
