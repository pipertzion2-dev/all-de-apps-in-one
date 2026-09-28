import { FREE_ONLINE_TABLES_PER_MONTH, GUEST_ONLINE_TABLES_PER_MONTH } from "./platform-strategy";

export type OnlineSubject = { type: "user" | "device"; id: string };

export function utcMonthKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function nextUtcMonthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function monthlyLimitForSubject(subject: OnlineSubject, unlimited: boolean): number {
  if (unlimited) return 0;
  return subject.type === "user" ? FREE_ONLINE_TABLES_PER_MONTH : GUEST_ONLINE_TABLES_PER_MONTH;
}

export function canStartOnlineTable(
  usedThisMonth: number,
  limit: number,
): { ok: true } | { ok: false; reason: "quota_exhausted" } {
  if (limit === 0) return { ok: true };
  if (usedThisMonth < limit) return { ok: true };
  return { ok: false, reason: "quota_exhausted" };
}

export function normalizeGamerTag(raw: string): string | null {
  const trimmed = raw.trim().slice(0, 20);
  if (trimmed.length < 3) return null;
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function consumptionId(subject: OnlineSubject, roomCode: string): string {
  return `${subject.type}:${subject.id}:${roomCode}`.slice(0, 180);
}
