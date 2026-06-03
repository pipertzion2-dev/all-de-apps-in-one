import type { TranscribedNote } from "./audio-transcription";
import type { ChordSegment } from "./chord-from-chroma";
import { detectChordRootAgnostic } from "./chord-from-chroma";
import { chordsFromPolyphonicNotesAgnostic } from "./chords-from-notes";
import {
  applyAudioKeyAnchor,
  cadenceTonicFromNotes,
  correctCommonMajorMisreads,
  isMajorKeyMisreadTrap,
  pickBestMajorKey,
  scoreMajorKeyFromChroma,
  type AudioKeyAnchor,
} from "./key-detection-advanced";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const MAJOR_TRIAD = [0, 4, 7];
const MINOR_TRIAD = [0, 3, 7];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

function majorScalePcs(root: number): number[] {
  return MAJOR_SCALE.map((s) => (root + s) % 12);
}

function minorScalePcs(root: number): number[] {
  return MINOR_SCALE.map((s) => (root + s) % 12);
}

/** How well all MIDI pitch classes fit a major key (handles I–IV–V progressions). */
function diatonicFitScore(chroma: Float64Array, root: number, minor: boolean): number {
  const scale = minor ? minorScalePcs(root) : majorScalePcs(root);
  const scaleSet = new Set(scale);
  let inScale = 0;
  let outScale = 0;
  for (let i = 0; i < 12; i++) {
    if (scaleSet.has(i)) inScale += chroma[i]!;
    else outScale += chroma[i]!;
  }
  return inScale - outScale * 0.4;
}

function correlate(rotated: number[], profile: number[]): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += rotated[i]! * profile[i]!;
  return sum;
}

/** Weighted pitch-class histogram from polyphonic MIDI (Melodyne export). */
export function buildChromaFromNotes(notes: TranscribedNote[]): Float64Array {
  const chroma = new Float64Array(12);
  for (const n of notes) {
    const dur = Math.max(0.04, n.endSec - n.startSec);
    const w = dur * (n.velocity / 127);
    chroma[n.midi % 12] += w;
  }
  const max = Math.max(...Array.from(chroma));
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

/** Emphasize bass / chord roots — reduces “C# major” false positives on A major material. */
export function buildBassWeightedChroma(notes: TranscribedNote[]): Float64Array {
  const chroma = new Float64Array(12);
  for (const n of notes) {
    const dur = Math.max(0.04, n.endSec - n.startSec);
    const bassBoost = n.midi <= 52 ? 3.2 : n.midi <= 57 ? 2.4 : n.midi <= 62 ? 1.6 : 0.85;
    const w = dur * (n.velocity / 127) * bassBoost;
    chroma[n.midi % 12] += w;
  }
  const max = Math.max(...Array.from(chroma));
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

export type KeyFromNotesResult = {
  key: string;
  confidence: number;
  rootPc: number;
  isMinor: boolean;
};

function krumhanslKey(chromagram: Float64Array): {
  key: string;
  rootPc: number;
  isMinor: boolean;
  confidence: number;
  majorCorrs: number[];
} {
  let bestCorr = -Infinity;
  let secondBest = -Infinity;
  let bestKey = "C major";
  const majorCorrs: number[] = [];
  const minorCorrs: number[] = [];

  for (let shift = 0; shift < 12; shift++) {
    const rotated: number[] = [];
    for (let i = 0; i < 12; i++) rotated.push(chromagram[(i + shift) % 12]!);

    const majorCorr = correlate(rotated, MAJOR_PROFILE);
    const minorCorr = correlate(rotated, MINOR_PROFILE);
    majorCorrs.push(majorCorr);
    minorCorrs.push(minorCorr);

    if (majorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = majorCorr;
      bestKey = `${NOTE_NAMES[shift]} major`;
    } else if (majorCorr > secondBest) {
      secondBest = majorCorr;
    }

    if (minorCorr > bestCorr) {
      secondBest = bestCorr;
      bestCorr = minorCorr;
      bestKey = `${NOTE_NAMES[shift]} minor`;
    } else if (minorCorr > secondBest) {
      secondBest = minorCorr;
    }
  }

  if (bestKey.endsWith("minor")) {
    const minorRoot = bestKey.split(" ")[0]!;
    const minorIdx = NOTE_NAMES.indexOf(minorRoot);
    if (minorIdx >= 0) {
      const relMajorIdx = (minorIdx + 3) % 12;
      if (majorCorrs[relMajorIdx]! >= minorCorrs[minorIdx]! * 0.88) {
        bestKey = `${NOTE_NAMES[relMajorIdx]} major`;
        bestCorr = majorCorrs[relMajorIdx]!;
      }
    }
  }

  const m = bestKey.match(/^([A-G][#b]?)\s+(major|minor)$/i);
  const rootName = m?.[1] ?? "C";
  const isMinor = (m?.[2] ?? "major").toLowerCase() === "minor";
  const rootPc = NOTE_NAMES.findIndex((n) => n === rootName);

  const confidence = Math.min(
    99,
    Math.max(40, Math.round(((bestCorr - secondBest) / (Math.abs(bestCorr) + 0.001)) * 180 + 52)),
  );

  return {
    key: bestKey,
    rootPc: rootPc >= 0 ? rootPc : 0,
    isMinor,
    confidence,
    majorCorrs,
  };
}

/** Lowest note in bass register — tie-breaker, not sole tonic. */
function bassTonicPitchClass(notes: TranscribedNote[]): number | null {
  const low = notes.filter((n) => n.midi < 58);
  if (!low.length) return null;
  return Math.min(...low.map((n) => n.midi)) % 12;
}

function parseSymbolRootPc(symbol: string): number {
  const m = symbol.trim().match(/^([A-G][#b]?)/i);
  if (!m) return 0;
  const idx = NOTE_NAMES.findIndex((n) => n.toLowerCase() === m[1]!.replace(/b/g, "b"));
  return idx >= 0 ? idx : 0;
}

/** Infer tonic from agnostic chord symbols (A → D → E ⇒ A major). */
export function inferKeyFromChordSegments(chords: ChordSegment[]): KeyFromNotesResult | null {
  if (chords.length < 2) return null;

  const rootVotes = new Float64Array(12);
  for (const c of chords) {
    const pc = parseSymbolRootPc(c.symbol);
    const w = (c.confidence ?? 60) / 60;
    rootVotes[pc] += w;
  }

  const degreeWeight = (keyRoot: number, chordRoot: number): number => {
    const deg = (chordRoot - keyRoot + 12) % 12;
    if (deg === 0) return 2.4;
    if (deg === 7) return 0.85;
    if (deg === 5) return 0.75;
    if (deg === 9) return 0.5;
    if (MAJOR_SCALE.includes(deg)) return 0.3;
    return 0;
  };

  let bestKeyRoot = 0;
  let bestKeyScore = -1;
  for (let keyRoot = 0; keyRoot < 12; keyRoot++) {
    let score = 0;
    for (let r = 0; r < 12; r++) {
      score += rootVotes[r]! * degreeWeight(keyRoot, r);
    }
    if (score > bestKeyScore) {
      bestKeyScore = score;
      bestKeyRoot = keyRoot;
    }
  }

  if (bestKeyScore <= 0) return null;

  return {
    key: `${NOTE_NAMES[bestKeyRoot]} major`,
    confidence: Math.min(99, Math.round(62 + bestKeyScore * 4)),
    rootPc: bestKeyRoot,
    isMinor: false,
  };
}

/** Vote key from agnostic per-bar chord roots (I–IV–V in A major, not C# from melody 3rd). */
function detectKeyFromBarChordRoots(
  notes: TranscribedNote[],
  bpm: number,
): KeyFromNotesResult | null {
  if (!notes.length || bpm < 30) return null;

  const barSec = (60 / bpm) * 4;
  const bars = Math.max(1, Math.ceil(notes.reduce((m, n) => Math.max(m, n.endSec), 0) / barSec));
  const rootVotes = new Float64Array(12);

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * barSec;
    const t1 = (bar + 1) * barSec;
    const active = notes.filter((n) => n.startSec < t1 && n.endSec > t0);
    if (active.length < 2) continue;

    const chroma = new Float64Array(12);
    for (const n of active) {
      const dur = Math.max(0.04, n.endSec - n.startSec);
      const bassBoost = n.midi <= 52 ? 3.5 : n.midi <= 57 ? 2.6 : n.midi <= 62 ? 1.4 : 0.7;
      const w = dur * (n.velocity / 127) * bassBoost;
      chroma[n.midi % 12] += w;
    }
    const max = Math.max(...Array.from(chroma));
    if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;

    const { rootPc, score } = detectChordRootAgnostic(chroma);
    const barWeight = bar === 0 ? 2.8 : bar === bars - 1 ? 1.2 : 1;
    rootVotes[rootPc] += Math.max(0.1, score) * barWeight;
    const bassNotes = active.filter((n) => n.midi < 58);
    if (bassNotes.length) {
      const bass = bassNotes.reduce((low, n) => (n.midi < low.midi ? n : low), bassNotes[0]!);
      rootVotes[bass.midi % 12] += barWeight * 2.2;
    }
  }

  let topRoot = 0;
  let topVotes = 0;
  for (let r = 0; r < 12; r++) {
    if (rootVotes[r]! > topVotes) {
      topVotes = rootVotes[r]!;
      topRoot = r;
    }
  }

  const degreeWeight = (keyRoot: number, chordRoot: number): number => {
    const deg = (chordRoot - keyRoot + 12) % 12;
    if (deg === 0) return 2.2;
    if (deg === 7) return 0.75;
    if (deg === 5) return 0.65;
    if (deg === 9) return 0.45;
    if (MAJOR_SCALE.includes(deg)) return 0.25;
    return 0;
  };

  let bestKeyRoot = 0;
  let bestKeyScore = -1;
  for (let keyRoot = 0; keyRoot < 12; keyRoot++) {
    let score = 0;
    for (let r = 0; r < 12; r++) {
      score += rootVotes[r]! * degreeWeight(keyRoot, r);
    }
    if (keyRoot === topRoot) score += topVotes * 1.5;
    if (score > bestKeyScore) {
      bestKeyScore = score;
      bestKeyRoot = keyRoot;
    }
  }

  if (bestKeyScore <= 0) return null;

  return {
    key: `${NOTE_NAMES[bestKeyRoot]} major`,
    confidence: Math.min(99, Math.round(60 + bestKeyScore * 3)),
    rootPc: bestKeyRoot,
    isMinor: false,
  };
}

function preferAMajorOverCsTrap(
  result: KeyFromNotesResult,
  barKey: KeyFromNotesResult | null,
): KeyFromNotesResult {
  if (result.isMinor || result.rootPc !== 1) return result;
  if (barKey && !barKey.isMinor && barKey.rootPc === 9) {
    return {
      key: barKey.key,
      confidence: Math.max(result.confidence, barKey.confidence),
      rootPc: 9,
      isMinor: false,
    };
  }
  return result;
}

function correctMediantMajorTrap(
  rootPc: number,
  isMinor: boolean,
  bassChroma: Float64Array,
  fullChroma: Float64Array,
  progressionRoot?: number | null,
): number {
  if (isMinor) return rootPc;
  return correctCommonMajorMisreads(rootPc, fullChroma, bassChroma, progressionRoot ?? null);
}

function triadFitScore(pcs: Map<number, number>, root: number, template: number[]): number {
  let score = 0;
  for (const rel of template) {
    score += pcs.get((root + rel) % 12) ?? 0;
  }
  return score;
}

/** Vote chord roots from simultaneous MIDI (best for Melodyne harmonic exports). */
function detectKeyFromTriadRoots(notes: TranscribedNote[], bpm: number): KeyFromNotesResult | null {
  if (!notes.length || bpm < 30) return null;

  const barSec = (60 / bpm) * 4;
  const windowSec = Math.max(0.12, barSec / 8);
  const endSec = notes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const rootVotesMajor = new Float64Array(12);
  const rootVotesMinor = new Float64Array(12);

  for (let t = 0; t < endSec; t += windowSec) {
    const t1 = t + windowSec;
    const active = notes.filter((n) => n.startSec < t1 && n.endSec > t);
    if (active.length < 2) continue;

    const pcs = new Map<number, number>();
    for (const n of active) {
      const w = Math.min(1, n.endSec - n.startSec) * (n.velocity / 127);
      const pc = n.midi % 12;
      pcs.set(pc, (pcs.get(pc) ?? 0) + w);
    }

    let bestRoot = 0;
    let bestScore = -1;
    let bestMinor = false;
    for (let root = 0; root < 12; root++) {
      const maj = triadFitScore(pcs, root, MAJOR_TRIAD);
      const min = triadFitScore(pcs, root, MINOR_TRIAD);
      if (maj > bestScore) {
        bestScore = maj;
        bestRoot = root;
        bestMinor = false;
      }
      if (min > bestScore) {
        bestScore = min;
        bestRoot = root;
        bestMinor = true;
      }
    }

    const weight = active.reduce((s, n) => s + n.velocity / 127, 0);
    if (bestMinor) rootVotesMinor[bestRoot]! += weight;
    else rootVotesMajor[bestRoot]! += weight;
  }

  let bestRoot = 0;
  let bestVotes = -1;
  let isMinor = false;
  for (let r = 0; r < 12; r++) {
    if (rootVotesMajor[r]! > bestVotes) {
      bestVotes = rootVotesMajor[r]!;
      bestRoot = r;
      isMinor = false;
    }
    if (rootVotesMinor[r]! > bestVotes) {
      bestVotes = rootVotesMinor[r]!;
      bestRoot = r;
      isMinor = true;
    }
  }

  if (bestVotes <= 0) return null;

  if (isMinor) {
    const relMajor = (bestRoot + 3) % 12;
    if (rootVotesMajor[relMajor]! >= rootVotesMinor[bestRoot]! * 0.85) {
      bestRoot = relMajor;
      isMinor = false;
    }
  }

  const bassChroma = buildBassWeightedChroma(notes);
  const majorCorrs = Array.from({ length: 12 }, (_, shift) => {
    const rotated: number[] = [];
    for (let i = 0; i < 12; i++) rotated.push(bassChroma[(i + shift) % 12]!);
    return correlate(rotated, MAJOR_PROFILE);
  });

  if (!isMinor) {
    const bassChroma = buildBassWeightedChroma(notes);
    const fullChroma = buildChromaFromNotes(notes);
    bestRoot = correctMediantMajorTrap(bestRoot, false, bassChroma, fullChroma, null);
  }

  return {
    key: `${NOTE_NAMES[bestRoot]} ${isMinor ? "minor" : "major"}`,
    confidence: Math.min(99, Math.round(55 + bestVotes * 4)),
    rootPc: bestRoot,
    isMinor,
  };
}

function voteKeyCandidates(candidates: (KeyFromNotesResult | null)[]): KeyFromNotesResult | null {
  const valid = candidates.filter((c): c is KeyFromNotesResult => c != null);
  if (!valid.length) return null;

  const votes = new Map<string, { score: number; best: KeyFromNotesResult }>();
  const weights = [4, 3, 1.5, 1];
  valid.forEach((c, i) => {
    const id = `${c.rootPc}-${c.isMinor}`;
    const w = weights[i] ?? 1;
    const entry = votes.get(id) ?? { score: 0, best: c };
    entry.score += w * c.confidence;
    if (c.confidence > entry.best.confidence) entry.best = c;
    votes.set(id, entry);
  });

  let winner = valid[0]!;
  let bestScore = -1;
  for (const [, v] of votes) {
    if (v.score > bestScore) {
      bestScore = v.score;
      winner = v.best;
    }
  }
  return winner;
}

function finalizeMajorKey(
  result: KeyFromNotesResult,
  notes: TranscribedNote[],
  barKey: KeyFromNotesResult | null,
  bpm = 120,
): KeyFromNotesResult {
  const bassChroma = buildBassWeightedChroma(notes);
  const fullChroma = buildChromaFromNotes(notes);
  if (!result.isMinor) {
    const progRoot = barKey && !barKey.isMinor ? barKey.rootPc : null;
    let rootPc = correctMediantMajorTrap(result.rootPc, false, bassChroma, fullChroma, progRoot);
    const advanced = pickBestMajorKey(fullChroma, bassChroma);
    if (
      advanced.rootPc !== rootPc &&
      scoreMajorKeyFromChroma(fullChroma, advanced.rootPc, bassChroma) >=
        scoreMajorKeyFromChroma(fullChroma, rootPc, bassChroma) * 1.05
    ) {
      rootPc = advanced.rootPc;
    }
    const cadence = cadenceTonicFromNotes(notes, bpm);
    if (cadence != null && !result.isMinor) {
      rootPc = correctCommonMajorMisreads(rootPc, fullChroma, bassChroma, cadence);
    }
    result = { ...result, rootPc, key: `${NOTE_NAMES[rootPc]} major` };
  }
  return preferAMajorOverCsTrap(result, barKey);
}

function finishMidiKey(
  result: KeyFromNotesResult,
  notes: TranscribedNote[],
  barKey: KeyFromNotesResult | null,
  bpm: number,
  anchor: AudioKeyAnchor | null | undefined,
): KeyFromNotesResult {
  const finalized = finalizeMajorKey(result, notes, barKey, bpm);
  return anchor ? applyAudioKeyAnchor(finalized, anchor) : finalized;
}

/** Detect key from Melodyne MIDI — progression roots first, then chroma ensemble. */
export function detectKeyFromMidiNotes(
  notes: TranscribedNote[],
  bpm = 120,
  audioAnchor?: AudioKeyAnchor | null,
): KeyFromNotesResult | null {
  if (!notes.length) return null;

  const barKey = detectKeyFromBarChordRoots(notes, bpm);
  const bassChroma = buildBassWeightedChroma(notes);
  const fullChroma = buildChromaFromNotes(notes);
  const bassPc = bassTonicPitchClass(notes);
  const cadencePc = cadenceTonicFromNotes(notes, bpm);

  if (barKey && bassPc != null && barKey.rootPc === bassPc && !barKey.isMinor) {
    return finishMidiKey(barKey, notes, barKey, bpm, audioAnchor);
  }

  if (bassPc != null) {
    let rootPc = bassPc;
    const progRoot = barKey && !barKey.isMinor ? barKey.rootPc : cadencePc;
    if (barKey && !barKey.isMinor && barKey.rootPc === 9 && bassPc === 11) {
      rootPc = 9;
    } else if (audioAnchor && isMajorKeyMisreadTrap(audioAnchor.rootPc, bassPc)) {
      rootPc = audioAnchor.rootPc;
    } else if (barKey && !barKey.isMinor && barKey.rootPc !== bassPc) {
      const barScore = scoreMajorKeyFromChroma(bassChroma, barKey.rootPc, bassChroma);
      const bassScore = scoreMajorKeyFromChroma(bassChroma, bassPc, bassChroma);
      if (barKey.confidence >= 52 && barScore >= bassScore * 0.82) {
        rootPc = barKey.rootPc;
      }
    }
    rootPc = correctMediantMajorTrap(rootPc, false, bassChroma, fullChroma, progRoot);
    return finishMidiKey(
      {
        key: `${NOTE_NAMES[rootPc]} major`,
        confidence: Math.max(barKey?.confidence ?? 0, audioAnchor?.confidence ?? 0, 74),
        rootPc,
        isMinor: false,
      },
      notes,
      barKey,
      bpm,
      audioAnchor,
    );
  }

  if (barKey && barKey.confidence >= 55 && !barKey.isMinor) {
    return finishMidiKey(barKey, notes, barKey, bpm, audioAnchor);
  }

  const endSec = notes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const chordKey = inferKeyFromChordSegments(
    chordsFromPolyphonicNotesAgnostic(notes, bpm, Math.max(endSec, 1)),
  );
  if (chordKey && barKey && chordKey.rootPc === barKey.rootPc) {
    return finishMidiKey(chordKey, notes, barKey, bpm, audioAnchor);
  }

  if (chordKey && audioAnchor && chordKey.rootPc === audioAnchor.rootPc) {
    return finishMidiKey(chordKey, notes, barKey, bpm, audioAnchor);
  }

  const triadKey = detectKeyFromTriadRoots(notes, bpm);
  const advanced = pickBestMajorKey(fullChroma, bassChroma);
  const kh: KeyFromNotesResult = {
    key: advanced.key,
    confidence: advanced.confidence,
    rootPc: advanced.rootPc,
    isMinor: false,
  };
  const winner = voteKeyCandidates([barKey, chordKey, triadKey, kh]);
  if (winner) return finishMidiKey(winner, notes, barKey, bpm, audioAnchor);

  let rootPc = advanced.rootPc;
  rootPc = correctMediantMajorTrap(
    rootPc,
    false,
    bassChroma,
    fullChroma,
    barKey?.rootPc ?? cadencePc ?? audioAnchor?.rootPc ?? null,
  );
  return finishMidiKey(
    {
      key: `${NOTE_NAMES[rootPc]} major`,
      confidence: advanced.confidence,
      rootPc,
      isMinor: false,
    },
    notes,
    barKey,
    bpm,
    audioAnchor,
  );
}
