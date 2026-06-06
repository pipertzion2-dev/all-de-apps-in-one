import { normalizeKeyLabel } from "./analysis-utils";
import { buildInstantPlayAnalysis, type PlayAnalysisView } from "./instant-analysis";
import { buildHarmonicSession, type HarmonicSession } from "./harmonic-session";
import { parseMidiFile } from "./midi-file-parse";
import {
  formatMegabytes,
  getMaxLocalFileBytes,
  isLocalFileTooLarge,
} from "./upload-limits";
import { isWavFile } from "./wav-utils";

export interface ImportAnalysisResult {
  analysis: PlayAnalysisView | null;
  sessionId: string | null;
  transcription?: HarmonicSession | null;
  error?: string;
  warning?: string;
}

async function bpmFromMelodyneFile(file: File): Promise<number | null> {
  try {
    const buf = await file.arrayBuffer();
    const parsed = parseMidiFile(buf);
    if (parsed.bpm >= 40 && parsed.bpm <= 220) return parsed.bpm;
  } catch {
    /* optional */
  }
  return null;
}

/** Import audio for playback + Melodyne sync only (no tempo/key DSP or cloud LLM). */
export async function runImportAnalysis(options: {
  file: File;
  melodyneFile?: File | null;
  bpm: number;
  key: string;
  userHint?: string;
  onInstantResult?: (analysis: PlayAnalysisView) => void;
  onTranscription?: (session: HarmonicSession) => void;
}): Promise<ImportAnalysisResult> {
  const { file, melodyneFile, userHint, onInstantResult, onTranscription } = options;

  if (isLocalFileTooLarge(file)) {
    const maxMb = formatMegabytes(getMaxLocalFileBytes(file));
    return {
      analysis: null,
      sessionId: null,
      error: `File is too large for browser import (max ${maxMb} for ${isWavFile(file) ? "WAV" : "this format"}).`,
    };
  }

  let bpm = options.bpm;
  if (melodyneFile) {
    const midiBpm = await bpmFromMelodyneFile(melodyneFile);
    if (midiBpm) bpm = midiBpm;
  }

  const key = normalizeKeyLabel(options.key);
  const clientStub = {
    bpm,
    key,
    keyConfidence: melodyneFile ? 78 : 45,
    bpmConfidence: melodyneFile ? 75 : 45,
  };

  onInstantResult?.(buildInstantPlayAnalysis(clientStub));

  let transcription: HarmonicSession | null = null;
  try {
    transcription = await buildHarmonicSession({
      audioFile: file,
      melodyneFile: melodyneFile ?? null,
      bpm,
      key,
      keyConfidence: clientStub.keyConfidence,
      keyHint: userHint,
      skipAudioPitchTrack: true,
    });
    if (transcription) {
      onTranscription?.(transcription);
      onInstantResult?.(buildInstantPlayAnalysis(clientStub, transcription));
    }
  } catch (err) {
    console.warn("Svivva Play Melodyne sync failed:", err);
  }

  const warning = melodyneFile
    ? "Melodyne synced to audio timeline. Tempo from MIDI export; adjust BPM/key manually if needed."
    : "Import ready — set tempo and key manually (auto audio analysis disabled).";

  return {
    analysis: buildInstantPlayAnalysis(clientStub, transcription),
    sessionId: null,
    transcription,
    warning: transcription ? warning : `${warning} Could not read audio file.`,
  };
}
