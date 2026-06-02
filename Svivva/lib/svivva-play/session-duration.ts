import type { TranscribedNote } from "./audio-transcription";

/** Round duration up to full bars so loops and Reich grids stay in time. */
export function barAlignedDurationSec(durationSec: number, bpm: number, beatsPerBar = 4): number {
  if (durationSec <= 0 || bpm <= 0) return Math.max(0, durationSec);
  const barSec = (60 / bpm) * beatsPerBar;
  const bars = Math.max(1, Math.ceil(durationSec / barSec));
  return bars * barSec;
}

/** Round duration down to full bars without exceeding the underlying audio. */
export function barAlignedDurationAtMostSec(
  durationSec: number,
  bpm: number,
  beatsPerBar = 4,
): number {
  if (durationSec <= 0 || bpm <= 0) return Math.max(0, durationSec);
  const barSec = (60 / bpm) * beatsPerBar;
  if (durationSec <= barSec) return durationSec;
  const bars = Math.max(1, Math.floor((durationSec - 0.001) / barSec));
  return Math.min(durationSec, bars * barSec);
}

export function trimNotesToDuration<T extends { startSec: number; endSec: number }>(
  notes: T[],
  maxSec: number,
): T[] {
  if (maxSec <= 0) return [];
  return notes
    .filter((n) => n.startSec < maxSec - 0.001)
    .map((n) => (n.endSec > maxSec ? { ...n, endSec: maxSec } : n));
}

/** Audio file length is master; trim Melodyne when it runs past the sample. */
export function fitMelodyneToAudioDuration(
  audioDurationSec: number,
  melodyneNotes: TranscribedNote[],
  melodyneRaw: TranscribedNote[],
  bpm: number,
): {
  melodyneNotes: TranscribedNote[];
  melodyneRaw: TranscribedNote[];
  durationSec: number;
} {
  if (audioDurationSec <= 0) {
    const midiEnd = melodyneNotes.reduce((m, n) => Math.max(m, n.endSec), 0);
    const durationSec = barAlignedDurationSec(midiEnd, bpm);
    return { melodyneNotes, melodyneRaw, durationSec };
  }

  const durationSec = barAlignedDurationAtMostSec(audioDurationSec, bpm);
  return {
    melodyneNotes: trimNotesToDuration(melodyneNotes, durationSec),
    melodyneRaw: trimNotesToDuration(melodyneRaw, durationSec),
    durationSec,
  };
}
