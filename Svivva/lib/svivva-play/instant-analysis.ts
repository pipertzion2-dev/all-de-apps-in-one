import type { AudioAnalysisResult } from "./client-audio-analysis";
import { enrichAnalysisHeuristically } from "./heuristic-analysis";
import type { Analysis } from "./schemas";

export interface PlayAnalysisView {
  bpm: number;
  timeSignature: string;
  key: string;
  keyConfidence: number;
  chords: { t0: number; t1: number; symbol: string; roman?: string; confidence?: number }[];
  sections: { name: string; t0: number; t1: number; bars?: number }[];
  downbeats: number[];
  styleCompatibility: string[];
  timbreDescriptors?: Record<string, unknown>;
}

export function buildInstantPlayAnalysis(
  client: Pick<AudioAnalysisResult, "bpm" | "key" | "keyConfidence" | "bpmConfidence"> & {
    meta?: AudioAnalysisResult["meta"];
  },
): PlayAnalysisView {
  const durationSec = client.meta?.durationSec ?? 180;
  const base: Analysis = {
    bpm: client.bpm,
    time_signature: "4/4",
    key: client.key,
    key_confidence: Math.max(25, client.keyConfidence),
    chords: [],
    sections: [],
    downbeats: [],
    style_compatibility: [],
    timbre_descriptors: {},
  };
  const enriched = enrichAnalysisHeuristically(base, durationSec);
  return {
    bpm: enriched.bpm,
    timeSignature: enriched.time_signature,
    key: enriched.key,
    keyConfidence: enriched.key_confidence,
    chords: enriched.chords,
    sections: enriched.sections,
    downbeats: enriched.downbeats,
    styleCompatibility: enriched.style_compatibility,
    timbreDescriptors: enriched.timbre_descriptors,
  };
}
