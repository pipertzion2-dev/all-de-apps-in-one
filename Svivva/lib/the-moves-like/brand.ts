/** THE MOVES LIKE — product brand tokens (glass blue / purple accents). */

export const MOVES_LIKE = {
  id: "the-moves-like",
  name: "THE MOVES LIKE",
  shortName: "Moves Like",
  tagline: "Explore, learn, transform, play, and share movement.",
  path: "/play",
  /** Dark spray ink on transparent — default for light/white glass UI. */
  logoPath: "/the-moves-like/logo.png",
  /** Light spray ink — only for rare dark overlays. */
  logoLightPath: "/the-moves-like/logo-light.png",
  /** Glass transparent blue */
  teal: "#6D91B3",
  tealDeep: "#4F7396",
  tealSoft: "#A8C0D4",
  /** Soft purple accent */
  magenta: "#AC81AF",
  magentaSoft: "#D4C0D6",
  mauve: "#C090A8",
  ink: "#0F1A1C",
  paper: "#F7FBFC",
  spray: "#1A2A2E",
} as const;

export const MOVES_LIKE_HEX = {
  primary: 0x6d91b3,
  secondary: 0xac81af,
  tertiary: 0xc090a8,
  highlight: 0xa8c0d4,
  ink: 0x0f1a1c,
  paper: 0xf7fbfc,
} as const;
