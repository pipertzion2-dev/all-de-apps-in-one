import type { OrbitIndexStatus } from "../graph-constants";
import type { UrlProbeResult } from "./index-types";

/** Backoff schedule for recheck polling (hours). */
const RECHECK_HOURS: Record<OrbitIndexStatus, number> = {
  created: 1,
  discoverable: 6,
  submitted: 24,
  crawl_detected: 48,
  indexed: 168,
  not_indexed: 72,
  unknown: 24,
  failed: 12,
};

export function computeNextCheckAt(status: OrbitIndexStatus, retryCount = 0): Date {
  const baseHours = RECHECK_HOURS[status] ?? 24;
  const hours = Math.min(baseHours * Math.pow(1.5, retryCount), 168);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function statusAfterProbe(
  current: OrbitIndexStatus,
  probe: Pick<UrlProbeResult, "reachable" | "indexable">,
): OrbitIndexStatus {
  if (!probe.reachable) {
    return current === "created" ? "failed" : current;
  }
  if (!probe.indexable) {
    return current === "created" ? "failed" : "not_indexed";
  }

  switch (current) {
    case "created":
      return "discoverable";
    case "submitted":
      return "crawl_detected";
    case "crawl_detected":
      return "indexed";
    case "discoverable":
      return "discoverable";
    case "indexed":
      return "indexed";
    default:
      return probe.indexable ? "discoverable" : current;
  }
}

export function statusAfterSubmit(ok: boolean): OrbitIndexStatus {
  return ok ? "submitted" : "failed";
}

export function canTransition(from: OrbitIndexStatus, to: OrbitIndexStatus): boolean {
  if (from === to) return true;
  const allowed: Record<OrbitIndexStatus, OrbitIndexStatus[]> = {
    created: ["discoverable", "failed", "unknown"],
    discoverable: ["submitted", "failed", "discoverable"],
    submitted: ["crawl_detected", "indexed", "not_indexed", "failed", "unknown"],
    crawl_detected: ["indexed", "not_indexed", "unknown"],
    indexed: ["indexed", "not_indexed"],
    not_indexed: ["submitted", "discoverable", "failed"],
    unknown: ["discoverable", "submitted", "failed", "indexed", "not_indexed"],
    failed: ["created", "discoverable", "submitted"],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function aggregateUrlStatus(statuses: OrbitIndexStatus[]): OrbitIndexStatus {
  if (statuses.includes("indexed")) return "indexed";
  if (statuses.includes("crawl_detected")) return "crawl_detected";
  if (statuses.includes("submitted")) return "submitted";
  if (statuses.includes("discoverable")) return "discoverable";
  if (statuses.every((s) => s === "failed")) return "failed";
  if (statuses.includes("not_indexed")) return "not_indexed";
  return statuses[0] || "unknown";
}
