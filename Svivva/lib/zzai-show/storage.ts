import type { ShowEvent } from "./types";

export const ZZAI_SHOW_STORAGE_KEY = "svivva_zzai_show_events";

export function loadShowEvents(): ShowEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ZZAI_SHOW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShowEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveShowEvents(events: ShowEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ZZAI_SHOW_STORAGE_KEY, JSON.stringify(events.slice(0, 100)));
  } catch {
    /* quota */
  }
}

export function newEventId(): string {
  return `show_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newAttendeeId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
