import type { OrbitDistributionProvider, OrbitDistributionStatus } from "../graph-constants";
import type { OrbitContentAsset } from "../schema";

/** Social/blog distribution — indexing providers use Phase 6 orbit_index_records. */
export type PublishProvider = Exclude<
  OrbitDistributionProvider,
  "indexnow" | "gsc" | "google_indexing" | "bing"
>;

export type DistributionIntent = "auto_if_configured" | "manual_ready" | "indexing";

export type DistributionPayload = {
  title?: string;
  body: string;
  tags?: string[];
  subreddit?: string;
  thread?: string[];
  linkUrl?: string;
  platforms?: string[];
  subject?: string;
  to?: string;
};

export type DistributionPublishResult = {
  provider: PublishProvider;
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  manualReady?: boolean;
  copyText?: string;
};

export type EnqueueDistributionInput = {
  campaignId: string;
  userId: string;
  assetIds?: string[];
  processNow?: boolean;
  /** When true, policy blocks throw instead of silently skipping assets. */
  strict?: boolean;
};

export type EnqueueDistributionResult = {
  enqueued: number;
  skipped: number;
  jobs: Array<{ id: string; contentAssetId: string; provider: PublishProvider; status: string }>;
  processed?: ProcessDistributionResult;
};

export type ProcessDistributionInput = {
  limit?: number;
  jobIds?: string[];
};

export type ProcessDistributionResult = {
  processed: number;
  succeeded: number;
  failed: number;
  manualReady: number;
  jobs: Array<{
    id: string;
    status: OrbitDistributionStatus;
    externalUrl?: string;
    error?: string;
  }>;
};

export type DistributionJobContext = {
  jobId: string;
  asset: OrbitContentAsset;
  provider: PublishProvider;
  payload: DistributionPayload;
};

export function getDistributionIntent(asset: OrbitContentAsset): DistributionIntent | undefined {
  const meta = asset.metadata as Record<string, unknown> | undefined;
  const intent = meta?.distributionIntent;
  if (intent === "auto_if_configured" || intent === "manual_ready" || intent === "indexing") {
    return intent;
  }
  return undefined;
}

export function isEligibleForDistribution(asset: OrbitContentAsset): boolean {
  const intent = getDistributionIntent(asset);
  if (!intent || intent === "indexing") return false;
  if (asset.approvalStatus !== "approved") return false;
  if (asset.validationStatus !== "passed") return false;
  if (asset.publishStatus === "published" || asset.publishStatus === "publishing") return false;
  return true;
}
