import type { OrbitDistributionStatus } from "../graph-constants";

export function computeRetryScheduledAt(retryCount: number): Date {
  const minutes = Math.min(Math.pow(2, retryCount) * 2, 120);
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function statusAfterPublish(ok: boolean, manualReady?: boolean): OrbitDistributionStatus {
  if (manualReady) return "ready_for_manual";
  return ok ? "succeeded" : "failed";
}

export function canRetryJob(
  status: OrbitDistributionStatus,
  retryCount: number,
  maxRetries: number,
): boolean {
  return status === "failed" && retryCount < maxRetries;
}

export function nextStatusForRetry(
  retryCount: number,
  maxRetries: number,
): OrbitDistributionStatus {
  return retryCount < maxRetries ? "pending" : "failed";
}

export function canTransitionJob(
  from: OrbitDistributionStatus,
  to: OrbitDistributionStatus,
): boolean {
  if (from === to) return true;
  const allowed: Record<OrbitDistributionStatus, OrbitDistributionStatus[]> = {
    pending: ["running", "cancelled", "ready_for_manual"],
    running: ["succeeded", "failed", "ready_for_manual"],
    succeeded: ["succeeded"],
    failed: ["pending", "cancelled"],
    ready_for_manual: ["succeeded", "cancelled", "pending"],
    cancelled: ["cancelled"],
  };
  return allowed[from]?.includes(to) ?? false;
}
