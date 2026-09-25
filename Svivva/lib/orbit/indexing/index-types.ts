import type { OrbitIndexStatus, OrbitDistributionProvider } from "../graph-constants";

export type IndexProvider = Extract<
  OrbitDistributionProvider,
  "indexnow" | "gsc" | "google_indexing"
>;

export const DEFAULT_INDEX_PROVIDERS: IndexProvider[] = ["indexnow", "gsc", "google_indexing"];

export type UrlProbeResult = {
  url: string;
  httpStatus: number;
  reachable: boolean;
  indexable: boolean;
  noindex: boolean;
  notes: string;
};

export type IndexSubmitResult = {
  provider: IndexProvider;
  ok: boolean;
  message: string;
  submittedCount: number;
  urlCount: number;
};

export type IndexRunResult = {
  projectId: string;
  campaignId?: string;
  urls: string[];
  records: Array<{ id: string; url: string; provider: IndexProvider; status: OrbitIndexStatus }>;
  submissions: IndexSubmitResult[];
  probed: number;
  discoverable: number;
  failed: number;
};

export type RecheckResult = {
  checked: number;
  advanced: number;
  failed: number;
  records: Array<{ id: string; url: string; from: OrbitIndexStatus; to: OrbitIndexStatus }>;
};

export type ResolveUrlsInput = {
  entities: Array<{ id: string; entityType: string; url?: string | null }>;
  explicitUrls?: string[];
  targetEntityIds?: string[];
  contentAssetUrls?: string[];
};

export type RunProjectIndexInput = {
  projectId: string;
  userId: string;
  urls?: string[];
  providers?: IndexProvider[];
  campaignId?: string;
  contentAssetId?: string;
  probeFirst?: boolean;
};

export type RunCampaignIndexInput = {
  campaignId: string;
  userId: string;
  providers?: IndexProvider[];
};
