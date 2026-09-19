import { cleanlinessMultiplier, streakMultiplier } from "@/lib/clean-sneaks/assets";
import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";

/** Rough run score for the free estimator — not live gameplay scoring. */
export function estimateKleanRunScore(args: {
  distanceM: number;
  cleanliness: number;
  streak: number;
}): number {
  const distanceM = Math.max(0, args.distanceM);
  const cleanMul = cleanlinessMultiplier(Math.min(100, Math.max(0, args.cleanliness)));
  const streakMul = streakMultiplier(Math.max(0, Math.floor(args.streak)));
  let total = distanceM * 10 * cleanMul * streakMul;
  if (distanceM >= FINISH_DISTANCE) {
    const bonus = 1.65 + Math.min(0.85, args.cleanliness / 120);
    total *= bonus;
  }
  return Math.floor(total);
}
