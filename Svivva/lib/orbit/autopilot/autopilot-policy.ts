import type { OrbitApprovalPolicy, OrbitCampaignMode, OrbitRecommendationKind } from "../graph-constants";
import { isWithinQuietHours } from "../campaign/approval-policy";
import {
  AUTOPILOT_KINDS_BY_MODE,
  AUTOPILOT_NEVER_AUTO,
} from "./autopilot-types";

export type AutoApplyGateResult = {
  ok: boolean;
  reason?: string;
};

export function canAutoApplyRecommendation(input: {
  kind: OrbitRecommendationKind;
  campaignMode: OrbitCampaignMode;
  approvalPolicy?: OrbitApprovalPolicy | null;
  priority?: string;
  now?: Date;
}): AutoApplyGateResult {
  const now = input.now ?? new Date();

  if (AUTOPILOT_NEVER_AUTO.includes(input.kind)) {
    return { ok: false, reason: "kind_requires_manual_review" };
  }

  if (input.kind === "expand_ifm_pair" && input.priority === "low") {
    return { ok: false, reason: "expand_ifm_requires_medium_or_high_priority" };
  }

  if (input.kind === "expand_ifm_pair" && input.campaignMode === "assisted") {
    return { ok: false, reason: "assisted_blocks_expand_ifm_pair" };
  }

  if (
    input.kind === "promote_to_roadmap" &&
    (input.campaignMode !== "autonomous" || input.priority === "low")
  ) {
    return { ok: false, reason: "promote_to_roadmap_requires_autonomous_medium_plus" };
  }

  const allowed = AUTOPILOT_KINDS_BY_MODE[input.campaignMode] || [];
  if (!allowed.includes(input.kind)) {
    return { ok: false, reason: `mode_${input.campaignMode}_blocks_${input.kind}` };
  }

  if (input.campaignMode === "assisted" && input.priority === "low") {
    return { ok: false, reason: "assisted_skips_low_priority" };
  }

  if (input.approvalPolicy && isWithinQuietHours(input.approvalPolicy, now)) {
    return { ok: false, reason: "quiet_hours" };
  }

  return { ok: true };
}

export function resolveCampaignMode(
  campaignMode: string | null | undefined,
  fallback: OrbitCampaignMode = "manual",
): OrbitCampaignMode {
  if (campaignMode === "autonomous" || campaignMode === "assisted" || campaignMode === "manual") {
    return campaignMode;
  }
  return fallback;
}
