export type PatternLength = "standard" | "extended" | "long";

const BASE_CP = 12;
const BASE_HK = 24;

export function resolvePatternCellLengths(patternLength: PatternLength = "standard"): {
  cpCellLen: number;
  hkCellLen: number;
  cpRotations: number[];
  hkRotations: number[];
} {
  const mult = patternLength === "long" ? 3 : patternLength === "extended" ? 2 : 1;
  const cpCellLen = BASE_CP * mult;
  const hkCellLen = BASE_HK * mult;
  return {
    cpCellLen,
    hkCellLen,
    cpRotations: [0, 4, 8].map((r) => r * mult),
    hkRotations: [0, 4, 8, 12, 16, 20].map((r) => r * mult),
  };
}
