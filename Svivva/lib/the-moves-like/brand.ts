/** THE MOVES LIKE — product brand tokens (uses ZZAI palette, not a neon rewrite). */

export const MOVES_LIKE = {
  id: "the-moves-like",
  name: "THE MOVES LIKE",
  shortName: "Moves Like",
  tagline: "Explore, learn, transform, play, and share movement.",
  path: "/the-moves-like",
  /** Transparent PNG for OG/schema; prefer logoLightPath in the dark UI. */
  logoPath: "/the-moves-like/logo.png",
  /** Light spray ink on transparent — use on dark stages (no white plate). */
  logoLightPath: "/the-moves-like/logo-light.png",
  /** ZZAI site teal — matches homepage / explore accents */
  teal: "#5B8DA8",
  tealDeep: "#3A6F88",
  tealSoft: "#90C4D8",
  /** ZZAI magenta accent family from CSS --accent */
  magenta: "#C44A9A",
  magentaSoft: "#E8A0D0",
  mauve: "#C090A8",
  ink: "#0F1A1C",
  paper: "#F7FBFC",
  spray: "#1A2A2E",
} as const;

export const MOVES_LIKE_HEX = {
  primary: 0x5b8da8,
  secondary: 0xc44a9a,
  tertiary: 0xc090a8,
  highlight: 0x60c8d8,
  ink: 0x0f1a1c,
  paper: 0xf7fbfc,
} as const;
