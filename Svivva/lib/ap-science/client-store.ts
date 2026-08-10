import { trackEvent } from "@/lib/analytics";
import type { AttemptRecord } from "@/lib/ap-science/types";

const STORAGE_PREFIX = "zzai:ap-science:attempts:";

export function trackApLearnEvent(name: string, params?: Record<string, unknown>) {
  trackEvent(name, {
    event_category: "ap_science",
    ...params,
  });
}

export function loadLocalAttempts(conceptId: string): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + conceptId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttemptRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalAttempts(conceptId: string, attempts: AttemptRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + conceptId, JSON.stringify(attempts.slice(-80)));
  } catch {
    /* ignore quota */
  }
}
