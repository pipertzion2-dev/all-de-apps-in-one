export type {
  AssetGenerationContext,
  GeneratedAssetDraft,
  GenerateAssetsInput,
  GenerateAssetsResult,
  ValidateAssetInput,
  ValidationIssue,
  ValidationResult,
} from "./asset-types";
export { PLATFORM_LIMITS, plannedAssetsFromInput } from "./asset-types";

export {
  generateAssetDraft,
  validateAssetContent,
  validationToRecord,
  publishStatusForIntent,
} from "./asset-generators";

export {
  createOrbitContentAsset,
  listContentAssetsByCampaign,
  getOrbitContentAssetById,
  getLatestAssetForPlannedId,
  updateContentAssetValidation,
  updateContentAssetApproval,
  updateContentAssetPublishStatus,
  createContentAssetVersion,
} from "./content-repository";
export type { CreateContentAssetInput } from "./content-repository";

export { generateCampaignAssets } from "./run-generate";
