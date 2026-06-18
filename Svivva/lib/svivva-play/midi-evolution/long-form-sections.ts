import type { MeendLevel, StylePresetId } from "./types";
import type { StylePreset } from "./style-presets";

export type LongFormSectionId = "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type MotifTransformMode =
  | "inherit"
  | "invert"
  | "mirror"
  | "fragment"
  | "expand"
  | "compress"
  | "layer_all";

export type LongFormSectionSpec = {
  id: LongFormSectionId;
  title: string;
  emotion: string;
  narrative: string;
  preset: StylePresetId;
  chordPalette: string[];
  voicingStrategy: StylePreset["voicingStrategy"];
  bassStrategy: StylePreset["bassStrategy"];
  motifTransform: MotifTransformMode;
  rhythmicPreserve: number;
  meendLevel: MeendLevel;
  stevieSlides: boolean;
  bassAvoidsRoots: boolean;
  interweaveMotifs: boolean;
  prompt: string;
};

/** Sections B–J from the long-form narrative arc (A = uploaded source). */
export const LONG_FORM_SECTIONS: Record<LongFormSectionId, LongFormSectionSpec> = {
  B: {
    id: "B",
    title: "Shadow Portal",
    emotion: "First major departure",
    narrative: "Emotional portal — distant harmony, bass avoids roots.",
    preset: "glasper",
    chordPalette: ["EbmMaj9", "BMaj9(#11)", "Db13sus", "F#m11", "AbMaj9(#11)"],
    voicingStrategy: "rootless",
    bassStrategy: "chromatic_slip",
    motifTransform: "inherit",
    rhythmicPreserve: 0.85,
    meendLevel: "light",
    stevieSlides: false,
    bassAvoidsRoots: true,
    interweaveMotifs: true,
    prompt:
      "Section B Shadow Portal — first major departure. EbmMaj9, BMaj9(#11), Db13sus, F#m11, AbMaj9(#11). Bass avoids roots. Preserve rhythmic DNA, transform harmonic identity emotionally.",
  },
  C: {
    id: "C",
    title: "Fractured Mirror",
    emotion: "Inversion & reflection",
    narrative: "Mirror interval structures while keeping groove placement.",
    preset: "custom",
    chordPalette: ["Cm11", "F#m11", "AbMaj9(#11)", "Eb13sus", "Bmaj9(#11)"],
    voicingStrategy: "drop2",
    bassStrategy: "melodic",
    motifTransform: "mirror",
    rhythmicPreserve: 0.9,
    meendLevel: "off",
    stevieSlides: false,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section C Fractured Mirror — invert motifs, mirror interval structures, maintain rhythmic identity and phrase lengths.",
  },
  D: {
    id: "D",
    title: "Floating City",
    emotion: "Suspended openness",
    narrative: "Quartal stacks, open voicings, suspended colors.",
    preset: "glasper",
    chordPalette: ["DbMaj9(#11)", "GbMaj13", "Bbm11", "Eb13sus", "AbMaj9(#11)"],
    voicingStrategy: "quartal",
    bassStrategy: "pedal",
    motifTransform: "expand",
    rhythmicPreserve: 0.8,
    meendLevel: "light",
    stevieSlides: false,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section D Floating City — quartal harmony, stacked fourths, open voicings, suspended colors. Replace triadic thinking.",
  },
  E: {
    id: "E",
    title: "Abyss",
    emotion: "Darkest harmonic point",
    narrative: "Minor-major sonorities, altered tensions.",
    preset: "glasper",
    chordPalette: ["CmMaj9", "F13(b9)", "Ab7(#11)", "DbmMaj9", "B13(b9)"],
    voicingStrategy: "drop2and4",
    bassStrategy: "minor_third_displace",
    motifTransform: "compress",
    rhythmicPreserve: 0.75,
    meendLevel: "off",
    stevieSlides: false,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section E Abyss — darkest point. mMaj9, 13(b9), #11, altered suspensions. Convert major sonorities to minor-major.",
  },
  F: {
    id: "F",
    title: "Indian Horizon",
    emotion: "Ornamented ascent",
    narrative: "Meend, murki, grace notes, ornamental resolutions.",
    preset: "indian-fusion",
    chordPalette: ["D7(#11)", "Gmaj7#5", "Cm6/9", "F13", "Bbmaj7#11"],
    voicingStrategy: "quartal",
    bassStrategy: "minor_third_displace",
    motifTransform: "fragment",
    rhythmicPreserve: 0.85,
    meendLevel: "heavy",
    stevieSlides: false,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section F Indian Horizon — meend, murki, andolan, kan swar. Grace notes, neighbor clusters, ornamental resolutions.",
  },
  G: {
    id: "G",
    title: "Glasper Dimension",
    emotion: "Extended jazz depth",
    narrative: "9/11/13 extensions, rootless drop-2 voicings.",
    preset: "glasper",
    chordPalette: ["Cm11(add13)", "AbMaj9(#11)", "BbMaj13", "DbMaj9(#11)", "F13sus"],
    voicingStrategy: "rootless",
    bassStrategy: "melodic",
    motifTransform: "inherit",
    rhythmicPreserve: 0.82,
    meendLevel: "medium",
    stevieSlides: false,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section G Glasper Dimension — every chord contains 9, 11, 13. Rootless voicings, upper structures, drop-2, drop-2&4.",
  },
  H: {
    id: "H",
    title: "Derrick Hodge Dimension",
    emotion: "Melodic bass narrator",
    narrative: "Stable upper harmony, chromatic bass side-slips.",
    preset: "derrick-hodge",
    chordPalette: ["Cm9", "Fm9", "Abmaj7", "Eb13", "G7alt"],
    voicingStrategy: "drop2",
    bassStrategy: "chromatic_slip",
    motifTransform: "inherit",
    rhythmicPreserve: 0.88,
    meendLevel: "light",
    stevieSlides: false,
    bassAvoidsRoots: true,
    interweaveMotifs: true,
    prompt:
      "Section H Derrick Hodge — bass as melodic narrator. Minor-third displacement, chromatic side slipping, pedal motion.",
  },
  I: {
    id: "I",
    title: "Cosmic Tension",
    emotion: "Maximum density",
    narrative: "Layer original, inverted, fragmented, extended motifs simultaneously.",
    preset: "glasper",
    chordPalette: ["AbMaj9(#11)/E", "DbMaj9(#11)/A", "BbMaj13/Gb", "Cm11(add13)/F", "BMaj9(#11)/F"],
    voicingStrategy: "polychord",
    bassStrategy: "chromatic_slip",
    motifTransform: "layer_all",
    rhythmicPreserve: 0.78,
    meendLevel: "medium",
    stevieSlides: true,
    bassAvoidsRoots: true,
    interweaveMotifs: true,
    prompt:
      "Section I Cosmic Tension — maximum harmonic density. Every motif exists as original, inverted, fragmented, extended, hidden.",
  },
  J: {
    id: "J",
    title: "Revelation",
    emotion: "Motif resolution",
    narrative: "Resolve narrative relationships — the journey, not the chords.",
    preset: "custom",
    chordPalette: ["EbMaj13", "AbMaj9(#11)", "DbMaj9(#11)", "F#m11", "Bmaj9(#11)"],
    voicingStrategy: "drop2and4",
    bassStrategy: "melodic",
    motifTransform: "inherit",
    rhythmicPreserve: 0.9,
    meendLevel: "medium",
    stevieSlides: true,
    bassAvoidsRoots: false,
    interweaveMotifs: true,
    prompt:
      "Section J Revelation — resolve motif relationships, not harmonic clichés. Do not return to original harmony. Listener recognizes the journey.",
  },
};

export const LONG_FORM_SECTION_ORDER: LongFormSectionId[] = [
  "B", "C", "D", "E", "F", "G", "H", "I", "J",
];

export function sectionSpecToTransformOptions(spec: LongFormSectionSpec): {
  prompt: string;
  preset: StylePresetId;
  stevieSlides: boolean;
  meendLevel: MeendLevel;
  preserveRhythm: boolean;
  preservePhraseLength: boolean;
  preservePhraseExactly: boolean;
  sectionId: LongFormSectionId;
  rhythmicPreserve: number;
  motifTransform: MotifTransformMode;
  bassAvoidsRoots: boolean;
  interweaveMotifs: boolean;
  chordPalette: string[];
  voicingStrategy: StylePreset["voicingStrategy"];
  bassStrategy: StylePreset["bassStrategy"];
} {
  return {
    prompt: spec.prompt,
    preset: spec.preset,
    stevieSlides: spec.stevieSlides,
    meendLevel: spec.meendLevel,
    preserveRhythm: true,
    preservePhraseLength: true,
    preservePhraseExactly: true,
    sectionId: spec.id,
    rhythmicPreserve: spec.rhythmicPreserve,
    motifTransform: spec.motifTransform,
    bassAvoidsRoots: spec.bassAvoidsRoots,
    interweaveMotifs: spec.interweaveMotifs,
    chordPalette: spec.chordPalette,
    voicingStrategy: spec.voicingStrategy,
    bassStrategy: spec.bassStrategy,
  };
}

export function nextSuggestedSection(completed: LongFormSectionId[]): LongFormSectionId | null {
  for (const id of LONG_FORM_SECTION_ORDER) {
    if (!completed.includes(id)) return id;
  }
  return null;
}
