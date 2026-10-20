import type {
  OrbitAutopilotConfig,
  OrbitCampaignMode,
  OrbitRecommendationKind,
} from "../graph-constants";

export type AutopilotActionRecord = {
  recommendationId: string;
  kind: string;
  ok: boolean;
  message: string;
  skippedReason?: string;
};

export type AutopilotRunResult = {
  runId: string;
  projectId: string;
  status: "completed" | "skipped" | "failed";
  skippedReason?: string;
  recommendationsSeen: number;
  recommendationsApplied: number;
  recommendationsSkipped: number;
  actions: AutopilotActionRecord[];
  analytics?: {
    backfilledEvents: number;
    recommendationsCreated: number;
  };
};

export type RunAutopilotInput = {
  projectId: string;
  userId: string;
  force?: boolean;
  maxActions?: number;
};

export function parseAutopilotConfig(
  metadata: Record<string, unknown> | null | undefined,
): OrbitAutopilotConfig {
  const raw = metadata?.autopilot;
  if (!raw || typeof raw !== "object") return {};
  return raw as OrbitAutopilotConfig;
}

export const AUTOPILOT_KINDS_BY_MODE: Record<
  OrbitCampaignMode,
  readonly OrbitRecommendationKind[]
> = {
  manual: [],
  assisted: ["index_recheck", "retry_distribution", "prune_ifm_pair"],
  autonomous: [
    "index_recheck",
    "retry_distribution",
    "run_distribution",
    "regenerate_content",
    "expand_content",
    "prune_ifm_pair",
    "expand_ifm_pair",
    "promote_to_roadmap",
  ],
};

export const AUTOPILOT_NEVER_AUTO: readonly OrbitRecommendationKind[] = [
  "manual_publish_review",
  "replan_campaign",
];
