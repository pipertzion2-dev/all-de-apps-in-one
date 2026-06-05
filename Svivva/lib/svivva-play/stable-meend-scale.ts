import { isMinorKeyLabel, normalizeKeyLabel, parseRootFromKeyLabel } from "./analysis-utils";

const RAGA_MAJOR = ["raga_bhairav", "raga_marwa", "raga_purvi"] as const;
const RAGA_MINOR = ["raga_todi", "raga_bhairavi"] as const;

function hashAnchor(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Same audio + key → same raga across regenerates (seed-independent). */
export function pickStableIndianRagaScaleName(opts: {
  lockedKey: string;
  sessionAnchor?: string | null;
}): string {
  const key = normalizeKeyLabel(opts.lockedKey);
  const minor = isMinorKeyLabel(key);
  const list = minor ? RAGA_MINOR : RAGA_MAJOR;
  const root = parseRootFromKeyLabel(key);
  const anchor = (opts.sessionAnchor ?? "").trim() || key;
  const idx = hashAnchor(`${root}|${minor ? "m" : "M"}|${anchor}`) % list.length;
  return list[idx]!;
}
