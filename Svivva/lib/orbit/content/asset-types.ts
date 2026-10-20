import type { OrbitApprovalPolicy, OrbitContentPlatform } from "../graph-constants";
import type { PlannedAsset } from "../campaign/plan-types";

export type AssetGenerationContext = {
  projectId: string;
  projectName: string;
  productType: string;
  description?: string;
  summary?: Record<string, unknown>;
  canonicalUrl?: string;
  entities: Array<{
    id: string;
    entityType: string;
    name: string;
    url?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
};

export type GeneratedAssetDraft = {
  title: string;
  body: string;
  bodyFormat: "markdown" | "html" | "json" | "plain";
  entityId?: string;
  metadata?: Record<string, unknown>;
  promptTemplateVersion?: string;
  model?: string;
};

export type ValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
  field?: string;
};

export type ValidationResult = {
  status: "passed" | "failed" | "skipped";
  issues: ValidationIssue[];
  checkedAt: string;
};

export type GenerateAssetsInput = {
  campaignId: string;
  userId: string;
  /** Generate only these planned asset ids from planSnapshot */
  plannedAssetIds?: string[];
  /** Generate only assets in these phases */
  phases?: string[];
  /** Regenerate: bump version from existing row with same plannedAssetId */
  regenerate?: boolean;
  /** Skip AI even if configured (template-only) */
  templateOnly?: boolean;
};

export type GenerateAssetsResult = {
  generated: number;
  skipped: number;
  assets: Array<{ id: string; plannedAssetId: string; validationStatus: string }>;
};

export type ValidateAssetInput = {
  body: string;
  title?: string;
  platform: OrbitContentPlatform;
  assetType: string;
  policy?: OrbitApprovalPolicy;
};

/** Platform character limits for common publish targets */
export const PLATFORM_LIMITS: Partial<
  Record<OrbitContentPlatform, { titleMax?: number; bodyMax?: number }>
> = {
  x: { bodyMax: 280 },
  linkedin: { bodyMax: 3000 },
  product_hunt: { titleMax: 60, bodyMax: 260 },
  hn: { titleMax: 80, bodyMax: 10000 },
  youtube: { bodyMax: 5000 },
  devto: { titleMax: 128, bodyMax: 100000 },
};

export function plannedAssetsFromInput(
  planned: PlannedAsset[],
  input: Pick<GenerateAssetsInput, "plannedAssetIds" | "phases">,
): PlannedAsset[] {
  let filtered = planned;
  if (input.plannedAssetIds?.length) {
    const ids = new Set(input.plannedAssetIds);
    filtered = filtered.filter((a) => ids.has(a.id));
  }
  if (input.phases?.length) {
    const phases = new Set(input.phases);
    filtered = filtered.filter((a) => phases.has(a.phase));
  }
  return filtered;
}
