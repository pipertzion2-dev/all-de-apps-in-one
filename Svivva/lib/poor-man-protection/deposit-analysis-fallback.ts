import type { ColorSwatch } from "./types";
import type { DepositAnalysis } from "./deposit-analysis";

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Deposited creative work";
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 200);
}

function hueIntent(palette: ColorSwatch[]): string {
  const hex = palette[0]?.hex;
  if (!hex) return "Palette derived from the deposited sheet";
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (r > g + 30 && r > b + 20) return "Warm, assertive spectral intent (red-gold dominance)";
  if (b > r + 20 && b > g) return "Cool, receding spectral intent (blue dominance)";
  if (g > r + 15 && g > b) return "Restorative spectral intent (green dominance)";
  if (r + g + b > 600) return "High-key, airy spectral intent";
  if (r + g + b < 120) return "Low-key, shadowed spectral intent";
  return "Balanced mid-key spectral intent locked from extracted palette";
}

function contrastFromPalette(palette: ColorSwatch[]): string {
  if (palette.length < 2) {
    return "Single-dominant palette; contrast claimed through form and tonal edges";
  }
  return `Perceptual contrast between dominant ${palette[0]?.hex} and secondary ${palette[1]?.hex}`;
}

/**
 * Heuristic deposit analysis when vision AI is unavailable (guest, quota, no keys).
 * Uses filename + extracted palette — same signals as group-patent auto-organize.
 */
export function buildDepositAnalysisFallback(
  fileName: string,
  palette: ColorSwatch[],
  notes = "",
): DepositAnalysis {
  const title = titleFromFileName(fileName);
  const paletteLine =
    palette.length > 0
      ? palette.map((p) => `${p.role}=${p.hex}`).join(", ")
      : "palette pending";
  const noteLine = notes.trim() ? ` Creator notes: ${notes.trim()}` : "";

  return {
    title,
    description:
      `Evidentiary deposit of "${title}" — a creative work captured as ${fileName.replace(/^.*[/\\]/, "")}. ` +
      `Spectral fingerprint: ${paletteLine}.${noteLine} ` +
      `This description was auto-generated from the image hash and palette; refine before sealing if needed.`,
    chronology: {
      medium: "Digital sketch / raster deposit",
      iterationNotes:
        notes.trim() ||
        `Single-sheet deposit of ${fileName.replace(/^.*[/\\]/, "")}. Form and palette interrogation inferred from visual fingerprint.`,
      priorDisclosure: "none identified from deposit metadata",
    },
    formInterrogation: {
      silhouette: `Primary silhouette and shape language read from ${title}. Lead composition locked in the deposited sheet.`,
      hierarchy:
        "Visual hierarchy: primary subject → supporting elements → background/negative space as read from the deposit.",
      negativeSpace: "Negative space participates as framing around the primary subject in the deposited composition.",
      distinctiveMarks: `Copyist would need to recreate the exact deposited sheet (SHA-256 addressed) including proportions and marks visible in ${fileName.replace(/^.*[/\\]/, "")}.`,
    },
    paletteInterrogation: {
      emotionalIntent: hueIntent(palette),
      contrastStrategy: contrastFromPalette(palette),
      forbiddenColors:
        "Colors absent from the extracted palette fingerprint are treated as deliberately unused.",
      lightingContext: "Studio / screen viewing of deposited raster sheet; claims are compositional.",
    },
    suggestedHybridMode: "emergent",
  };
}
