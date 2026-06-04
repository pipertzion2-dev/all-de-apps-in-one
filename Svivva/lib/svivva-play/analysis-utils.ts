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

/** Pull key from user prompt e.g. "in A major", "key of A", "Am". */
export function parseKeyFromUserHint(prompt: string | undefined): string | null {
  if (!prompt?.trim()) return null;
  const text = prompt.trim();
  const patterns = [
    /\b(?:in|key\s+of|key:?)\s+([A-G][#b]?)\s*(major|minor|maj|min|m)\b/i,
    /\b([A-G][#b]?)\s*(major|minor|maj|min)\b/i,
    /\b([A-G][#b]?)m\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const root = m[1]!;
    if (m[2]?.toLowerCase() === "m" || m[0]?.endsWith("m")) {
      return `${root} minor`;
    }
    const mode = m[2]?.toLowerCase();
    if (mode === "minor" || mode === "min") return `${root} minor`;
    return `${root} major`;
  }
  return null;
}

/** Map "A major" / "Am" → select value "A" / "Am". */
export function keyToSelectValue(key: string): string {
  const normalized = normalizeKeyLabel(key);
  const m = normalized.match(/^([A-G][#b]?)\s+(major|minor)$/i);
  if (!m) return key.trim();
  const root = m[1]!;
  return m[2]!.toLowerCase() === "minor" ? `${root}m` : root;
}

export function parseRootFromKeyLabel(key: string): string {
  const norm = normalizeKeyLabel(key);
  const m = norm.match(/^([A-G][#b]?)/);
  return m ? m[1]! : "C";
}

export function isMinorKeyLabel(key: string): boolean {
  return /\sminor$/i.test(normalizeKeyLabel(key));
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
