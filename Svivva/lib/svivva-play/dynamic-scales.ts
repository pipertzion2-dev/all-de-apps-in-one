/** Runtime scale definitions from lookup (Tonal, AI, user search). */
const dynamicScales = new Map<string, number[]>();

/** Built-in extended scales (Brazilian, Hungarian minor, etc.). */
export const EXTENDED_BUILTIN_SCALES: Record<string, number[]> = {
  brazilian: [0, 2, 4, 5, 7, 9, 10],
  hungarian_minor: [0, 2, 3, 6, 7, 8, 11],
  lydian_dominant: [0, 2, 4, 6, 7, 9, 10],
  bebop_major: [0, 2, 4, 5, 7, 8, 9, 11],
  harmonic_major: [0, 2, 4, 5, 7, 8, 11],
  double_harmonic: [0, 1, 4, 5, 7, 8, 11],
  enigmatic: [0, 1, 4, 6, 8, 10, 11],
  prometheus: [0, 2, 4, 6, 9, 10],
};

export function normalizeScaleId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_#]/g, "");
}

export function registerDynamicScale(name: string, semitoneStepsFromRoot: number[]): void {
  const id = normalizeScaleId(name);
  const steps = [...new Set(semitoneStepsFromRoot.map((s) => ((s % 12) + 12) % 12))].sort(
    (a, b) => a - b,
  );
  if (steps.length < 3) return;
  dynamicScales.set(id, steps);
}

export function getDynamicScaleSteps(name: string): number[] | undefined {
  return dynamicScales.get(normalizeScaleId(name));
}

export function listDynamicScales(): string[] {
  return [...dynamicScales.keys()].sort();
}

export function getAllDynamicScaleDefs(): Record<string, number[]> {
  return Object.fromEntries(dynamicScales);
}

export function getBuiltinOrDynamicSteps(name: string): number[] | undefined {
  const id = normalizeScaleId(name);
  return EXTENDED_BUILTIN_SCALES[id] ?? dynamicScales.get(id);
}
