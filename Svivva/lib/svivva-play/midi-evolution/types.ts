import type { NormalizedMidiEvent } from "../midi-normalize";

export type StylePresetId =
  | "glasper"
  | "derrick-hodge"
  | "stevie-wonder"
  | "indian-fusion"
  | "custom";

export type MeendLevel = "off" | "light" | "medium" | "heavy";

export type MotifKind = "primary" | "secondary" | "transition" | "hidden";

export type MotifRecord = {
  id: string;
  kind: MotifKind;
  sourceFileIds: string[];
  intervalPattern: number[];
  rhythmPattern: number[];
  register: "low" | "mid" | "high";
  occurrences: number;
  parentId?: string;
  childIds: string[];
};

export type PhraseRecord = {
  id: string;
  sourceFileId: string;
  startBeat: number;
  endBeat: number;
  motifIds: string[];
  tension: number;
  release: number;
  registerMean: number;
};

export type BassPatternRecord = {
  id: string;
  sourceFileId: string;
  intervals: number[];
  pedalTone?: number;
  register: number;
};

export type HarmonicCenter = {
  beat: number;
  symbol: string;
  pitchClasses: number[];
  confidence: number;
};

export type ImportedMidiTrack = {
  id: string;
  filename: string;
  bpm: number;
  durationSec: number;
  events: NormalizedMidiEvent[];
  role: "bass" | "harmony" | "melody" | "mixed";
};

export type CompositionMemory = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  sourceFiles: { id: string; filename: string; bpm: number; durationSec: number }[];
  globalBpm: number;
  detectedBpm?: number;
  manualBpm?: number;
  key: string;
  motifs: MotifRecord[];
  rhythms: { id: string; pattern: number[]; motifId?: string }[];
  harmonicCenters: HarmonicCenter[];
  bassPatterns: BassPatternRecord[];
  phraseRelationships: { fromPhraseId: string; toPhraseId: string; relation: string }[];
  motifGenealogy: { parentId: string; childId: string }[];
  emotionalTrajectory: string[];
  sectionHierarchy: { id: string; label: string; startBeat: number; endBeat: number }[];
  generationCount: number;
  lastPrompt?: string;
  lastPreset?: StylePresetId;
  completedSections?: import("./long-form-sections").LongFormSectionId[];
};

export type TransformOptions = {
  prompt: string;
  preset: StylePresetId;
  stevieSlides?: boolean;
  meendLevel?: MeendLevel;
  preserveRhythm?: boolean;
  preservePhraseLength?: boolean;
  /** When true (default), velocity + timing never change — only pitch (+ optional bends). */
  preservePhraseExactly?: boolean;
  /** Long-form section generation */
  sectionId?: import("./long-form-sections").LongFormSectionId;
  rhythmicPreserve?: number;
  motifTransform?: import("./long-form-sections").MotifTransformMode;
  bassAvoidsRoots?: boolean;
  interweaveMotifs?: boolean;
  chordPalette?: string[];
  voicingStrategy?: import("./style-presets").StylePreset["voicingStrategy"];
  bassStrategy?: import("./style-presets").StylePreset["bassStrategy"];
};

export type PerFileMidiOutput = {
  sourceFileId: string;
  sourceFilename: string;
  bpm: number;
  originalEvents: NormalizedMidiEvent[];
  transformedEvents: NormalizedMidiEvent[];
  exportFilename: string;
  pitchBends?: { beat: number; value: number }[];
};

export type GeneratedPart = {
  id: string;
  label: string;
  generationNumber: number;
  preset: StylePresetId;
  prompt: string;
  events: NormalizedMidiEvent[];
  bassEvents: NormalizedMidiEvent[];
  harmonyEvents: NormalizedMidiEvent[];
  melodyEvents: NormalizedMidiEvent[];
  originalEvents?: NormalizedMidiEvent[];
  pitchBends?: { beat: number; value: number }[];
  filename: string;
  sectionId?: import("./long-form-sections").LongFormSectionId;
  sectionTitle?: string;
  /** One evolved MIDI per uploaded source file (for clean export). */
  fileOutputs?: PerFileMidiOutput[];
};

export type TransformationReport = {
  generatedAt: string;
  prompt: string;
  preset: StylePresetId;
  generationNumber: number;
  originalHarmonicCenters: string[];
  newHarmonicCenters: string[];
  motifsTransformed: string[];
  voiceLeadingStrategy: string;
  bassStrategy: string;
  ornamentationApplied: string[];
  sectionId?: string;
  sectionTitle?: string;
  rhythmicPreserve?: number;
  motifTransform?: string;
  intentSummary?: string;
  aiProvider?: string;
  aiModel?: string;
  exportedFiles?: { source: string; export: string; noteCount: number; bpm: number }[];
};

export type EvolutionExportPack = {
  memory: CompositionMemory;
  report: TransformationReport;
  midiFiles: { filename: string; data: Uint8Array }[];
};
