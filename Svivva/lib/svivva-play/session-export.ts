import type { HarmonicSession } from "./harmonic-session";
import type { PlayAnalysisView } from "./instant-analysis";

/** Client-side session package for generate/export when cloud DB session is unavailable. */
export function buildClientSessionExport(options: {
  mode: string;
  audioName?: string;
  analysis: PlayAnalysisView;
  transcription: HarmonicSession | null;
  stems?: unknown[];
}): Record<string, unknown> {
  const { mode, audioName, analysis, transcription, stems = [] } = options;
  return {
    svivva_play_version: "2.1",
    exported_at: new Date().toISOString(),
    source_audio: {
      name: audioName ?? "import",
      duration_s: transcription?.durationSec ?? null,
    },
    analysis: {
      bpm: analysis.bpm,
      time_signature: analysis.timeSignature,
      key: transcription?.harmonicKey ?? analysis.key,
      key_confidence: transcription?.harmonicKeyConfidence ?? analysis.keyConfidence,
      key_source: transcription?.harmonicKeySource ?? "audio",
      chords: transcription?.chords?.length ? transcription.chords : analysis.chords,
      sections: analysis.sections,
      downbeats: analysis.downbeats,
      style_compatibility: analysis.styleCompatibility,
    },
    harmonic_session: transcription
      ? {
          melodyne_note_count: transcription.melodyneNotes.length,
          audio_note_count: transcription.audioNotes.length,
          align_offset_sec: transcription.alignOffsetSec,
          align_score: transcription.alignScore,
          sources: transcription.sources,
        }
      : null,
    mode,
    stems,
    quality_note:
      "Use this JSON with Svivva Play generate, or re-import audio + Melodyne .mid for the same harmonic model.",
  };
}
