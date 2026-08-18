export type {
  EmitOrbitEventInput,
  AnalyticsSummary,
  RecommendationDraft,
  ApplyRecommendationResult,
} from "./event-types";

export { emitOrbitEvent, listEventsForProject, getEventById, countEventsByType } from "./event-repository";
export {
  emitDistributionOutcome,
  emitIndexStatusChange,
  emitContentValidationOutcome,
  emitContentGenerated,
  emitPolicyBlockedEvent,
  emitExternalEvent,
} from "./emit-outcomes";
export { buildAnalyticsSummary } from "./rollup-summary";
export {
  createRecommendation,
  listOpenRecommendations,
  getRecommendationById,
  updateRecommendationStatus,
  countOpenRecommendations,
} from "./recommendation-repository";
export {
  generateRecommendationsForProject,
  type GenerateRecommendationsResult,
} from "./recommendation-engine";
export { applyRecommendation } from "./apply-recommendation";
export { processProjectAnalytics, type ProcessAnalyticsResult } from "./run-analytics-process";
export { syncExternalSignalsForProject, ingestExternalMetrics } from "./external-signals";
