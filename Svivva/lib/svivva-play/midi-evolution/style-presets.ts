import type { StylePresetId } from "./types";

export type StylePreset = {
  id: StylePresetId;
  label: string;
  description: string;
  chordPalette: string[];
  voicingStrategy: "rootless" | "drop2" | "drop2and4" | "quartal" | "quintal" | "polychord";
  bassStrategy: "root" | "melodic" | "chromatic_slip" | "pedal" | "minor_third_displace";
  voiceLeading: "minimal" | "connected_inner" | "wide";
  brightness: number;
  tension: number;
  keywords: string[];
};

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  glasper: {
    id: "glasper",
    label: "Robert Glasper",
    description: "Extended harmony, rootless voicings, modal ambiguity, minimal voice leading.",
    chordPalette: ["Cm11", "AbMaj9(#11)", "BbMaj13", "DbMaj9(#11)", "F13sus", "Gm11(add13)"],
    voicingStrategy: "rootless",
    bassStrategy: "melodic",
    voiceLeading: "connected_inner",
    brightness: 0.55,
    tension: 0.62,
    keywords: ["glasper", "neo soul", "jazz", "extended", "modal", "cinematic jazz"],
  },
  "derrick-hodge": {
    id: "derrick-hodge",
    label: "Derrick Hodge",
    description:
      "Melodic bass narrator — chromatic side slips, delayed resolutions, implied harmony.",
    chordPalette: ["Cm9", "Fm9", "Abmaj7", "Eb13", "G7alt", "Db6/9"],
    voicingStrategy: "drop2",
    bassStrategy: "chromatic_slip",
    voiceLeading: "minimal",
    brightness: 0.42,
    tension: 0.58,
    keywords: ["hodge", "bass", "melodic bass", "side slip", "darker"],
  },
  "stevie-wonder": {
    id: "stevie-wonder",
    label: "Stevie Wonder",
    description: "Soulful reharmonization with expressive note slides and legato overlap.",
    chordPalette: ["Fmaj9", "Dm9", "Bbmaj7", "C9sus", "Am7", "Ebmaj7(#11)"],
    voicingStrategy: "drop2and4",
    bassStrategy: "pedal",
    voiceLeading: "connected_inner",
    brightness: 0.72,
    tension: 0.48,
    keywords: ["stevie", "slide", "soul", "legato", "bright", "groove"],
  },
  "indian-fusion": {
    id: "indian-fusion",
    label: "Indian Fusion",
    description: "Meend ornamentation with jazz harmony and motif evolution.",
    chordPalette: ["D7(#11)", "Gmaj7#5", "Cm6/9", "F13", "Bbmaj7#11", "Em7b5"],
    voicingStrategy: "quartal",
    bassStrategy: "minor_third_displace",
    voiceLeading: "wide",
    brightness: 0.6,
    tension: 0.66,
    keywords: ["indian", "meend", "raga", "fusion", "ornament", "microtone"],
  },
  custom: {
    id: "custom",
    label: "Custom",
    description: "Prompt-driven blend — AI interprets intent without fixed palette lock.",
    chordPalette: ["Cm11", "AbMaj9", "Bb13", "DbMaj9(#11)", "F7alt"],
    voicingStrategy: "drop2",
    bassStrategy: "melodic",
    voiceLeading: "connected_inner",
    brightness: 0.5,
    tension: 0.5,
    keywords: [],
  },
};

const PROMPT_HINTS: { pattern: RegExp; preset: StylePresetId; delta: Partial<StylePreset> }[] = [
  {
    pattern: /\b(dark|darker|moody)\b/i,
    preset: "custom",
    delta: { brightness: 0.3, tension: 0.75 },
  },
  {
    pattern: /\b(bright|brighter|uplift)\b/i,
    preset: "custom",
    delta: { brightness: 0.85, tension: 0.35 },
  },
  { pattern: /\b(cinematic|film|score)\b/i, preset: "glasper", delta: { tension: 0.78 } },
  {
    pattern: /\b(fusion|jazz fusion)\b/i,
    preset: "glasper",
    delta: { voicingStrategy: "quartal" },
  },
  { pattern: /\b(neo\s*soul|neosoul)\b/i, preset: "glasper", delta: {} },
  { pattern: /\b(reharm|reharmon)\b/i, preset: "glasper", delta: { tension: 0.68 } },
  { pattern: /\b(continuation|next part|continue)\b/i, preset: "custom", delta: {} },
  { pattern: /\b(dramatic|evolution)\b/i, preset: "custom", delta: { tension: 0.8 } },
];

export function resolvePresetFromPrompt(prompt: string, selected: StylePresetId): StylePreset {
  const base = { ...STYLE_PRESETS[selected] };
  const text = prompt.toLowerCase();

  for (const [id, preset] of Object.entries(STYLE_PRESETS) as [StylePresetId, StylePreset][]) {
    if (id === "custom") continue;
    if (preset.keywords.some((k) => text.includes(k))) {
      Object.assign(base, preset, { id: selected === "custom" ? id : selected });
      break;
    }
  }

  for (const hint of PROMPT_HINTS) {
    if (hint.pattern.test(prompt)) Object.assign(base, hint.delta);
  }

  return base;
}

export function generationSuffix(preset: StylePresetId, generation: number): string {
  const letter = String.fromCharCode(65 + ((generation - 1) % 26));
  const tag =
    preset === "glasper"
      ? "Glasper"
      : preset === "derrick-hodge"
        ? "DerrickHodge"
        : preset === "stevie-wonder"
          ? "StevieWonder"
          : preset === "indian-fusion"
            ? "IndianFusion"
            : "Evolution";
  return `${tag}_${letter}`;
}
