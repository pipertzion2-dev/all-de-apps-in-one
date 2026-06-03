/**
 * Advanced major-key detection (Temperley + Krumhansl + diatonic fit + exclusive tones).
 * Reduces common misreads: C# for A (mediant), B for A (supertonic melody).
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_PROFILE_KS = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
/** Temperley (2001) — closer to commercial key-finder behavior than raw K-S alone. */
const MAJOR_PROFILE_TEMPERLEY = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];

function correlatePearson(chromagram: number[], profile: number[]): number {
  const n = 12;
  let sumXY = 0,
    sumX = 0,
    sumY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += chromagram[i]! * profile[i]!;
    sumX += chromagram[i]!;
    sumY += profile[i]!;
    sumX2 += chromagram[i]! * chromagram[i]!;
    sumY2 += profile[i]! * profile[i]!;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function rotateChroma(chroma: Float64Array, rootPc: number): number[] {
  const rotated: number[] = [];
  for (let i = 0; i < 12; i++) rotated.push(chroma[(i + rootPc) % 12]!);
  return rotated;
}

function majorScaleSet(rootPc: number): Set<number> {
  return new Set(MAJOR_SCALE.map((s) => (rootPc + s) % 12));
}

/** Exclusive-tone fit: penalize energy on chroma outside the major scale. */
export function diatonicExclusiveScore(chroma: Float64Array, rootPc: number): number {
  const scale = majorScaleSet(rootPc);
  let inScale = 0;
  let outScale = 0;
  for (let i = 0; i < 12; i++) {
    if (scale.has(i)) inScale += chroma[i]!;
    else outScale += chroma[i]!;
  }
  const tonic = chroma[rootPc]!;
  const dominant = chroma[(rootPc + 7) % 12]!;
  return inScale - outScale * 1.35 + tonic * 0.55 + dominant * 0.35;
}

/** Combined score for one major-key candidate (0–12 roots). */
export function scoreMajorKeyFromChroma(
  chroma: Float64Array,
  rootPc: number,
  bassChroma?: Float64Array,
): number {
  const rotated = rotateChroma(chroma, rootPc);
  const ks = correlatePearson(rotated, MAJOR_PROFILE_KS);
  const temperley = correlatePearson(rotated, MAJOR_PROFILE_TEMPERLEY);
  const exclusive = diatonicExclusiveScore(chroma, rootPc);

  let score = ks * 0.38 + temperley * 0.32 + exclusive * 0.3;

  if (bassChroma) {
    const bassRot = rotateChroma(bassChroma, rootPc);
    const bassKs = correlatePearson(bassRot, MAJOR_PROFILE_KS);
    const bassEx = diatonicExclusiveScore(bassChroma, rootPc);
    score = score * 0.42 + bassKs * 0.28 + bassEx * 0.3;
  }

  return score;
}

export type AdvancedMajorKeyResult = {
  rootPc: number;
  key: string;
  confidence: number;
  majorScores: number[];
};

/** Pick best major key from a chroma vector (optionally bass-weighted). */
export function pickBestMajorKey(
  chroma: Float64Array,
  bassChroma?: Float64Array,
): AdvancedMajorKeyResult {
  const majorScores: number[] = [];
  for (let r = 0; r < 12; r++) {
    majorScores.push(scoreMajorKeyFromChroma(chroma, r, bassChroma));
  }

  let bestRoot = 0;
  let bestScore = -Infinity;
  let secondScore = -Infinity;
  for (let r = 0; r < 12; r++) {
    const s = majorScores[r]!;
    if (s > bestScore) {
      secondScore = bestScore;
      bestScore = s;
      bestRoot = r;
    } else if (s > secondScore) {
      secondScore = s;
    }
  }

  bestRoot = correctCommonMajorMisreads(bestRoot, chroma, bassChroma);

  const margin = bestScore - secondScore;
  const confidence = Math.min(99, Math.max(42, Math.round(48 + margin * 120 + bestScore * 8)));

  return {
    rootPc: bestRoot,
    key: `${NOTE_NAMES[bestRoot]} major`,
    confidence,
    majorScores,
  };
}

/**
 * Fix mediant (C#→A) and supertonic (B→A) traps using scale-exclusive pitch classes.
 */
export function correctCommonMajorMisreads(
  rootPc: number,
  chroma: Float64Array,
  bassChroma?: Float64Array,
  progressionRoot?: number | null,
): number {
  const bass = bassChroma ?? chroma;

  if (rootPc === 1) {
    const fitCs = scoreMajorKeyFromChroma(chroma, 1, bassChroma);
    const fitA = scoreMajorKeyFromChroma(chroma, 9, bassChroma);
    if (
      fitA >= fitCs * 0.9 ||
      progressionRoot === 9 ||
      (chroma[9]! >= chroma[1]! * 0.55 && chroma[2]! > chroma[3]! * 1.05)
    ) {
      return 9;
    }
  }

  if (rootPc === 11) {
    const fitB = scoreMajorKeyFromChroma(chroma, 11, bassChroma);
    const fitA = scoreMajorKeyFromChroma(chroma, 9, bassChroma);
    const dNatural = chroma[2]!;
    const dSharp = chroma[3]!;
    const aNat = chroma[9]!;
    const aSharp = chroma[10]!;
    const bassA = bass[9]!;
    const bassB = bass[11]!;

    if (
      progressionRoot === 9 ||
      fitA >= fitB * 0.9 ||
      dNatural > dSharp * 1.12 ||
      (aNat > aSharp * 1.08 && bassA >= bassB * 0.85) ||
      (fitA >= fitB * 0.85 && dNatural >= dSharp * 0.95)
    ) {
      return 9;
    }
  }

  if (progressionRoot != null && progressionRoot !== rootPc) {
    const fitProg = scoreMajorKeyFromChroma(chroma, progressionRoot, bassChroma);
    const fitDet = scoreMajorKeyFromChroma(chroma, rootPc, bassChroma);
    if (fitProg >= fitDet * 0.92) return progressionRoot;
  }

  return rootPc;
}

/** V→I cadence in bass (e.g. E→A in A major) — boosts tonic from low register. */
export function cadenceTonicFromNotes(
  notes: { midi: number; startSec: number; endSec: number; velocity: number }[],
  bpm: number,
): number | null {
  if (!notes.length || bpm < 30) return null;

  const barSec = (60 / bpm) * 4;
  const endSec = notes.reduce((m, n) => Math.max(m, n.endSec), 0);
  const bars = Math.max(1, Math.ceil(endSec / barSec));
  const lastBars = [bars - 1, bars - 2].filter((b) => b >= 0);

  const cadenceVotes = new Float64Array(12);
  for (const bar of lastBars) {
    const t0 = bar * barSec;
    const t1 = (bar + 1) * barSec;
    const active = notes.filter((n) => n.startSec < t1 && n.endSec > t0 && n.midi < 58);
    if (!active.length) continue;

    const bassPc = Math.min(...active.map((n) => n.midi)) % 12;
    cadenceVotes[bassPc] += 2.2;
    const prevBar = bar - 1;
    if (prevBar >= 0) {
      const pt0 = prevBar * barSec;
      const pt1 = prevBar * barSec + barSec;
      const prevActive = notes.filter((n) => n.startSec < pt1 && n.endSec > pt0 && n.midi < 58);
      if (prevActive.length) {
        const prevPc = Math.min(...prevActive.map((n) => n.midi)) % 12;
        const interval = (bassPc - prevPc + 12) % 12;
        if (interval === 5 || interval === 7) {
          cadenceVotes[bassPc] += 2.5;
        }
      }
    }
  }

  let best = -1;
  let bestPc = 0;
  for (let i = 0; i < 12; i++) {
    if (cadenceVotes[i]! > best) {
      best = cadenceVotes[i]!;
      bestPc = i;
    }
  }
  return best > 0 ? bestPc : null;
}
