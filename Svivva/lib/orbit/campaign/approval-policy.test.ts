import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPROVAL_POLICY,
  normalizeApprovalPolicy,
  validateApprovalPolicy,
  isWithinQuietHours,
  policyRequiresApproval,
  assetMeetsApprovalRequirement,
} from "./approval-policy";

describe("approval-policy", () => {
  it("merges with defaults", () => {
    const policy = normalizeApprovalPolicy({ maxPostsPerDay: 5 });
    expect(policy.maxPostsPerDay).toBe(5);
    expect(policy.requireApprovalForPublish).toBe(true);
    expect(policy.maxPostsPerWeek).toBe(DEFAULT_APPROVAL_POLICY.maxPostsPerWeek);
  });

  it("validates time format and rate caps", () => {
    const issues = validateApprovalPolicy({
      quietHoursStart: "25:00",
      maxPostsPerDay: 50,
      maxPostsPerWeek: 10,
    });
    expect(issues.some((i) => i.field === "quietHoursStart")).toBe(true);
    expect(issues.some((i) => i.field === "maxPostsPerDay")).toBe(true);
  });

  it("detects quiet hours overnight window", () => {
    const policy = normalizeApprovalPolicy({
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    });
    const lateNight = new Date("2026-01-15T23:30:00");
    const midday = new Date("2026-01-15T12:00:00");
    expect(isWithinQuietHours(policy, lateNight)).toBe(true);
    expect(isWithinQuietHours(policy, midday)).toBe(false);
  });

  it("policyRequiresApproval defaults true", () => {
    expect(policyRequiresApproval({})).toBe(true);
    expect(policyRequiresApproval({ requireApprovalForPublish: false })).toBe(false);
  });

  it("assetMeetsApprovalRequirement respects policy", () => {
    expect(assetMeetsApprovalRequirement({ approvalStatus: "pending" }, {})).toBe(false);
    expect(assetMeetsApprovalRequirement({ approvalStatus: "approved" }, {})).toBe(true);
    expect(
      assetMeetsApprovalRequirement(
        { approvalStatus: "pending" },
        { requireApprovalForPublish: false },
      ),
    ).toBe(true);
  });
});
