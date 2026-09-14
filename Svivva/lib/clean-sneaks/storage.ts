import { cleanlinessMultiplier, streakMultiplier } from "./assets";

export const BEST_SCORE_KEY = "zzai.clean-sneaks.bestScore";

export function readBestScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(score: number): number {
  const next = Math.max(0, Math.floor(score));
  const prev = readBestScore();
  const best = Math.max(prev, next);
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(best));
  } catch {
    /* ignore quota / private mode */
  }
  return best;
}

/**
 * Score = distance points × cleanliness mult × streak mult (+ fresh kicks).
 * A shorter clean run can beat a long filthy run.
 */
export function computeFrameScore(args: {
  distanceDelta: number;
  cleanliness: number;
  streak: number;
  freshKicksActive: boolean;
}): number {
  const base = args.distanceDelta * 10;
  const cleanMul = cleanlinessMultiplier(args.cleanliness);
  const streakMul = streakMultiplier(args.streak);
  const fresh = args.freshKicksActive ? 1.5 : 1;
  return base * cleanMul * streakMul * fresh;
}

export function shareText(score: number, distance: number, cleanliness: number): string {
  return `CLEAN SNEAKS — Score ${Math.floor(score)} · ${Math.floor(distance)}m · ${Math.floor(cleanliness)}% clean. Keep 'em fresh. zzaizzai.com`;
}

export async function shareScore(payload: {
  score: number;
  distance: number;
  cleanliness: number;
}): Promise<"shared" | "copied" | "failed"> {
  const text = shareText(payload.score, payload.distance, payload.cleanliness);
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: "CLEAN SNEAKS",
        text,
        url: "https://zzaizzai.com/clean-sneaks",
      });
      return "shared";
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
