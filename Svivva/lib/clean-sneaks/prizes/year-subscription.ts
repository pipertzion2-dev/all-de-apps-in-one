/**
 * Klean Sneaks — chance to win 1 year of ZZAI Pro after a solo Steal Bundle win.
 * Odds are server-side; claim requires a signed-in account.
 */

export const YEAR_SUB_PRIZE_DAYS = 365;
/** Default ~1 in 20 solo wins (5%). Override with KLEAN_YEAR_SUB_ODDS (0–1). */
export const DEFAULT_YEAR_SUB_WIN_ODDS = 0.05;
export const YEAR_SUB_CLAIM_WINDOW_DAYS = 30;
export const YEAR_SUB_SOURCE = "klean_sneaks_year_prize";

export function yearSubWinOdds(): number {
  const raw = process.env.KLEAN_YEAR_SUB_ODDS?.trim();
  if (!raw) return DEFAULT_YEAR_SUB_WIN_ODDS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_YEAR_SUB_WIN_ODDS;
  return Math.min(1, Math.max(0, n));
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Extend existing complimentary Pro, or start a fresh year from now. */
export function computeProAccessUntil(existing: Date | null | undefined, now = new Date()): Date {
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  return addDays(base, YEAR_SUB_PRIZE_DAYS);
}

export function deviceIdStorageKey(): string {
  return "klean_sneaks_device_id";
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(deviceIdStorageKey());
    if (existing && existing.length >= 8) return existing.slice(0, 64);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(deviceIdStorageKey(), id);
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}
