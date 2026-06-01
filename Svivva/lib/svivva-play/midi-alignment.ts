import type { TranscribedNote } from "./audio-transcription";

/** Onset times (seconds) for alignment correlation. */
function noteOnsets(notes: TranscribedNote[]): number[] {
  return notes.map((n) => n.startSec);
}

function correlateOnsets(a: number[], b: number[], offsetSec: number): number {
  if (!a.length || !b.length) return 0;
  const tolerance = 0.06;
  let hits = 0;
  for (const t of a) {
    const target = t + offsetSec;
    if (b.some((u) => Math.abs(u - target) < tolerance)) hits++;
  }
  return hits / a.length;
}

/**
 * Find shift (seconds) that best lines up MIDI onsets with audio transcription.
 * Positive offset moves MIDI later relative to audio.
 */
export function alignMidiToAudio(
  audioNotes: TranscribedNote[],
  midiNotes: TranscribedNote[],
  maxShiftSec = 4,
  stepSec = 0.025,
): { offsetSec: number; score: number } {
  const audioOnsets = noteOnsets(audioNotes);
  const midiOnsets = noteOnsets(midiNotes);
  if (!audioOnsets.length || !midiOnsets.length) {
    return { offsetSec: 0, score: 0 };
  }

  let bestOffset = 0;
  let bestScore = -1;
  const steps = Math.round((maxShiftSec * 2) / stepSec);
  for (let i = -steps; i <= steps; i++) {
    const offset = i * stepSec;
    const score = correlateOnsets(midiOnsets, audioOnsets, offset);
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }
  return { offsetSec: Number(bestOffset.toFixed(3)), score: bestScore };
}

export function applyOffsetToNotes(notes: TranscribedNote[], offsetSec: number): TranscribedNote[] {
  return notes.map((n) => ({
    ...n,
    startSec: n.startSec + offsetSec,
    endSec: n.endSec + offsetSec,
  }));
}
