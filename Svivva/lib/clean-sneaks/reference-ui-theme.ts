/**
 * Reference → Klean Sneaks UI theme.
 * Palette stays faithful to the import; strategic UI options reshape chrome/layout.
 */

import type { ColorSwatch } from "@/lib/poor-man-protection/types";
import {
  ALL_COLORWAY_IDS,
  BALOON8_COLORWAYS,
  type Baloon8ColorwayId,
} from "@/lib/clean-sneaks/sneaker-catalog";
import {
  getUiOption,
  KLEAN_UI_OPTIONS,
  radiusCss,
  type KleanUiOption,
  type KleanUiOptionId,
} from "@/lib/clean-sneaks/ui-options-catalog";

export const REFERENCE_UI_THEME_STORAGE_KEY = "zzai.clean-sneaks.uiTheme.v1";
export const REFERENCE_UI_PENDING_SEAL_KEY = "zzai.clean-sneaks.uiTheme.pendingSeal.v1";

export type ReferenceSignals = {
  luminance: "dark" | "light";
  saturation: "low" | "mid" | "high";
  contrast: "soft" | "hard";
  avgLuminance: number;
  avgSaturation: number;
  contrastSpan: number;
};

export type RankedUiOption = {
  id: KleanUiOptionId;
  score: number;
  reasons: string[];
};

export type KleanReferenceUiTheme = {
  version: 2;
  /** User-facing label for this remix */
  name: string;
  /** Free-text or URL reference the user entered */
  referenceText: string;
  /** When the theme was applied */
  createdAt: string;
  /** Content hash of reference bytes or theme JSON */
  contentHash: string;
  palette: ColorSwatch[];
  /** Shell / HUD colors — sampled/seeded to match the reference */
  colors: {
    bgDeep: string;
    bg: string;
    bgPanel: string;
    accent: string;
    accentSoft: string;
    highlight: string;
    text: string;
    muted: string;
    danger: string;
  };
  /** Strategic layout option (catalog) */
  uiOptionId: KleanUiOptionId;
  /** Ranked alternatives for the same reference */
  rankedUiOptions: RankedUiOption[];
  /** Analyzed signals used for matching */
  signals: ReferenceSignals;
  /** Nearest stock colorway for 3D chassis tint */
  nearestColorwayId: Baloon8ColorwayId;
  /** Optional source file name */
  fileName?: string;
  /** Certificate id / hash when auto-sealed */
  sealContentHash?: string;
};

export type ReferenceUiCssVars = Record<`--klean-${string}`, string>;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return { r: 91, g: 141, b: 168 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function saturationOf(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function darken(hex: string, amount: number): string {
  return mixHex(hex, "#000000", amount);
}

function lighten(hex: string, amount: number): string {
  return mixHex(hex, "#ffffff", amount);
}

function swatchByRole(palette: ColorSwatch[], role: ColorSwatch["role"], fallback: string): string {
  return palette.find((p) => p.role === role)?.hex ?? palette[0]?.hex ?? fallback;
}

/** FNV-1a inspired seed from text for deterministic text-only palettes. */
export function hashTextToSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return clampByte(255 * c);
  };
  return rgbToHex(f(0), f(8), f(4));
}

/** Build a 5-swatch palette when the user only typed a text/URL reference. */
export function paletteFromTextReference(text: string): ColorSwatch[] {
  const seed = hashTextToSeed(text.trim().toLowerCase() || "klean");
  const hue = seed % 360;
  const hues = [hue, (hue + 32) % 360, (hue + 168) % 360, (hue + 200) % 360, (hue + 48) % 360];
  const lights = [42, 28, 58, 14, 78];
  const sats = [55, 48, 62, 35, 40];
  const roles: ColorSwatch["role"][] = ["dominant", "secondary", "accent", "shadow", "highlight"];
  return roles.map((role, i) => ({
    hex: hslToHex(hues[i]!, sats[i]!, lights[i]!),
    role,
    weight: Number((1 / roles.length).toFixed(3)),
  }));
}

function colorDistance(a: string, b: string): number {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return (A.r - B.r) ** 2 + (A.g - B.g) ** 2 + (A.b - B.b) ** 2;
}

/** Pick the BALOON8 colorway whose tint hex is closest to the reference accent. */
export function nearestColorwayId(palette: ColorSwatch[]): Baloon8ColorwayId {
  const target =
    swatchByRole(palette, "accent", "") ||
    swatchByRole(palette, "dominant", "#5B8DA8") ||
    "#5B8DA8";
  let best: Baloon8ColorwayId = "oilSlick";
  let bestDist = Infinity;
  for (const id of ALL_COLORWAY_IDS) {
    const d = colorDistance(BALOON8_COLORWAYS[id].tint, target);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/** Derive luminance / saturation / contrast buckets from the reference palette. */
export function analyzeReferenceSignals(palette: ColorSwatch[]): ReferenceSignals {
  const lum = palette.map((p) => relativeLuminance(p.hex));
  const sat = palette.map((p) => saturationOf(p.hex));
  const avgLuminance = lum.reduce((a, b) => a + b, 0) / Math.max(1, lum.length);
  const avgSaturation = sat.reduce((a, b) => a + b, 0) / Math.max(1, sat.length);
  const contrastSpan = Math.max(...lum, 0) - Math.min(...lum, 1);
  return {
    luminance: avgLuminance >= 0.42 ? "light" : "dark",
    saturation: avgSaturation < 0.28 ? "low" : avgSaturation < 0.55 ? "mid" : "high",
    contrast: contrastSpan >= 0.35 ? "hard" : "soft",
    avgLuminance,
    avgSaturation,
    contrastSpan,
  };
}

function keywordScore(option: KleanUiOption, haystack: string): { score: number; hits: string[] } {
  const hits: string[] = [];
  let score = 0;
  for (const tag of option.tags) {
    if (haystack.includes(tag.toLowerCase())) {
      hits.push(tag);
      score += 3;
    }
  }
  // Soft match on label words
  for (const word of option.label.toLowerCase().split(/\s+/)) {
    if (word.length > 3 && haystack.includes(word)) {
      score += 1;
      if (!hits.includes(word)) hits.push(word);
    }
  }
  return { score, hits };
}

function preferenceScore(option: KleanUiOption, signals: ReferenceSignals): number {
  let score = 0;
  const { prefer } = option;
  if (!prefer.luminance || prefer.luminance === "any" || prefer.luminance === signals.luminance) {
    score += prefer.luminance && prefer.luminance !== "any" ? 2 : 0.5;
  } else {
    score -= 1.5;
  }
  if (!prefer.saturation || prefer.saturation === signals.saturation) {
    score += prefer.saturation ? 2 : 0.5;
  } else if (
    (prefer.saturation === "mid" && signals.saturation !== "mid") ||
    (signals.saturation === "mid" && prefer.saturation)
  ) {
    score += 0.25;
  } else {
    score -= 1;
  }
  if (!prefer.contrast || prefer.contrast === signals.contrast) {
    score += prefer.contrast ? 2 : 0.5;
  } else {
    score -= 1;
  }
  return score;
}

/**
 * Rank every UI option for a reference.
 * Palette fidelity is separate — matching only chooses strategic chrome.
 */
export function rankUiOptionsForReference(input: {
  referenceText: string;
  palette: ColorSwatch[];
  fileName?: string;
}): { signals: ReferenceSignals; ranked: RankedUiOption[] } {
  const signals = analyzeReferenceSignals(input.palette);
  const haystack = `${input.referenceText} ${input.fileName ?? ""}`.toLowerCase();
  const seed = hashTextToSeed(haystack || "klean");

  const ranked: RankedUiOption[] = KLEAN_UI_OPTIONS.map((option, index) => {
    const { score: kw, hits } = keywordScore(option, haystack);
    const pref = preferenceScore(option, signals);
    // Tiny deterministic jitter so ties still diversify across references
    const jitter = ((seed >> (index % 16)) & 7) * 0.01;
    const score = Number((kw + pref + jitter).toFixed(3));
    const reasons: string[] = [];
    if (hits.length) reasons.push(`matches “${hits.slice(0, 3).join(", ")}”`);
    reasons.push(`${signals.luminance}/${signals.saturation}/${signals.contrast} fit`);
    return { id: option.id, score, reasons };
  }).sort((a, b) => b.score - a.score);

  return { signals, ranked };
}

export function buildReferenceUiTheme(input: {
  name?: string;
  referenceText: string;
  palette: ColorSwatch[];
  contentHash: string;
  fileName?: string;
  createdAt?: string;
  /** Force a catalog option; otherwise auto-picks the best ranked match */
  uiOptionId?: KleanUiOptionId | string;
}): KleanReferenceUiTheme {
  const palette =
    input.palette.length > 0 ? input.palette : paletteFromTextReference(input.referenceText);

  // Faithful color shell from the reference itself
  const dominant = swatchByRole(palette, "dominant", "#5B8DA8");
  const secondary = swatchByRole(palette, "secondary", darken(dominant, 0.35));
  const accent = swatchByRole(palette, "accent", lighten(dominant, 0.2));
  const shadow = swatchByRole(palette, "shadow", darken(dominant, 0.75));
  const highlight = swatchByRole(palette, "highlight", lighten(accent, 0.35));

  const bgDeep = relativeLuminance(shadow) < 0.08 ? shadow : darken(shadow, 0.45);
  const bg = mixHex(bgDeep, secondary, 0.25);
  const bgPanel = mixHex(bg, dominant, 0.35);
  const text = relativeLuminance(highlight) > 0.55 ? highlight : "#f4f1ea";
  const muted = mixHex(text, bg, 0.45);

  const { signals, ranked } = rankUiOptionsForReference({
    referenceText: input.referenceText,
    palette,
    fileName: input.fileName,
  });

  const chosenId = (
    input.uiOptionId && getUiOption(input.uiOptionId).id === input.uiOptionId
      ? input.uiOptionId
      : ranked[0]?.id
  ) as KleanUiOptionId;
  const option = getUiOption(chosenId);

  const trimmed = input.referenceText.trim();
  const name =
    input.name?.trim() ||
    (trimmed.length > 0
      ? `${option.label} · ${trimmed.slice(0, 28)}${trimmed.length > 28 ? "…" : ""}`
      : `${option.label} remix`);

  return {
    version: 2,
    name,
    referenceText: trimmed,
    createdAt: input.createdAt ?? new Date().toISOString(),
    contentHash: input.contentHash.toLowerCase(),
    palette,
    colors: {
      bgDeep,
      bg,
      bgPanel,
      accent,
      accentSoft: mixHex(accent, bg, 0.35),
      highlight,
      text,
      muted,
      danger: mixHex("#e85d5d", accent, 0.25),
    },
    uiOptionId: option.id,
    rankedUiOptions: ranked,
    signals,
    nearestColorwayId: nearestColorwayId(palette),
    fileName: input.fileName,
  };
}

/** Re-skin the same reference palette onto another strategic UI option. */
export function retargetUiOption(
  theme: KleanReferenceUiTheme,
  uiOptionId: KleanUiOptionId | string,
): KleanReferenceUiTheme {
  const option = getUiOption(uiOptionId);
  const trimmed = theme.referenceText.trim();
  return {
    ...theme,
    version: 2,
    uiOptionId: option.id,
    name:
      trimmed.length > 0
        ? `${option.label} · ${trimmed.slice(0, 28)}${trimmed.length > 28 ? "…" : ""}`
        : `${option.label} remix`,
  };
}

export function referenceUiThemeToCssVars(theme: KleanReferenceUiTheme): ReferenceUiCssVars {
  const c = theme.colors;
  const option = getUiOption(theme.uiOptionId);
  return {
    "--klean-bg-deep": c.bgDeep,
    "--klean-bg": c.bg,
    "--klean-bg-panel": c.bgPanel,
    "--klean-accent": c.accent,
    "--klean-accent-soft": c.accentSoft,
    "--klean-highlight": c.highlight,
    "--klean-text": c.text,
    "--klean-muted": c.muted,
    "--klean-danger": c.danger,
    "--klean-radius": radiusCss(option.radius),
    "--klean-hud": option.hudPlacement,
    "--klean-chrome": option.chrome,
    "--klean-density": option.density,
    "--klean-type": option.typeTone,
    "--klean-panel-shape": option.panelShape,
  };
}

/** Inline style object for React (CSSProperties-compatible string map). */
export function referenceUiThemeStyle(theme: KleanReferenceUiTheme | null): Record<string, string> {
  if (!theme) return {};
  return referenceUiThemeToCssVars(theme) as Record<string, string>;
}

function migrateLegacyTheme(raw: unknown): KleanReferenceUiTheme | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<KleanReferenceUiTheme> & { version?: number };
  if (!parsed.colors?.accent || !parsed.contentHash) return null;
  if (parsed.version === 2 && parsed.uiOptionId && parsed.rankedUiOptions) {
    return parsed as KleanReferenceUiTheme;
  }
  // v1 → rebuild ranking from stored palette / text
  return buildReferenceUiTheme({
    name: parsed.name,
    referenceText: parsed.referenceText || parsed.name || "legacy remix",
    palette: parsed.palette || paletteFromTextReference(parsed.referenceText || "legacy"),
    contentHash: parsed.contentHash,
    fileName: parsed.fileName,
    createdAt: parsed.createdAt,
  });
}

export function readSavedReferenceUiTheme(): KleanReferenceUiTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REFERENCE_UI_THEME_STORAGE_KEY);
    if (!raw) return null;
    return migrateLegacyTheme(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSavedReferenceUiTheme(theme: KleanReferenceUiTheme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFERENCE_UI_THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function clearSavedReferenceUiTheme(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERENCE_UI_THEME_STORAGE_KEY);
}

export type PendingUiSeal = {
  theme: KleanReferenceUiTheme;
  imageBase64?: string;
  mimeType?: string;
  fileName?: string;
  queuedAt: string;
};

export function readPendingUiSeal(): PendingUiSeal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REFERENCE_UI_PENDING_SEAL_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingUiSeal;
    const theme = migrateLegacyTheme(pending.theme);
    if (!theme) return null;
    return { ...pending, theme };
  } catch {
    return null;
  }
}

export function writePendingUiSeal(pending: PendingUiSeal): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFERENCE_UI_PENDING_SEAL_KEY, JSON.stringify(pending));
}

export function clearPendingUiSeal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERENCE_UI_PENDING_SEAL_KEY);
}

/** Canonical payload string used when hashing a text-only remix. */
export function themeHashPayload(
  theme: Omit<KleanReferenceUiTheme, "contentHash" | "sealContentHash">,
): string {
  return JSON.stringify({
    name: theme.name,
    referenceText: theme.referenceText,
    palette: theme.palette,
    colors: theme.colors,
    uiOptionId: theme.uiOptionId,
    nearestColorwayId: theme.nearestColorwayId,
  });
}
