import type { ChordSegment } from "./chord-from-chroma";
import { detectChordAtTime, detectChordRootAgnostic } from "./chord-from-chroma";
import type { TranscribedNote } from "./audio-transcription";

/** Bar chords without key bias — used before tonic is known. */
export function chordsFromPolyphonicNotesAgnostic(
  notes: TranscribedNote[],
  bpm: number,
  durationSec: number,
  minConfidence = 62,
): ChordSegment[] {
  if (!notes.length || bpm < 30) return [];

  const barSec = (60 / bpm) * 4;
  const bars = Math.max(1, Math.ceil(durationSec / barSec));
  const segments: ChordSegment[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * barSec;
    const t1 = Math.min(durationSec, (bar + 1) * barSec);

    const active = notes.filter((n) => n.startSec < t1 && n.endSec > t0);
    if (!active.length) continue;

    const chroma = new Float64Array(12);
    for (const n of active) {
      const weight = Math.min(1, (n.endSec - n.startSec) / barSec) * (n.velocity / 127);
      chroma[n.midi % 12] += 0.35 + weight;
    }
    const max = Math.max(...Array.from(chroma));
    if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;

    const det = detectChordRootAgnostic(chroma);
    const confidence = Math.min(95, Math.max(minConfidence, Math.round(det.score * 28 + 40)));

    const prev = segments[segments.length - 1];
    if (prev && prev.symbol === det.symbol) {
      prev.t1 = t1;
      prev.confidence = Math.round((prev.confidence + confidence) / 2);
    } else {
      segments.push({
        t0: Number(t0.toFixed(3)),
        t1: Number(t1.toFixed(3)),
        symbol: det.symbol,
        confidence,
        pitchClasses: [],
      });
    }
  }

  return segments;
}

/** Infer bar-aligned chords from polyphonic note data (e.g. Melodyne harmonic export). */
export function chordsFromPolyphonicNotes(
  notes: TranscribedNote[],
  bpm: number,
  durationSec: number,
  key: string,
  minConfidence = 62,
): ChordSegment[] {
  if (!notes.length || bpm < 30) return [];

  const barSec = (60 / bpm) * 4;
  const bars = Math.max(1, Math.ceil(durationSec / barSec));
  const segments: ChordSegment[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * barSec;
    const t1 = Math.min(durationSec, (bar + 1) * barSec);
    const mid = (t0 + t1) / 2;

    const active = notes.filter((n) => n.startSec < t1 && n.endSec > t0);
    if (!active.length) continue;

    const chroma = new Float64Array(12);
    for (const n of active) {
      const weight = Math.min(1, (n.endSec - n.startSec) / barSec) * (n.velocity / 127);
      chroma[n.midi % 12] += 0.35 + weight;
    }
    const max = Math.max(...Array.from(chroma));
    if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;

    const det = detectChordAtTime(chroma, key);
    const confidence = Math.min(95, Math.max(minConfidence, det.confidence + 12));

    const prev = segments[segments.length - 1];
    if (prev && prev.symbol === det.symbol) {
      prev.t1 = t1;
      prev.confidence = Math.round((prev.confidence + confidence) / 2);
    } else {
      segments.push({
        t0: Number(t0.toFixed(3)),
        t1: Number(t1.toFixed(3)),
        symbol: det.symbol,
        confidence,
        pitchClasses: det.pitchClasses,
      });
    }
  }

  return segments;
}

export function mergeChordTimelines(
  melodyneChords: ChordSegment[],
  audioChords: ChordSegment[],
): ChordSegment[] {
  if (melodyneChords.length >= 2) return melodyneChords;
  if (!melodyneChords.length) return audioChords;
  if (!audioChords.length) return melodyneChords;

  const barSec =
    audioChords.length > 1
      ? audioChords[1].t0 - audioChords[0].t0
      : melodyneChords[1].t0 - melodyneChords[0].t0;

  const durationSec = Math.max(
    melodyneChords[melodyneChords.length - 1]?.t1 ?? 0,
    audioChords[audioChords.length - 1]?.t1 ?? 0,
  );
  const bars = Math.max(1, Math.ceil(durationSec / Math.max(barSec, 0.25)));
  const out: ChordSegment[] = [];

  for (let i = 0; i < bars; i++) {
    const t0 = i * barSec;
    const t1 = Math.min(durationSec, (i + 1) * barSec);
    const m = melodyneChords.find((c) => c.t0 <= t0 + 0.01 && c.t1 > t0);
    const a = audioChords.find((c) => c.t0 <= t0 + 0.01 && c.t1 > t0);
    const pick = m && (!a || (m.confidence ?? 0) >= (a.confidence ?? 0) - 5) ? m : (a ?? m);
    if (!pick) continue;
    const prev = out[out.length - 1];
    if (prev && prev.symbol === pick.symbol) {
      prev.t1 = t1;
    } else {
      out.push({
        t0: Number(t0.toFixed(3)),
        t1: Number(t1.toFixed(3)),
        symbol: pick.symbol,
        confidence: pick.confidence,
        pitchClasses: pick.pitchClasses,
      });
    }
  }
  return out;
}
