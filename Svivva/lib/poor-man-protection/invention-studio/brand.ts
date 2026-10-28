/**
 * Invention Protection Studio brand tokens — taken from Cube Protect /
 * Poor Man Protection (seal chamber + Protect face), not a new palette.
 */
export const PROTECT_BRAND = {
  steel: "#5B8DA8",
  burgundy: "#6B2C4E",
  blush: "#D4A5B8",
  warm: "#8B6B5A",
  faceAccent: "#4a9cac",
  gradient: "linear-gradient(135deg, #5B8DA8, #6B2C4E)",
  softFill: "rgba(91, 141, 168, 0.08)",
  softBorder: "rgba(91, 141, 168, 0.25)",
} as const;

export const PROTECT_PALETTE = [
  PROTECT_BRAND.steel,
  PROTECT_BRAND.burgundy,
  PROTECT_BRAND.blush,
  PROTECT_BRAND.warm,
] as const;
