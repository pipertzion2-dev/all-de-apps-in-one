import { isMinorKeyLabel, parseRootFromKeyLabel } from "./analysis-utils";

const RAGA_MAJOR = ["raga_bhairav", "raga_marwa", "raga_purvi"] as const;
const RAGA_MINOR = ["raga_todi", "raga_bhairavi"] as const;

export function isIndianRagaScaleName(scaleName: string): boolean {
  return scaleName.toLowerCase().replace(/ /g, "_").startsWith("raga_");
}

/** Same raga for the same seed + mode (used by API + local compose). */
export function pickIndianRagaScaleName(opts: {
  root?: string;
  minor: boolean;
  seed: number;
}): string {
  const list = opts.minor ? RAGA_MINOR : RAGA_MAJOR;
  return list[Math.abs(Math.floor(opts.seed)) % list.length];
}

export function resolveMeendScaleName(opts: {
  lockedKey: string;
  reichScale: string;
  seed: number;
  meend: boolean;
}): string {
  if (!opts.meend) return opts.reichScale;
  if (isIndianRagaScaleName(opts.reichScale)) return opts.reichScale;
  const minor = isMinorKeyLabel(opts.lockedKey);
  return pickIndianRagaScaleName({ minor, seed: opts.seed });
}

/** Stable seed when "Use seed" is off — same audio + key → same material. */
export function stableGenerationSeed(opts: {
  useSeed: boolean;
  seed: number;
  lockedKey: string;
  importSeq: number;
}): number {
  if (opts.useSeed) return Math.abs(Math.floor(opts.seed)) % 999999;
  let h = 2166136261 ^ (opts.importSeq * 2654435761);
  const key = opts.lockedKey.trim().toLowerCase();
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 999999;
}

export function pickIndianRagaFromKey(key: string, seed: number): string {
  return pickIndianRagaScaleName({
    minor: isMinorKeyLabel(key),
    seed,
  });
}
