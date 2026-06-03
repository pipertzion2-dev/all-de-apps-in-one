import type { AudioAnalysisResult } from "./client-audio-analysis";
import { normalizeKeyLabel } from "./analysis-utils";
import type { HarmonicSession } from "./harmonic-session";
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
  transcription?: HarmonicSession | null,
): PlayAnalysisView {
  const durationSec = transcription?.durationSec ?? client.meta?.durationSec ?? 180;
  const minChordConf = transcription?.sources.melodyneMidi ? 35 : 40;
  const transcribedChords =
    transcription?.chords
      ?.filter((c) => c.confidence >= minChordConf)
      .map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: c.confidence,
      })) ?? [];

  const base: Analysis = {
    bpm: client.bpm,
    time_signature: "4/4",
    key: client.key,
    key_confidence: Math.max(25, client.keyConfidence),
    chords: transcribedChords,
    sections: [],
    downbeats: [],
    style_compatibility: [],
    timbre_descriptors: {},
  };
  const enriched = enrichAnalysisHeuristically(base, durationSec);
  if (transcribedChords.length >= 2) {
    enriched.chords = transcribedChords;
  }

  const sessionKey = transcription?.harmonicKey
    ? normalizeKeyLabel(transcription.harmonicKey)
    : null;
  const audioKey = normalizeKeyLabel(enriched.key);
  const midiConf = transcription?.harmonicKeyConfidence ?? 0;
  const useMidiKey = Boolean(
    transcription?.sources.melodyneMidi &&
    sessionKey &&
    transcription.harmonicKeySource === "midi" &&
    midiConf >= 65 &&
    (sessionKey === audioKey || midiConf >= enriched.key_confidence + 8),
  );

  const displayKey =
    useMidiKey && sessionKey
      ? sessionKey
      : transcription?.harmonicKeySource === "audio"
        ? audioKey
        : (sessionKey ?? audioKey);

  return {
    bpm: enriched.bpm,
    timeSignature: enriched.time_signature,
    key: displayKey,
    keyConfidence: useMidiKey
      ? Math.min(92, midiConf)
      : transcription?.harmonicKeySource === "audio"
        ? Math.max(enriched.key_confidence, midiConf)
        : transcription?.sources.melodyneMidi && sessionKey
          ? Math.max(enriched.key_confidence, midiConf)
          : enriched.key_confidence,
    chords: enriched.chords,
    sections: enriched.sections,
    downbeats: enriched.downbeats,
    styleCompatibility: enriched.style_compatibility,
    timbreDescriptors: enriched.timbre_descriptors,
  };
}
