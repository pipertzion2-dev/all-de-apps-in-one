import { db } from "@/lib/db";
import { eq, and, gte, inArray } from "drizzle-orm";
import { orbitDistributionJobs } from "@/lib/orbit/schema";
import type { OrbitApprovalPolicy } from "../graph-constants";
import type { OrbitCampaign } from "../schema";
import type { OrbitContentAsset } from "../schema";
import { isWithinQuietHours, policyRequiresApproval } from "../campaign/approval-policy";

export type PolicyGateResult = {
  ok: boolean;
  code?: string;
  message?: string;
};

export async function countRecentDistributionJobs(
  campaignId: string,
  since: Date,
): Promise<number> {
  const rows = await db
    .select({ id: orbitDistributionJobs.id })
    .from(orbitDistributionJobs)
    .where(
      and(
        eq(orbitDistributionJobs.orbitCampaignId, campaignId),
        gte(orbitDistributionJobs.createdAt, since),
        inArray(orbitDistributionJobs.status, ["succeeded", "running", "pending"]),
      ),
    );
  return rows.length;
}

export async function checkDistributionPolicyGates(
  campaign: Pick<OrbitCampaign, "id" | "approvalPolicy">,
  asset: Pick<OrbitContentAsset, "approvalStatus" | "validationStatus" | "platform" | "assetType">,
): Promise<PolicyGateResult> {
  const policy = (campaign.approvalPolicy || {}) as OrbitApprovalPolicy;

  if (policyRequiresApproval(policy) && asset.approvalStatus !== "approved") {
    return {
      ok: false,
      code: "approval_required",
      message: "Asset must be approved before distribution",
    };
  }

  if (asset.validationStatus !== "passed") {
    return {
      ok: false,
      code: "validation_required",
      message: "Asset must pass validation before distribution",
    };
  }

  if (
    policy.allowedPlatforms?.length &&
    !policy.allowedPlatforms.includes(asset.platform as never)
  ) {
    return {
      ok: false,
      code: "platform_blocked",
      message: `Platform ${asset.platform} is not allowed by campaign policy`,
    };
  }

  if (policy.allowedContentTypes?.length && !policy.allowedContentTypes.includes(asset.assetType)) {
    return {
      ok: false,
      code: "asset_type_blocked",
      message: `Asset type ${asset.assetType} is not allowed by campaign policy`,
    };
  }

  if (isWithinQuietHours(policy)) {
    return {
      ok: false,
      code: "quiet_hours",
      message: `Distribution blocked during quiet hours (${policy.quietHoursStart}–${policy.quietHoursEnd})`,
    };
  }

  const now = Date.now();
  if (policy.maxPostsPerDay != null) {
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const dayCount = await countRecentDistributionJobs(campaign.id, dayAgo);
    if (dayCount >= policy.maxPostsPerDay) {
      return {
        ok: false,
        code: "rate_limit_day",
        message: `Daily post limit reached (${policy.maxPostsPerDay})`,
      };
    }
  }

  if (policy.maxPostsPerWeek != null) {
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weekCount = await countRecentDistributionJobs(campaign.id, weekAgo);
    if (weekCount >= policy.maxPostsPerWeek) {
      return {
        ok: false,
        code: "rate_limit_week",
        message: `Weekly post limit reached (${policy.maxPostsPerWeek})`,
      };
    }
  }

  return { ok: true };
}
