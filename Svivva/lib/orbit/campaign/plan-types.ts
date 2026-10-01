import type {
  OrbitApprovalPolicy,
  OrbitCampaignObjective,
  OrbitCampaignPhase,
  OrbitContentPlatform,
} from "../graph-constants";

export type DistributionIntent = "auto_if_configured" | "manual_ready" | "indexing";

export type PlannedAsset = {
  id: string;
  phase: OrbitCampaignPhase;
  assetType: string;
  platform: OrbitContentPlatform;
  title: string;
  purpose: string;
  priority: "high" | "medium" | "low";
  distributionIntent: DistributionIntent;
  targetEntityIds?: string[];
  keywords?: string[];
};

export type CampaignPhasePlan = {
  phase: OrbitCampaignPhase;
  label: string;
  goals: string[];
  assets: PlannedAsset[];
};

export type CampaignPlan = {
  version: 1;
  generatedAt: string;
  productType: string;
  projectName: string;
  objective: OrbitCampaignObjective;
  phases: CampaignPhasePlan[];
  recommendedChannels: OrbitContentPlatform[];
  notes: string[];
};

export type PlanCampaignInput = {
  objective?: OrbitCampaignObjective;
  name?: string;
  description?: string;
  mode?: "manual" | "assisted" | "autonomous";
  sourceChannel?: string;
  approvalPolicy?: OrbitApprovalPolicy;
  /** Limit planned assets (default 24) */
  maxAssets?: number;
};

export type GraphContext = {
  projectId: string;
  projectName: string;
  productType: string;
  description?: string;
  summary?: Record<string, unknown>;
  entities: Array<{
    id: string;
    entityType: string;
    name: string;
    url?: string | null;
    externalId?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
};
