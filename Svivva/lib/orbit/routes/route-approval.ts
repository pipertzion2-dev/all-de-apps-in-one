import { listContentAssetsByCampaign } from "../content/content-repository";
import { getOrbitCampaignById } from "../campaign/campaign-repository";
import { policyRequiresApproval } from "../campaign/approval-policy";
import type { OrbitApprovalPolicy } from "../graph-constants";

export class RouteAwaitingApprovalError extends Error {
  code = "route_awaiting_approval";
  pendingCount: number;
  constructor(pendingCount: number) {
    super(`${pendingCount} asset(s) awaiting approval before distribution`);
    this.pendingCount = pendingCount;
  }
}

export async function checkRouteApprovalGate(input: {
  campaignId: string;
  userId: string;
}): Promise<{ ok: true; approved: number } | { ok: false; pending: number }> {
  const campaign = await getOrbitCampaignById(input.campaignId, input.userId);
  if (!campaign) throw new Error("Campaign not found");

  const policy = (campaign.approvalPolicy as OrbitApprovalPolicy | null) ?? null;
  if (!policyRequiresApproval(policy)) {
    return { ok: true, approved: 0 };
  }

  const assets = await listContentAssetsByCampaign(campaign.id);
  const pending = assets.filter((a) => a.approvalStatus !== "approved");
  if (pending.length > 0) {
    return { ok: false, pending: pending.length };
  }

  return { ok: true, approved: assets.length };
}

export async function assertRouteApprovalGate(input: {
  campaignId: string;
  userId: string;
}): Promise<void> {
  const gate = await checkRouteApprovalGate(input);
  if (!gate.ok) {
    throw new RouteAwaitingApprovalError(gate.pending);
  }
}
