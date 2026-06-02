import type { TranscribedNote } from "./audio-transcription";

export function barDurationSec(bpm: number, beatsPerBar = 4): number {
  return (60 / bpm) * beatsPerBar;
}

/** First meaningful note onset — ignores tiny blips. */
export function firstMusicalOnset(notes: TranscribedNote[], minDurSec = 0.04): number {
  if (!notes.length) return 0;
  let earliest = Infinity;
  for (const n of notes) {
    if (n.endSec - n.startSec < minDurSec) continue;
    if (n.velocity > 0 && n.startSec < earliest) earliest = n.startSec;
  }
  return Number.isFinite(earliest) ? earliest : notes[0]!.startSec;
}

/** Merge onsets within a short window (polyphonic MIDI → one onset per attack). */
export function mergeOnsets(times: number[], mergeSec = 0.045): number[] {
  const sorted = [...times].sort((a, b) => a - b);
  const out: number[] = [];
  for (const t of sorted) {
    if (!out.length || t - out[out.length - 1]! > mergeSec) out.push(t);
  }
  return out;
}

function noteOnsets(notes: TranscribedNote[]): number[] {
  return mergeOnsets(notes.map((n) => n.startSec));
}

function correlateOnsets(midiOnsets: number[], audioOnsets: number[], offsetSec: number): number {
  if (!midiOnsets.length || !audioOnsets.length) return 0;
  const tolerance = 0.07;
  let hits = 0;
  for (const t of midiOnsets) {
    const target = t + offsetSec;
    if (audioOnsets.some((u) => Math.abs(u - target) < tolerance)) hits++;
  }
  return hits / midiOnsets.length;
}

/** Density cross-correlation — more robust when MIDI is polyphonic vs mono audio. */
function correlateOnsetDensity(
  midiOnsets: number[],
  audioOnsets: number[],
  offsetSec: number,
  binSec = 0.05,
  windowSec = 0.12,
): number {
  if (!midiOnsets.length || !audioOnsets.length) return 0;
  const maxT = Math.max(...midiOnsets.map((t) => t + offsetSec), ...audioOnsets, 1);
  const bins = Math.ceil(maxT / binSec) + 1;
  const midiHist = new Float64Array(bins);
  const audioHist = new Float64Array(bins);
  for (const t of midiOnsets) {
    const i = Math.round((t + offsetSec) / binSec);
    if (i >= 0 && i < bins) midiHist[i]! += 1;
  }
  for (const t of audioOnsets) {
    const i = Math.round(t / binSec);
    if (i >= 0 && i < bins) audioHist[i]! += 1;
  }
  const radius = Math.max(1, Math.round(windowSec / binSec));
  let dot = 0;
  let midiNorm = 0;
  let audioNorm = 0;
  for (let i = 0; i < bins; i++) {
    let midiSum = 0;
    let audioSum = 0;
    for (let d = -radius; d <= radius; d++) {
      const j = i + d;
      if (j >= 0 && j < bins) {
        midiSum += midiHist[j]!;
        audioSum += audioHist[j]!;
      }
    }
    dot += midiSum * audioSum;
    midiNorm += midiSum * midiSum;
    audioNorm += audioSum * audioSum;
  }
  if (midiNorm <= 0 || audioNorm <= 0) return 0;
  return dot / Math.sqrt(midiNorm * audioNorm);
}

function combinedScore(midiOnsets: number[], audioOnsets: number[], offsetSec: number): number {
  const onset = correlateOnsets(midiOnsets, audioOnsets, offsetSec);
  const density = correlateOnsetDensity(midiOnsets, audioOnsets, offsetSec);
  return onset * 0.45 + density * 0.55;
}

export type MidiTimingAnalysis = {
  /** Raw first note time in the MIDI file (seconds). */
  firstNoteSec: number;
  /** Bar-aligned musical start (downbeat before/at first content). */
  musicalStartSec: number;
  /** Leading silence / empty bars before content. */
  preRollSec: number;
  preRollBars: number;
  /** Shift to apply so bar 1 beat 1 sits at t=0 in the file timeline. */
  normalizeToBarOneSec: number;
};

/** Analyze Melodyne / MIDI timing — detect pre-roll and where bar 1 should land. */
export function analyzeMidiTiming(notes: TranscribedNote[], bpm: number): MidiTimingAnalysis {
  const barSec = barDurationSec(bpm);
  const firstNoteSec = firstMusicalOnset(notes);
  const musicalStartSec = Math.floor(firstNoteSec / barSec) * barSec;
  const preRollSec = musicalStartSec;
  const preRollBars = barSec > 0 ? preRollSec / barSec : 0;
  return {
    firstNoteSec,
    musicalStartSec,
    preRollSec,
    preRollBars,
    normalizeToBarOneSec: -musicalStartSec,
  };
}

/** Coarse offset: align first musical content, snapped to bar grid. */
export function downbeatOffsetGuess(
  audioNotes: TranscribedNote[],
  midiNotes: TranscribedNote[],
  bpm: number,
): number {
  const barSec = barDurationSec(bpm);
  if (barSec <= 0) return 0;
  const audioFirst = firstMusicalOnset(audioNotes);
  const midiFirst = firstMusicalOnset(midiNotes);
  const audioBar = Math.round(audioFirst / barSec) * barSec;
  const midiBar = Math.round(midiFirst / barSec) * barSec;
  return audioBar - midiBar;
}

export type AlignMidiOptions = {
  bpm?: number;
  maxShiftSec?: number;
  stepSec?: number;
};

/**
 * Find shift (seconds) that lines MIDI up with audio on beat 1.
 * Positive offset moves MIDI later relative to audio.
 */
export function alignMidiToAudio(
  audioNotes: TranscribedNote[],
  midiNotes: TranscribedNote[],
  options: AlignMidiOptions = {},
): { offsetSec: number; score: number; method: "onset" | "downbeat" | "combined" } {
  const bpm = options.bpm ?? 120;
  const barSec = barDurationSec(bpm);
  const audioOnsets = noteOnsets(audioNotes);
  const midiOnsets = noteOnsets(midiNotes);

  if (!audioOnsets.length || !midiOnsets.length) {
    return { offsetSec: 0, score: 0, method: "onset" };
  }

  const maxShift =
    options.maxShiftSec ??
    Math.min(120, Math.max(8, barSec * 16, audioOnsets[audioOnsets.length - 1] ?? 0));

  const stepSec = options.stepSec ?? 0.02;
  const downbeatGuess = downbeatOffsetGuess(audioNotes, midiNotes, bpm);

  type Candidate = { offset: number; score: number };
  const candidates: Candidate[] = [];

  const pushCandidate = (offset: number) => {
    if (Math.abs(offset) > maxShift + barSec) return;
    candidates.push({ offset, score: combinedScore(midiOnsets, audioOnsets, offset) });
  };

  pushCandidate(downbeatGuess);

  const barSteps = Math.ceil(maxShift / barSec);
  for (let k = -barSteps; k <= barSteps; k++) {
    pushCandidate(downbeatGuess + k * barSec);
  }

  let best = candidates[0] ?? { offset: downbeatGuess, score: 0 };
  for (const c of candidates) {
    if (c.score > best.score + 0.04) {
      best = c;
    } else if (Math.abs(c.score - best.score) <= 0.04) {
      const cDist = Math.abs(c.offset - downbeatGuess);
      const bestDist = Math.abs(best.offset - downbeatGuess);
      if (cDist < bestDist) best = c;
    }
  }

  const fineRadius = barSec * 0.25;
  const fineSteps = Math.round(fineRadius / stepSec);
  for (let i = -fineSteps; i <= fineSteps; i++) {
    const offset = best.offset + i * stepSec;
    const score = combinedScore(midiOnsets, audioOnsets, offset);
    if (score > best.score + 0.02) {
      best = { offset, score };
    }
  }

  let method: "onset" | "downbeat" | "combined" =
    Math.abs(best.offset - downbeatGuess) < stepSec ? "downbeat" : "combined";

  if (best.score < 0.12) {
    const onsetOffset = firstMusicalOnset(audioNotes) - firstMusicalOnset(midiNotes);
    const snapped = Math.round(onsetOffset / barSec) * barSec;
    const fallbackScore = combinedScore(midiOnsets, audioOnsets, snapped);
    if (fallbackScore >= best.score) {
      best = { offset: snapped, score: fallbackScore };
      method = "onset";
    }
  }

  return {
    offsetSec: Number(best.offset.toFixed(3)),
    score: Number(best.score.toFixed(3)),
    method,
  };
}

export function applyOffsetToNotes(notes: TranscribedNote[], offsetSec: number): TranscribedNote[] {
  return notes.map((n) => ({
    ...n,
    startSec: n.startSec + offsetSec,
    endSec: n.endSec + offsetSec,
  }));
}

/**
 * After correlation align, lock Melodyne to the audio file timeline:
 * when audio starts near t=0, first MIDI hit lands at file start (beat 1).
 */
export function anchorMelodyneToAudioFileStart(
  audioNotes: TranscribedNote[],
  midiNotes: TranscribedNote[],
  bpm: number,
): { notes: TranscribedNote[]; extraOffsetSec: number } {
  if (!midiNotes.length) return { notes: midiNotes, extraOffsetSec: 0 };

  const barSec = barDurationSec(bpm);
  const audioFirst = audioNotes.length ? firstMusicalOnset(audioNotes) : 0;
  const midiFirst = firstMusicalOnset(midiNotes);

  if (audioNotes.length === 0) {
    if (midiFirst > 0.02 && midiFirst < barSec * 12) {
      const shift = -midiFirst;
      return { notes: applyOffsetToNotes(midiNotes, shift), extraOffsetSec: shift };
    }
    return { notes: midiNotes, extraOffsetSec: 0 };
  }

  if (audioFirst <= barSec * 0.4) {
    const shift = -midiFirst;
    if (Math.abs(shift) > 0.008 && Math.abs(shift) < barSec * 12) {
      return { notes: applyOffsetToNotes(midiNotes, shift), extraOffsetSec: shift };
    }
  } else {
    const target = Math.floor(audioFirst / barSec) * barSec;
    const shift = target - midiFirst;
    if (Math.abs(shift) > 0.008 && Math.abs(shift) < barSec * 16) {
      return { notes: applyOffsetToNotes(midiNotes, shift), extraOffsetSec: shift };
    }
  }

  return { notes: midiNotes, extraOffsetSec: 0 };
}

/** Shift notes so bar 1 beat 1 is at t=0 (trim DAW pre-roll). */
export function normalizeMidiToBarOne(
  notes: TranscribedNote[],
  bpm: number,
): { notes: TranscribedNote[]; trimSec: number } {
  const { normalizeToBarOneSec, preRollSec } = analyzeMidiTiming(notes, bpm);
  if (Math.abs(normalizeToBarOneSec) < 0.001) {
    return { notes, trimSec: 0 };
  }
  const shifted = applyOffsetToNotes(notes, normalizeToBarOneSec).filter((n) => n.endSec > 0.01);
  return { notes: shifted, trimSec: preRollSec };
}
