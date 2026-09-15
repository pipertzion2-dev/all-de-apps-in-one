import type { CleanLabel, SneakerAssetRef } from "./types";
import { BALOON8_BLUEPRINT_URL, BALOON8_SNEAKER_THUMBNAIL_URL } from "./baloon8-textures";

/** Main game logo — brand splash. */
export const KAREN_THE_MUSCLE_LOGO_URL = "/assets/clean-sneaks/karen-the-muscle-logo.jpg";

/** iPbw hubcap wheels — loading screen before each run. */
export const LOADING_WHEEL_URLS = [
  "/assets/clean-sneaks/loading-wheel-yin.jpg",
  "/assets/clean-sneaks/loading-wheel-radial.jpg",
  "/assets/clean-sneaks/loading-wheel-d-logo.jpg",
] as const;

/** Baloon8 side-profile sneaker — the official thumbnail / marketing sprite. */
export const DEFAULT_PLAYER_SHOE_URL = BALOON8_SNEAKER_THUMBNAIL_URL;

export { BALOON8_BLUEPRINT_URL, BALOON8_SNEAKER_THUMBNAIL_URL };

export const DEFAULT_SNEAKER: SneakerAssetRef = {
  spriteUrl: BALOON8_SNEAKER_THUMBNAIL_URL,
  label: "Baloon8",
  source: "default",
};

/** True when the game should fetch a custom flat PNG (never the legacy car-shoe). */
export function shouldLoadSneakerSprite(sneaker: SneakerAssetRef): boolean {
  if (sneaker.useWalkingSprite !== false) return false;
  const url = sneaker.spriteUrl?.trim() ?? "";
  if (!url) return false;
  if (url.includes("player-shoe")) return false;
  return true;
}

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
    useWalkingSprite: override.useWalkingSprite ?? false,
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
