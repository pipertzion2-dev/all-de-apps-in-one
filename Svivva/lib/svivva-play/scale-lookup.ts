import { get as tonalGetScale, names as tonalScaleNames } from "@tonaljs/scale";
import {
  registerDynamicScale,
  normalizeScaleId,
  getDynamicScaleSteps,
  EXTENDED_BUILTIN_SCALES,
} from "./dynamic-scales";
import { listScales, scaleNoteNames } from "./reich-engine";
import { ensureV1ScalesRegistered, lookupV1ScaleDb } from "./v1-scale-db";

export type ScaleLookupMatch = {
  scaleId: string;
  label: string;
  source: "catalog" | "alias" | "fuzzy" | "tonal" | "ai" | "v1_db" | "ollama";
  confidence: number;
  relativeSteps: number[];
  noteNames?: string[];
  reason?: string;
};

export type ScaleLookupAlternate = {
  scaleId: string;
  label: string;
  relativeSteps: number[];
};

export type ScaleLookupResult = {
  query: string;
  resolved: ScaleLookupMatch | null;
  suggestions: ScaleLookupMatch[];
  alternates?: ScaleLookupAlternate[];
};

/** Common misspellings and colloquial names → catalog id. */
export const SCALE_ALIASES: Record<string, string> = {
  brazillian: "brazilian",
  brazil: "brazilian",
  brazilian: "brazilian",
  ionian: "major",
  aeolian: "natural_minor",
  hindustani: "raga_yaman",
  carnatic: "raga_yaman",
  indian: "raga_yaman",
  arabic: "arabic_hijaz",
  hijaz: "arabic_hijaz",
  japanese: "japanese_in",
  in_scale: "japanese_in",
  blues: "blues_minor",
  pentatonic: "pentatonic_major",
  pentatonic_major: "pentatonic_major",
  pentatonic_minor: "pentatonic_minor",
  hungarian: "hungarian_minor",
  gypsy: "hungarian_minor",
  flamenco: "phrygian",
  spanish: "phrygian",
  lydian_dominant: "lydian_dominant",
  acoustic: "lydian_dominant",
  bebop: "bebop_major",
  whole_tone: "whole_tone",
  wholetone: "whole_tone",
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n]!;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/♯/g, "#").replace(/♭/g, "b");
}

function chromaToRelativeSteps(chroma: string): number[] {
  const pcs: number[] = [];
  for (let i = 0; i < Math.min(12, chroma.length); i++) {
    if (chroma[i] === "1") pcs.push(i);
  }
  if (!pcs.length) return [];
  const root = pcs[0]!;
  return [...new Set(pcs.map((p) => (p - root + 12) % 12))].sort((a, b) => a - b);
}

function catalogEntries(): { id: string; label: string }[] {
  const ids = new Set<string>([...listScales(), ...Object.keys(EXTENDED_BUILTIN_SCALES)]);
  try {
    for (const n of tonalScaleNames()) ids.add(normalizeScaleId(n));
  } catch {
    /* tonal optional at runtime */
  }
  return [...ids].map((id) => ({ id, label: id.replace(/_/g, " ") }));
}

function matchFromCatalog(
  scaleId: string,
  source: ScaleLookupMatch["source"],
  confidence: number,
): ScaleLookupMatch {
  const id = normalizeScaleId(scaleId);
  const steps = EXTENDED_BUILTIN_SCALES[id] ??
    getDynamicScaleSteps(id) ??
    chromaFromTonal(id) ?? [0, 2, 4, 5, 7, 9, 11];
  registerDynamicScale(id, steps);
  return {
    scaleId: id,
    label: id.replace(/_/g, " "),
    source,
    confidence,
    relativeSteps: steps,
    reason: `Matched ${source} catalog entry "${id}".`,
  };
}

function chromaFromTonal(scaleId: string): number[] | null {
  const data = tonalGetScale(scaleId.replace(/_/g, " "));
  if (!data || (data as { empty?: boolean }).empty) return null;
  const chroma = (data as { chroma?: string }).chroma;
  if (!chroma) return null;
  const steps = chromaToRelativeSteps(chroma);
  return steps.length >= 3 ? steps : null;
}

function fuzzySearch(query: string, limit = 8): ScaleLookupMatch[] {
  const q = normalizeQuery(query);
  const entries = catalogEntries();
  const scored: { entry: (typeof entries)[0]; dist: number }[] = [];

  for (const entry of entries) {
    const label = entry.label.toLowerCase();
    const id = entry.id.toLowerCase();
    const dist = Math.min(
      levenshtein(q, label),
      levenshtein(q, id),
      levenshtein(q.replace(/\s/g, "_"), id),
    );
    if (dist <= Math.max(3, Math.floor(q.length * 0.45))) {
      scored.push({ entry, dist });
    }
  }

  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map(({ entry, dist }) => {
    const confidence = Math.max(35, 100 - dist * 18);
    return matchFromCatalog(entry.id, "fuzzy", confidence);
  });
}

function resolveAlias(query: string): string | null {
  const key = normalizeScaleId(query);
  return SCALE_ALIASES[key] ?? null;
}

function resolveTonal(query: string): ScaleLookupMatch | null {
  const tries = [query, query.replace(/_/g, " "), normalizeScaleId(query).replace(/_/g, " ")];
  for (const t of tries) {
    const data = tonalGetScale(t);
    if (!data || (data as { empty?: boolean }).empty) continue;
    const name = (data as { name?: string }).name || normalizeScaleId(t);
    const steps = chromaFromTonal(name);
    if (!steps) continue;
    const id = normalizeScaleId(name);
    registerDynamicScale(id, steps);
    return {
      scaleId: id,
      label: name.replace(/_/g, " "),
      source: "tonal",
      confidence: 92,
      relativeSteps: steps,
      reason: `Found in Tonal.js scale library (${name}).`,
    };
  }
  return null;
}

/** Local scale search — catalog, aliases, Tonal.js, fuzzy suggestions. */
export function lookupScaleLocal(query: string, keyRoot = "C"): ScaleLookupResult {
  const raw = query.trim();
  if (!raw) {
    return { query: raw, resolved: null, suggestions: [] };
  }

  const q = normalizeQuery(raw);
  const id = normalizeScaleId(raw);
  const suggestions: ScaleLookupMatch[] = [];

  ensureV1ScalesRegistered();
  const v1Hit = lookupV1ScaleDb(raw);
  if (v1Hit) {
    const scaleId = listScales().includes(`raga_${v1Hit.id}`)
      ? `raga_${v1Hit.id}`
      : listScales().includes(v1Hit.id)
        ? v1Hit.id
        : `raga_${v1Hit.id}`;
    registerDynamicScale(scaleId, v1Hit.steps);
    const resolved: ScaleLookupMatch = {
      scaleId,
      label: v1Hit.id.replace(/_/g, " "),
      source: "v1_db",
      confidence: 94,
      relativeSteps: v1Hit.steps,
      noteNames: scaleNoteNames(scaleId, keyRoot),
      reason: `V-1 JAWN / Indian raga catalog (${v1Hit.id}).`,
    };
    return { query: raw, resolved, suggestions: fuzzySearch(raw, 5) };
  }

  // Exact catalog
  if (listScales().includes(id) || EXTENDED_BUILTIN_SCALES[id]) {
    const resolved = matchFromCatalog(id, "catalog", 100);
    resolved.noteNames = scaleNoteNames(id, keyRoot);
    return { query: raw, resolved, suggestions: [] };
  }

  // Alias
  const alias = resolveAlias(raw);
  if (alias) {
    const resolved = matchFromCatalog(alias, "alias", 96);
    resolved.reason = `Interpreted "${raw}" as ${alias.replace(/_/g, " ")}.`;
    resolved.noteNames = scaleNoteNames(alias, keyRoot);
    return { query: raw, resolved, suggestions: fuzzySearch(raw, 5) };
  }

  // Tonal exact / near
  const tonalHit = resolveTonal(raw);
  if (tonalHit) {
    tonalHit.noteNames = scaleNoteNames(tonalHit.scaleId, keyRoot);
    return { query: raw, resolved: tonalHit, suggestions: fuzzySearch(raw, 5) };
  }

  // Fuzzy
  const fuzzy = fuzzySearch(raw, 10);
  if (fuzzy.length > 0) {
    const best = fuzzy[0]!;
    best.noteNames = scaleNoteNames(best.scaleId, keyRoot);
    if (best.confidence >= 72) {
      return { query: raw, resolved: best, suggestions: fuzzy.slice(1) };
    }
    return { query: raw, resolved: null, suggestions: fuzzy };
  }

  return { query: raw, resolved: null, suggestions: [] };
}

export function applyScaleLookupMatch(match: ScaleLookupMatch): void {
  registerDynamicScale(match.scaleId, match.relativeSteps);
}

/** Parse AI / API JSON into a lookup match. */
export function matchFromAiPayload(payload: {
  scaleId?: string;
  relativeSemitoneSteps?: number[];
  displayName?: string;
  reason?: string;
}): ScaleLookupMatch | null {
  const steps = payload.relativeSemitoneSteps;
  if (!payload.scaleId || !Array.isArray(steps) || steps.length < 3) return null;
  const id = normalizeScaleId(payload.scaleId);
  registerDynamicScale(id, steps);
  return {
    scaleId: id,
    label: payload.displayName?.trim() || id.replace(/_/g, " "),
    source: "ai",
    confidence: 88,
    relativeSteps: steps,
    reason: payload.reason || `AI resolved scale "${id}".`,
  };
}
