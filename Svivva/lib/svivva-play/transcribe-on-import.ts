import type { AudioTranscription } from "./audio-transcription";
import { transcribeAudioFile } from "./audio-transcription";
import { alignMidiToAudio, applyOffsetToNotes, normalizeMidiToBarOne } from "./midi-alignment";
import { parseMidiFile } from "./midi-file-parse";
import type { TranscribedNote } from "./audio-transcription";
import { mergeTranscriptionWithMidi } from "./audio-transcription";

export type PlayTranscriptionState = {
  audio: AudioTranscription;
  midiNotes: TranscribedNote[];
  midiRawNotes: TranscribedNote[];
  alignOffsetSec: number;
  alignScore: number;
};

export async function transcribeImportAudio(
  file: File,
  bpm: number,
  key: string,
): Promise<AudioTranscription | null> {
  return transcribeAudioFile(file, bpm, key);
}

export async function loadAndAlignMidi(
  file: File,
  audioTranscription: AudioTranscription,
  bpm = 120,
): Promise<PlayTranscriptionState | null> {
  try {
    const buf = await file.arrayBuffer();
    const parsed = parseMidiFile(buf);
    const tempo = bpm > 0 ? bpm : parsed.bpm;
    let raw = parsed.notes;
    if (tempo > 0) raw = normalizeMidiToBarOne(raw, tempo).notes;
    const { offsetSec, score } = alignMidiToAudio(audioTranscription.notes, raw, { bpm: tempo });
    const aligned = applyOffsetToNotes(raw, offsetSec);
    const merged = mergeTranscriptionWithMidi(audioTranscription, aligned, 0);
    return {
      audio: merged,
      midiNotes: aligned,
      midiRawNotes: raw,
      alignOffsetSec: offsetSec,
      alignScore: score,
    };
  } catch {
    return null;
  }
}

export function chordsFromTranscription(
  transcription: AudioTranscription,
): { t0: number; t1: number; symbol: string; confidence?: number }[] {
  return transcription.chords.map((c) => ({
    t0: c.t0,
    t1: c.t1,
    symbol: c.symbol,
    confidence: c.confidence,
  }));
}
