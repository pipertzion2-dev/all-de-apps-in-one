import type { ChordSegment } from "./chord-from-chroma";
import { isMinorKeyLabel } from "./analysis-utils";
import { getProgressionLabels } from "./chord-engine";
import { chordSegmentPitchClasses } from "./scale-key-guard";

/** Diatonic Lins/Glasper-style progression from the user’s key — no Melodyne pitch/chord map. */
export function buildEnsembleChordTimeline(
  key: string,
  durationSec: number,
  bpm: number,
  seed: number,
): ChordSegment[] {
  if (bpm < 30 || durationSec <= 0) return [];

  const labels = getProgressionLabels(key, Math.abs(seed) % 5);
  if (!labels.length) return [];

  const barSec = (60 / bpm) * 4;
  const totalBars = Math.max(4, Math.ceil(durationSec / barSec));
  const barsPerChord = Math.max(2, Math.floor(totalBars / labels.length));
  const segments: ChordSegment[] = [];

  for (let i = 0; i < labels.length; i++) {
    const barStart = i * barsPerChord;
    if (barStart >= totalBars) break;
    const t0 = barStart * barSec;
    const t1 = Math.min(durationSec, (barStart + barsPerChord) * barSec);
    const symbol = labels[i]!;
    const base = { t0: Number(t0.toFixed(3)), t1: Number(t1.toFixed(3)), symbol, confidence: 88 };
    segments.push({
      ...base,
      pitchClasses: chordSegmentPitchClasses({ ...base, pitchClasses: [] }),
    });
  }

  if (segments.length === 0) {
    const rootLabel = isMinorKeyLabel(key) ? key.replace(/ minor/i, "m11") : "maj9";
    segments.push({
      t0: 0,
      t1: durationSec,
      symbol: rootLabel,
      confidence: 70,
      pitchClasses: [],
    });
  }

  return segments;
}
