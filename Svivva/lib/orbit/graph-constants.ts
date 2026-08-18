/** Orbit graph — shared status / enum literals for Drizzle jsonb columns and validation. */

export const ORBIT_PROJECT_SOURCE_TYPES = [
  "url",
  "seed",
  "play",
  "api_project",
  "manual",
  "campaign",
] as const;
export type OrbitProjectSourceType = (typeof ORBIT_PROJECT_SOURCE_TYPES)[number];

export const ORBIT_PROJECT_STATUSES = ["ingesting", "ready", "archived", "error"] as const;
export type OrbitProjectStatus = (typeof ORBIT_PROJECT_STATUSES)[number];

export const ORBIT_ENTITY_TYPES = [
  "project",
  "product",
  "feature",
  "page",
  "release",
  "song",
  "video",
  "api",
  "tool",
  "article",
  "keyword",
  "audience",
  "campaign",
  "content_asset",
  "distribution_target",
  "conversion_event",
] as const;
export type OrbitEntityType = (typeof ORBIT_ENTITY_TYPES)[number];

export const ORBIT_LINK_TYPES = [
  "has_feature",
  "has_page",
  "has_release",
  "has_asset",
  "promotes",
  "targets",
  "published_to",
  "converts_via",
  "related_to",
] as const;
export type OrbitLinkType = (typeof ORBIT_LINK_TYPES)[number];

export const ORBIT_CAMPAIGN_PHASES = [
  "discovery",
  "pre_launch",
  "announcement",
  "launch",
  "post_launch",
  "evergreen",
  "reactivation",
] as const;
export type OrbitCampaignPhase = (typeof ORBIT_CAMPAIGN_PHASES)[number];

export const ORBIT_CAMPAIGN_MODES = ["manual", "assisted", "autonomous"] as const;
export type OrbitCampaignMode = (typeof ORBIT_CAMPAIGN_MODES)[number];

export const ORBIT_CAMPAIGN_STATUSES = [
  "draft",
  "planning",
  "active",
  "paused",
  "completed",
  "failed",
] as const;
export type OrbitCampaignStatus = (typeof ORBIT_CAMPAIGN_STATUSES)[number];

export const ORBIT_CAMPAIGN_OBJECTIVES = [
  "traffic",
  "signup",
  "purchase",
  "stream",
  "download",
  "api_adoption",
  "developer_signup",
  "waitlist",
] as const;
export type OrbitCampaignObjective = (typeof ORBIT_CAMPAIGN_OBJECTIVES)[number];

export const ORBIT_ZZAI_CHANNELS = [
  "seeds",
  "play",
  "signal",
  "crest",
  "orbit",
  "protect",
  "oaas",
  "manual",
] as const;
export type OrbitZzaiChannel = (typeof ORBIT_ZZAI_CHANNELS)[number];

export const ORBIT_CONTENT_PLATFORMS = [
  "web",
  "x",
  "linkedin",
  "reddit",
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "pinterest",
  "email",
  "product_hunt",
  "hn",
  "devto",
  "hashnode",
] as const;
export type OrbitContentPlatform = (typeof ORBIT_CONTENT_PLATFORMS)[number];

export const ORBIT_PUBLISH_STATUSES = [
  "draft",
  "ready_for_manual",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
] as const;
export type OrbitPublishStatus = (typeof ORBIT_PUBLISH_STATUSES)[number];

export const ORBIT_VALIDATION_STATUSES = ["pending", "passed", "failed", "skipped"] as const;
export type OrbitValidationStatus = (typeof ORBIT_VALIDATION_STATUSES)[number];

export const ORBIT_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type OrbitApprovalStatus = (typeof ORBIT_APPROVAL_STATUSES)[number];

export const ORBIT_BODY_FORMATS = ["markdown", "html", "json", "plain"] as const;
export type OrbitBodyFormat = (typeof ORBIT_BODY_FORMATS)[number];

export const ORBIT_DISTRIBUTION_PROVIDERS = [
  "devto",
  "hashnode",
  "reddit",
  "twitter",
  "omnisocials",
  "resend",
  "indexnow",
  "gsc",
  "google_indexing",
  "bing",
  "meta",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "linkedin",
  "pinterest",
  "manual",
] as const;
export type OrbitDistributionProvider = (typeof ORBIT_DISTRIBUTION_PROVIDERS)[number];

export const ORBIT_DISTRIBUTION_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "ready_for_manual",
  "cancelled",
] as const;
export type OrbitDistributionStatus = (typeof ORBIT_DISTRIBUTION_STATUSES)[number];

export const ORBIT_INDEX_STATUSES = [
  "created",
  "discoverable",
  "submitted",
  "crawl_detected",
  "indexed",
  "not_indexed",
  "unknown",
  "failed",
] as const;
export type OrbitIndexStatus = (typeof ORBIT_INDEX_STATUSES)[number];

export const ORBIT_ROUTE_STATUSES = [
  "draft",
  "active",
  "running",
  "completed",
  "failed",
  "paused",
] as const;
export type OrbitRouteStatus = (typeof ORBIT_ROUTE_STATUSES)[number];

export const ORBIT_EVENT_SOURCES = [
  "internal",
  "distribution",
  "indexing",
  "content",
  "policy",
  "ga4",
  "webhook",
] as const;
export type OrbitEventSource = (typeof ORBIT_EVENT_SOURCES)[number];

export const ORBIT_EVENT_TYPES = [
  "distribution_succeeded",
  "distribution_failed",
  "distribution_manual_ready",
  "distribution_policy_blocked",
  "index_submitted",
  "index_crawl_detected",
  "index_indexed",
  "index_failed",
  "index_not_indexed",
  "content_validation_passed",
  "content_validation_failed",
  "content_generated",
  "campaign_planned",
  "recommendation_applied",
] as const;
export type OrbitEventType = (typeof ORBIT_EVENT_TYPES)[number];

export const ORBIT_RECOMMENDATION_KINDS = [
  "retry_distribution",
  "run_distribution",
  "index_recheck",
  "regenerate_content",
  "replan_campaign",
  "manual_publish_review",
  "expand_content",
] as const;
export type OrbitRecommendationKind = (typeof ORBIT_RECOMMENDATION_KINDS)[number];

export const ORBIT_RECOMMENDATION_STATUSES = [
  "open",
  "applied",
  "dismissed",
  "expired",
] as const;
export type OrbitRecommendationStatus = (typeof ORBIT_RECOMMENDATION_STATUSES)[number];

export const ORBIT_RECOMMENDATION_PRIORITIES = ["high", "medium", "low"] as const;
export type OrbitRecommendationPriority = (typeof ORBIT_RECOMMENDATION_PRIORITIES)[number];

export type OrbitApprovalPolicy = {
  allowedPlatforms?: OrbitContentPlatform[];
  allowedContentTypes?: string[];
  maxPostsPerDay?: number;
  maxPostsPerWeek?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  blockedTerms?: string[];
  requiredDisclaimers?: string[];
  requireApprovalForPublish?: boolean;
};

export type OrbitRouteDestination = {
  channel: string;
  order: number;
  config?: Record<string, unknown>;
};
