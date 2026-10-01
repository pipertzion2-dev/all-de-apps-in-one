export type {
  PublishProvider,
  DistributionIntent,
  DistributionPayload,
  DistributionPublishResult,
  EnqueueDistributionInput,
  EnqueueDistributionResult,
  ProcessDistributionInput,
  ProcessDistributionResult,
} from "./distribution-types";
export { getDistributionIntent, isEligibleForDistribution } from "./distribution-types";

export {
  resolvePublishProvider,
  fallbackProvider,
  omnisocialsPlatforms,
} from "./platform-provider-map";

export {
  parseAssetPayload,
  parseRedditPayload,
  parseTwitterPayload,
  formatManualCopyText,
} from "./asset-payload-parser";

export {
  computeRetryScheduledAt,
  statusAfterPublish,
  canRetryJob,
  nextStatusForRetry,
  canTransitionJob,
} from "./distribution-state-machine";

export {
  createDistributionJob,
  findJobByIdempotencyKey,
  getDistributionJobById,
  listPendingDistributionJobs,
  listDistributionJobsForCampaign,
  listDistributionJobsForProject,
  markJobRunning,
  completeDistributionJob,
  cancelDistributionJob,
  buildIdempotencyKey,
  getDistributionSummary,
} from "./distribution-repository";
export type { CreateDistributionJobInput } from "./distribution-repository";

export {
  credentialsConfigured,
  resolveProviderForAsset,
  publishToProvider,
  providerForIntentAndPlatform,
} from "./distribution-providers";

export { enqueueAssetDistribution, enqueueCampaignDistribution } from "./run-enqueue";
export { DistributionPolicyError } from "./run-enqueue";
export { checkDistributionPolicyGates } from "./policy-gates";
export type { PolicyGateResult } from "./policy-gates";
export {
  runDistributionJob,
  processDistributionQueue,
  getProjectDistributionStatus,
} from "./run-distribute";
