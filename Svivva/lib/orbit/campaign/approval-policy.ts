import type { OrbitApprovalPolicy, OrbitContentPlatform } from "../graph-constants";
import { ORBIT_CONTENT_PLATFORMS } from "../graph-constants";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DEFAULT_APPROVAL_POLICY: OrbitApprovalPolicy = {
  requireApprovalForPublish: true,
  maxPostsPerDay: 10,
  maxPostsPerWeek: 40,
};

export type PolicyValidationIssue = {
  field: string;
  message: string;
};

export function normalizeApprovalPolicy(
  input: Partial<OrbitApprovalPolicy> | null | undefined,
  base?: OrbitApprovalPolicy | null,
): OrbitApprovalPolicy {
  const merged: OrbitApprovalPolicy = {
    ...DEFAULT_APPROVAL_POLICY,
    ...(base || {}),
    ...(input || {}),
  };

  if (merged.allowedPlatforms?.length) {
    merged.allowedPlatforms = [...new Set(merged.allowedPlatforms)].filter((p) =>
      (ORBIT_CONTENT_PLATFORMS as readonly string[]).includes(p),
    ) as OrbitContentPlatform[];
  }

  if (merged.allowedContentTypes?.length) {
    merged.allowedContentTypes = [
      ...new Set(merged.allowedContentTypes.map((t) => t.trim())),
    ].filter(Boolean);
  }

  if (merged.blockedTerms?.length) {
    merged.blockedTerms = [...new Set(merged.blockedTerms.map((t) => t.trim()))].filter(Boolean);
  }

  if (merged.requiredDisclaimers?.length) {
    merged.requiredDisclaimers = [
      ...new Set(merged.requiredDisclaimers.map((t) => t.trim())),
    ].filter(Boolean);
  }

  return merged;
}

export function validateApprovalPolicy(policy: OrbitApprovalPolicy): PolicyValidationIssue[] {
  const issues: PolicyValidationIssue[] = [];

  if (policy.maxPostsPerDay != null && policy.maxPostsPerDay < 0) {
    issues.push({ field: "maxPostsPerDay", message: "Must be zero or positive" });
  }
  if (policy.maxPostsPerWeek != null && policy.maxPostsPerWeek < 0) {
    issues.push({ field: "maxPostsPerWeek", message: "Must be zero or positive" });
  }
  if (
    policy.maxPostsPerDay != null &&
    policy.maxPostsPerWeek != null &&
    policy.maxPostsPerDay > policy.maxPostsPerWeek
  ) {
    issues.push({
      field: "maxPostsPerDay",
      message: "Daily cap cannot exceed weekly cap",
    });
  }

  for (const field of ["quietHoursStart", "quietHoursEnd"] as const) {
    const val = policy[field];
    if (val != null && val !== "" && !TIME_RE.test(val)) {
      issues.push({ field, message: "Use HH:MM 24-hour format" });
    }
  }

  if (policy.allowedPlatforms?.length) {
    for (const p of policy.allowedPlatforms) {
      if (!(ORBIT_CONTENT_PLATFORMS as readonly string[]).includes(p)) {
        issues.push({ field: "allowedPlatforms", message: `Unknown platform: ${p}` });
      }
    }
  }

  return issues;
}

/** Parse HH:MM to minutes since midnight. */
function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinQuietHours(policy: OrbitApprovalPolicy, now: Date = new Date()): boolean {
  const start = policy.quietHoursStart?.trim();
  const end = policy.quietHoursEnd?.trim();
  if (!start || !end || !TIME_RE.test(start) || !TIME_RE.test(end)) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseMinutes(start);
  const endMin = parseMinutes(end);

  if (startMin === endMin) return false;
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // overnight window e.g. 22:00 – 07:00
  return nowMin >= startMin || nowMin < endMin;
}

export function policyRequiresApproval(policy: OrbitApprovalPolicy | null | undefined): boolean {
  return policy?.requireApprovalForPublish !== false;
}

export function assetMeetsApprovalRequirement(
  asset: { approvalStatus: string },
  policy: OrbitApprovalPolicy | null | undefined,
): boolean {
  if (!policyRequiresApproval(policy)) return true;
  return asset.approvalStatus === "approved";
}
