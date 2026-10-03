import type { AdPlacementId } from "./types";
import type { ProgrammaticNetwork } from "./programmatic";

export type PaidInGameNetwork = "adsense" | ProgrammaticNetwork;

const ROTATE_PREFIX = "klean_paid_rot_";

/** Advance rotation counter and return index in [0, mod). */
export function consumePaidRotationIndex(placement: AdPlacementId, mod: number): number {
  if (mod <= 1) return 0;
  if (typeof window === "undefined") return 0;
  const key = `${ROTATE_PREFIX}${placement}`;
  try {
    const storage = window.sessionStorage;
    const raw = storage.getItem(key);
    const current = raw ? Number.parseInt(raw, 10) : 0;
    const idx = Number.isFinite(current) ? ((current % mod) + mod) % mod : 0;
    storage.setItem(key, String(idx + 1));
    return idx;
  } catch {
    return Math.abs(Math.floor(Date.now() / 120_000)) % mod;
  }
}

export function pickFromPaidCandidates(
  placement: AdPlacementId,
  candidates: readonly PaidInGameNetwork[],
): PaidInGameNetwork | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;
  const idx = consumePaidRotationIndex(placement, candidates.length);
  return candidates[idx]!;
}

/** Test helper — reset rotation between cases. */
export function resetPaidRotationForTests(): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.sessionStorage;
    for (let i = storage.length - 1; i >= 0; i--) {
      const k = storage.key(i);
      if (k?.startsWith(ROTATE_PREFIX)) storage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
