import type {
  OrbitEventSource,
  OrbitEventType,
  OrbitRecommendationKind,
  OrbitRecommendationPriority,
} from "../graph-constants";

export type EmitOrbitEventInput = {
  orbitProjectId: string;
  eventType: OrbitEventType;
  source: OrbitEventSource;
  idempotencyKey: string;
  orbitCampaignId?: string;
  contentAssetId?: string;
  distributionJobId?: string;
  indexRecordId?: string;
  routeId?: string;
  entityId?: string;
  occurredAt?: Date;
  dimensions?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AnalyticsSummary = {
  projectId: string;
  totalEvents: number;
  byEventType: Record<string, number>;
  bySource: Record<string, number>;
  distribution: {
    succeeded: number;
    failed: number;
    manualReady: number;
  };
  indexing: {
    submitted: number;
    indexed: number;
    failed: number;
    stuckSubmitted: number;
  };
  content: {
    validationPassed: number;
    validationFailed: number;
  };
  openRecommendations: number;
};

export type RecommendationDraft = {
  kind: OrbitRecommendationKind;
  priority: OrbitRecommendationPriority;
  title: string;
  rationale: string;
  orbitCampaignId?: string;
  triggerEventId?: string;
  actionPayload?: Record<string, unknown>;
};

export type ApplyRecommendationResult = {
  recommendationId: string;
  kind: OrbitRecommendationKind;
  ok: boolean;
  message: string;
  result?: unknown;
};
