import type { Analysis } from "./schemas";
import type { PlayAnalysisView } from "./instant-analysis";

/** Normalize UI key labels ("Am", "C") to engine format ("A minor", "C major"). */
export function normalizeKeyLabel(key: string): string {
  const trimmed = (key || "").trim();
  if (!trimmed) return "C major";
  if (/major|minor/i.test(trimmed)) return trimmed;

  const amMatch = trimmed.match(/^([A-G][b#]?)m$/i);
  if (amMatch) return `${amMatch[1]} minor`;

  const rootOnly = trimmed.match(/^([A-G][b#]?)$/);
  if (rootOnly) return `${rootOnly[1]} major`;

  return trimmed;
}

export function playViewToAnalysis(
  view: PlayAnalysisView,
  overrides?: { bpm?: number | null; key?: string | null },
): Analysis {
  const bpm = overrides?.bpm ?? view.bpm;
  const key = normalizeKeyLabel(overrides?.key ?? view.key);
  return {
    bpm: Math.round(bpm),
    time_signature: view.timeSignature || "4/4",
    key,
    key_confidence: view.keyConfidence ?? 50,
    chords: (view.chords || []).map((c) => ({
      t0: c.t0,
      t1: c.t1,
      symbol: c.symbol,
      roman: c.roman,
      confidence: c.confidence ?? 55,
    })),
    sections: (view.sections || []).map((s) => ({
      name: s.name,
      t0: s.t0,
      t1: s.t1,
      bars: s.bars,
    })),
    downbeats: view.downbeats || [],
    style_compatibility: view.styleCompatibility || [],
    timbre_descriptors: view.timbreDescriptors || {},
  };
}

export function applyChordEditsToAnalysis(
  analysis: Analysis,
  chordEdits?: Record<number, string>,
): Analysis {
  if (!chordEdits || Object.keys(chordEdits).length === 0 || !analysis.chords?.length) {
    return analysis;
  }
  return {
    ...analysis,
    chords: analysis.chords.map((c, i) => (chordEdits[i] ? { ...c, symbol: chordEdits[i] } : c)),
  };
}
