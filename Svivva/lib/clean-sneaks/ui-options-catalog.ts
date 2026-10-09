/**
 * Discover your perfect UI — strategic layout catalog.
 * Palette stays faithful to the imported reference; these options reshape chrome.
 */

export type HudPlacement =
  | "top-split"
  | "top-bar"
  | "bottom-dock"
  | "letterbox"
  | "corners"
  | "broadcast";

export type PanelShape = "rounded" | "sharp" | "pill" | "ticket" | "bracket";
export type UiDensity = "air" | "balanced" | "dense";
export type TypeTone = "sans" | "display" | "mono" | "editorial";
export type ChromeStyle = "glass" | "solid" | "outline" | "glow" | "sticker";
export type RadiusToken = "none" | "sm" | "md" | "full";

export type UiOptionPrefer = {
  luminance?: "dark" | "light" | "any";
  saturation?: "low" | "mid" | "high";
  contrast?: "soft" | "hard";
};

export type KleanUiOption = {
  id: string;
  label: string;
  blurb: string;
  /** Keywords that pull this option toward a text/URL reference */
  tags: string[];
  hudPlacement: HudPlacement;
  panelShape: PanelShape;
  density: UiDensity;
  typeTone: TypeTone;
  chrome: ChromeStyle;
  radius: RadiusToken;
  prefer: UiOptionPrefer;
};

/** Multitude of strategic UI skins — same game, different chrome language. */
export const KLEAN_UI_OPTIONS: readonly KleanUiOption[] = [
  {
    id: "arcade-cabinet",
    label: "Arcade Cabinet",
    blurb: "Chunky bezel, bottom dock, score stack — coin-op energy.",
    tags: ["arcade", "cabinet", "retro", "pixel", "8bit", "cabinet", "coin", "neon"],
    hudPlacement: "bottom-dock",
    panelShape: "sharp",
    density: "dense",
    typeTone: "display",
    chrome: "solid",
    radius: "sm",
    prefer: { luminance: "dark", saturation: "high", contrast: "hard" },
  },
  {
    id: "glass-minimal",
    label: "Glass Minimal",
    blurb: "Frosted strips, airy gaps, quiet type — reference colors only.",
    tags: ["glass", "minimal", "clean", "frost", "air", "apple", "ios", "spa"],
    hudPlacement: "top-bar",
    panelShape: "rounded",
    density: "air",
    typeTone: "sans",
    chrome: "glass",
    radius: "md",
    prefer: { luminance: "any", saturation: "low", contrast: "soft" },
  },
  {
    id: "street-flyer",
    label: "Street Flyer",
    blurb: "Sticker chips, diagonal accent, bold stacked headlines.",
    tags: ["street", "flyer", "poster", "graffiti", "sticker", "skate", "urban", "hiphop"],
    hudPlacement: "corners",
    panelShape: "ticket",
    density: "balanced",
    typeTone: "display",
    chrome: "sticker",
    radius: "sm",
    prefer: { luminance: "dark", saturation: "high", contrast: "hard" },
  },
  {
    id: "luxury-editorial",
    label: "Luxury Editorial",
    blurb: "Hairline rules, wide tracking, magazine caption strips.",
    tags: ["luxury", "editorial", "fashion", "magazine", "vogue", "cream", "serif", "couture"],
    hudPlacement: "letterbox",
    panelShape: "sharp",
    density: "air",
    typeTone: "editorial",
    chrome: "outline",
    radius: "none",
    prefer: { luminance: "light", saturation: "low", contrast: "soft" },
  },
  {
    id: "neon-night",
    label: "Neon Night",
    blurb: "Glow borders, docked controls, night-drive contrast.",
    tags: ["neon", "night", "cyber", "tokyo", "glow", "synth", "club", "rain"],
    hudPlacement: "bottom-dock",
    panelShape: "pill",
    density: "balanced",
    typeTone: "sans",
    chrome: "glow",
    radius: "full",
    prefer: { luminance: "dark", saturation: "high", contrast: "hard" },
  },
  {
    id: "retro-terminal",
    label: "Retro Terminal",
    blurb: "Bracket corners, mono readouts, scanline discipline.",
    tags: ["terminal", "hacker", "mono", "crt", "matrix", "console", "cli", "green"],
    hudPlacement: "corners",
    panelShape: "bracket",
    density: "dense",
    typeTone: "mono",
    chrome: "outline",
    radius: "none",
    prefer: { luminance: "dark", saturation: "mid", contrast: "hard" },
  },
  {
    id: "sport-broadcast",
    label: "Sport Broadcast",
    blurb: "Lower-third bars, live score strip, ticker cadence.",
    tags: ["sport", "broadcast", "espn", "score", "live", "stadium", "game", "ticker"],
    hudPlacement: "broadcast",
    panelShape: "sharp",
    density: "dense",
    typeTone: "display",
    chrome: "solid",
    radius: "sm",
    prefer: { luminance: "dark", saturation: "high", contrast: "hard" },
  },
  {
    id: "vapor-wave",
    label: "Vapor Wave",
    blurb: "Soft gradients, pill chips, dreamy centered chrome.",
    tags: ["vapor", "vaporwave", "pastel", "dream", "sunset", "aesthetic", "soft", "pink"],
    hudPlacement: "top-split",
    panelShape: "pill",
    density: "air",
    typeTone: "display",
    chrome: "glass",
    radius: "full",
    prefer: { luminance: "any", saturation: "high", contrast: "soft" },
  },
  {
    id: "industrial-gauge",
    label: "Industrial Gauge",
    blurb: "Angular meters, hard panels, workshop readouts.",
    tags: ["industrial", "gauge", "metal", "workshop", "steel", "tech", "machine", "factory"],
    hudPlacement: "top-bar",
    panelShape: "sharp",
    density: "dense",
    typeTone: "mono",
    chrome: "solid",
    radius: "none",
    prefer: { luminance: "dark", saturation: "low", contrast: "hard" },
  },
  {
    id: "comic-pop",
    label: "Comic Pop",
    blurb: "Thick outlines, offset chips, punchy action HUD.",
    tags: ["comic", "pop", "cartoon", "bold", "manga", "ink", "popart", "burst"],
    hudPlacement: "corners",
    panelShape: "ticket",
    density: "balanced",
    typeTone: "display",
    chrome: "sticker",
    radius: "md",
    prefer: { luminance: "any", saturation: "high", contrast: "hard" },
  },
  {
    id: "cinema-letterbox",
    label: "Cinema Letterbox",
    blurb: "Wide bars, sparse HUD, trailer-title focus.",
    tags: ["cinema", "film", "movie", "letterbox", "trailer", "noir", "widescreen", "director"],
    hudPlacement: "letterbox",
    panelShape: "sharp",
    density: "air",
    typeTone: "editorial",
    chrome: "solid",
    radius: "none",
    prefer: { luminance: "dark", saturation: "low", contrast: "soft" },
  },
  {
    id: "mobile-dock",
    label: "Mobile Dock",
    blurb: "Thumb-zone dock, floating CTA, phone-native stack.",
    tags: ["mobile", "dock", "app", "ios", "android", "thumb", "phone", "native"],
    hudPlacement: "bottom-dock",
    panelShape: "rounded",
    density: "balanced",
    typeTone: "sans",
    chrome: "glass",
    radius: "full",
    prefer: { luminance: "any", saturation: "mid", contrast: "soft" },
  },
  {
    id: "magazine-spread",
    label: "Magazine Spread",
    blurb: "Caption rails, dual-column chrome, pull-quote score.",
    tags: ["magazine", "spread", "print", "layout", "column", "caption", "editorial", "lookbook"],
    hudPlacement: "top-split",
    panelShape: "sharp",
    density: "air",
    typeTone: "editorial",
    chrome: "outline",
    radius: "none",
    prefer: { luminance: "light", saturation: "mid", contrast: "soft" },
  },
  {
    id: "stealth-ops",
    label: "Stealth Ops",
    blurb: "Reticles, muted panels, tight mission density.",
    tags: ["stealth", "ops", "military", "tactical", "camo", "mission", "recon", "night"],
    hudPlacement: "corners",
    panelShape: "bracket",
    density: "dense",
    typeTone: "mono",
    chrome: "outline",
    radius: "none",
    prefer: { luminance: "dark", saturation: "low", contrast: "hard" },
  },
  {
    id: "pastel-toy",
    label: "Pastel Toy",
    blurb: "Soft radii, playful chips, light candy panels.",
    tags: ["pastel", "toy", "candy", "cute", "soft", "kids", "playful", "bubble"],
    hudPlacement: "top-split",
    panelShape: "pill",
    density: "balanced",
    typeTone: "sans",
    chrome: "solid",
    radius: "full",
    prefer: { luminance: "light", saturation: "mid", contrast: "soft" },
  },
  {
    id: "court-docket",
    label: "Court Docket",
    blurb: "Evidence rails, seal chips, formal stacked proof HUD.",
    tags: ["court", "docket", "legal", "patent", "seal", "evidence", "protect", "archive"],
    hudPlacement: "broadcast",
    panelShape: "ticket",
    density: "balanced",
    typeTone: "editorial",
    chrome: "outline",
    radius: "sm",
    prefer: { luminance: "dark", saturation: "low", contrast: "hard" },
  },
] as const;

export type KleanUiOptionId = (typeof KLEAN_UI_OPTIONS)[number]["id"];

export function getUiOption(id?: string | null): KleanUiOption {
  return KLEAN_UI_OPTIONS.find((o) => o.id === id) ?? KLEAN_UI_OPTIONS[0]!;
}

export const UI_OPTION_IDS = KLEAN_UI_OPTIONS.map((o) => o.id);

/** CSS radius token → pixel-ish value for inline styles */
export function radiusCss(token: RadiusToken): string {
  switch (token) {
    case "none":
      return "0px";
    case "sm":
      return "6px";
    case "md":
      return "14px";
    case "full":
      return "999px";
  }
}
