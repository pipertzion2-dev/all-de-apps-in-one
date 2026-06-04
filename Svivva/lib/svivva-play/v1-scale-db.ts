/**
 * Scale catalog from V-1 JAWN Ollama (ragas + modes). Used for fuzzy lookup before AI.
 */
import { registerDynamicScale, normalizeScaleId } from "./dynamic-scales";

export const V1_RAGA_INTERVALS: Record<string, number[]> = {
  bilawal: [0, 2, 4, 5, 7, 9, 11],
  kafi: [0, 2, 3, 5, 7, 9, 10],
  yaman: [0, 2, 4, 6, 7, 9, 11],
  bhairav: [0, 1, 4, 5, 7, 8, 11],
  bhairavi: [0, 1, 3, 5, 7, 8, 10],
  asavari: [0, 2, 3, 5, 7, 8, 10],
  khamaj: [0, 2, 4, 5, 7, 9, 10],
  marwa: [0, 1, 4, 6, 7, 9, 11],
  purvi: [0, 1, 4, 6, 7, 8, 11],
  todi: [0, 1, 3, 6, 7, 8, 11],
  kalavati: [0, 2, 4, 5, 7, 8, 10],
  harikamboji: [0, 2, 4, 5, 7, 9, 11],
  sankarabharanam: [0, 2, 4, 5, 7, 9, 11],
  hemavati: [0, 2, 4, 5, 7, 9, 11],
  dharmavati: [0, 2, 3, 5, 7, 9, 10],
};

const V1_ALIASES: Record<string, string> = {
  major: "bilawal",
  ionian: "bilawal",
  minor: "asavari",
  natural_minor: "asavari",
  aeolian: "asavari",
  mixolydian: "khamaj",
};

let registered = false;

export function ensureV1ScalesRegistered(): void {
  if (registered) return;
  for (const [name, steps] of Object.entries(V1_RAGA_INTERVALS)) {
    registerDynamicScale(`raga_${name}`, steps);
    registerDynamicScale(name, steps);
  }
  for (const [alias, target] of Object.entries(V1_ALIASES)) {
    const steps = V1_RAGA_INTERVALS[target];
    if (steps) registerDynamicScale(alias, steps);
  }
  registered = true;
}

export function lookupV1ScaleDb(query: string): { id: string; steps: number[] } | null {
  ensureV1ScalesRegistered();
  const key = normalizeScaleId(query);
  if (V1_RAGA_INTERVALS[key]) return { id: key, steps: V1_RAGA_INTERVALS[key]! };
  const ragaKey = key.replace(/^raga_/, "");
  if (V1_RAGA_INTERVALS[ragaKey]) return { id: ragaKey, steps: V1_RAGA_INTERVALS[ragaKey]! };
  const alias = V1_ALIASES[key];
  if (alias && V1_RAGA_INTERVALS[alias]) return { id: alias, steps: V1_RAGA_INTERVALS[alias]! };
  return null;
}
