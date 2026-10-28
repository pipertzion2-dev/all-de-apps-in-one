import type { InventionFields } from "./types";

const FIELD_WEIGHTS: Array<{ key: keyof InventionFields; weight: number }> = [
  { key: "title", weight: 8 },
  { key: "description", weight: 12 },
  { key: "problemSolved", weight: 12 },
  { key: "howItWorks", weight: 14 },
  { key: "uniqueFeatures", weight: 12 },
  { key: "technicalSpecs", weight: 10 },
  { key: "materials", weight: 6 },
  { key: "componentsText", weight: 6 },
  { key: "alternativeImplementations", weight: 8 },
  { key: "developmentHistory", weight: 6 },
  { key: "conceptionDate", weight: 6 },
];

function filled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length >= 4;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

export function computeDocumentationProgress(fields: InventionFields): number {
  let earned = 0;
  let total = 0;
  for (const { key, weight } of FIELD_WEIGHTS) {
    total += weight;
    if (filled(fields[key])) earned += weight;
  }
  if (fields.inventors.some((i) => i.name.trim().length >= 2)) {
    earned += 5;
  }
  total += 5;
  if (fields.collaborators.length > 0) {
    earned += 3;
  }
  total += 3;
  return Math.min(100, Math.round((earned / total) * 100));
}
