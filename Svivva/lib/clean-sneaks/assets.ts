import type { CleanLabel, SneakerAssetRef } from "./types";

/** Default replaceable custom sneaker — see public/assets/clean-sneaks/README.md */
export const DEFAULT_PLAYER_SHOE_URL = "/assets/clean-sneaks/player-shoe.png";

/** Baloon8 car-shoe blueprint reference (four orthographic views). */
export const BALOON8_BLUEPRINT_URL = "/assets/clean-sneaks/baloon8-blueprint.jpg";

export const DEFAULT_SNEAKER: SneakerAssetRef = {
  spriteUrl: DEFAULT_PLAYER_SHOE_URL,
  label: "Baloon8",
  source: "default",
};

/**
 * Resolve which sneaker the player wears.
 * Future: wire ZZAI design lab / profile sneakers here.
 */
export function resolvePlayerSneaker(override?: Partial<SneakerAssetRef> | null): SneakerAssetRef {
  if (!override?.spriteUrl) return DEFAULT_SNEAKER;
  return {
    ...DEFAULT_SNEAKER,
    ...override,
    spriteUrl: override.spriteUrl,
  };
}

export function cleanLabelFrom(cleanliness: number): CleanLabel {
  if (cleanliness <= 0) return "COOKED";
  if (cleanliness >= 80) return "FRESH";
  if (cleanliness >= 60) return "CLEAN";
  if (cleanliness >= 40) return "GETTING DIRTY";
  if (cleanliness >= 20) return "DIRTY";
  return "FILTHY";
}

export function streakLabelFrom(streak: number): string {
  if (streak >= 12) return "FRESH x5";
  if (streak >= 8) return "CLEAN x4";
  if (streak >= 5) return "CLEAN x3";
  if (streak >= 3) return "CLEAN x2";
  return "CLEAN x1";
}

export function streakMultiplier(streak: number): number {
  if (streak >= 12) return 5;
  if (streak >= 8) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

/** Cleanliness band drives score multiplier (cleaner runs score higher). */
export function cleanlinessMultiplier(cleanliness: number): number {
  if (cleanliness >= 90) return 2.0;
  if (cleanliness >= 80) return 1.75;
  if (cleanliness >= 60) return 1.45;
  if (cleanliness >= 40) return 1.2;
  if (cleanliness >= 20) return 1.0;
  return 0.75;
}
