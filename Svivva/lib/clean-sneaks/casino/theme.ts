/**
 * Steal the Old Man's Bundle / Stiehl den alten Manns Bündel
 * Palette sampled from the main title graphic (glitch / film-strip collage).
 */
export const STEAL_BUNDLE_THEME = {
  /** Near-black purple — shell / overlays */
  bgDeep: "#120c18",
  /** Primary panel background */
  bg: "#1a1220",
  /** Raised panels */
  bgPanel: "#2a1f33",
  /** Mid purple from shadowed collage areas */
  purple: "#4B3B5B",
  /** Film-strip / title lavender */
  lavender: "#A992C1",
  lavenderSoft: "#c4b0d4",
  /** Fan-ray / figure sage olive */
  sage: "#8A9A7A",
  sageBright: "#a8b896",
  /** Hot highlights on the figure */
  cream: "#E5E4C2",
  creamMuted: "#c8c4a8",
  /** Steal flash — muted magenta wash from the graphic */
  steal: "#c478a0",
  stealSoft: "#9b6b8a",
  /** Cool film-frame tint */
  filmBlue: "#6a7a9a",
} as const;

export type StealBundleTheme = typeof STEAL_BUNDLE_THEME;

/** CSS custom properties for Steal Bundle surfaces. */
export const STEAL_BUNDLE_CSS_VARS = {
  "--sb-bg-deep": STEAL_BUNDLE_THEME.bgDeep,
  "--sb-bg": STEAL_BUNDLE_THEME.bg,
  "--sb-bg-panel": STEAL_BUNDLE_THEME.bgPanel,
  "--sb-purple": STEAL_BUNDLE_THEME.purple,
  "--sb-lavender": STEAL_BUNDLE_THEME.lavender,
  "--sb-lavender-soft": STEAL_BUNDLE_THEME.lavenderSoft,
  "--sb-sage": STEAL_BUNDLE_THEME.sage,
  "--sb-sage-bright": STEAL_BUNDLE_THEME.sageBright,
  "--sb-cream": STEAL_BUNDLE_THEME.cream,
  "--sb-cream-muted": STEAL_BUNDLE_THEME.creamMuted,
  "--sb-steal": STEAL_BUNDLE_THEME.steal,
} as const;
