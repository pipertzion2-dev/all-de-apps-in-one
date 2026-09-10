import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

export const CUBE_FACE_PROGRESS_STORAGE_KEY = "svivva-cube-face-visits";

/** All six cube faces that must be visited to unlock the walkthrough pack. */
export const ALL_CUBE_FACE_IDS: readonly FeatureId[] = [
  "play",
  "seeds",
  "orbit",
  "security",
  "api",
  "hardware",
] as const;

export type CubeFaceProgress = {
  visited: FeatureId[];
  updatedAt: string;
};

const VALID_IDS = new Set<string>(ALL_CUBE_FACE_IDS);

function emptyProgress(): CubeFaceProgress {
  return { visited: [], updatedAt: "" };
}

function normalizeVisited(raw: unknown): FeatureId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<FeatureId>();
  for (const item of raw) {
    if (typeof item === "string" && VALID_IDS.has(item)) {
      seen.add(item as FeatureId);
    }
  }
  return ALL_CUBE_FACE_IDS.filter((id) => seen.has(id));
}

/** Read persisted face visits (browser localStorage or test double). */
export function readCubeFaceProgress(storage?: Storage | null): CubeFaceProgress {
  if (!storage) return emptyProgress();
  try {
    const raw = storage.getItem(CUBE_FACE_PROGRESS_STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<CubeFaceProgress>;
    return {
      visited: normalizeVisited(parsed.visited),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return emptyProgress();
  }
}

/** Record one face visit and persist. Returns the updated progress. */
export function recordCubeFaceVisit(
  faceId: FeatureId,
  storage: Storage | null | undefined = typeof globalThis !== "undefined"
    ? globalThis.localStorage
    : null,
): CubeFaceProgress {
  if (!storage || !VALID_IDS.has(faceId)) {
    return readCubeFaceProgress(storage);
  }
  const current = readCubeFaceProgress(storage);
  const visited = new Set(current.visited);
  visited.add(faceId);
  const next: CubeFaceProgress = {
    visited: ALL_CUBE_FACE_IDS.filter((id) => visited.has(id)),
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(CUBE_FACE_PROGRESS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isCubeJourneyComplete(visited: Iterable<FeatureId>): boolean {
  const set = new Set(visited);
  return ALL_CUBE_FACE_IDS.every((id) => set.has(id));
}

export function cubeVisitProgress(visited: Iterable<FeatureId>): {
  visitedCount: number;
  total: number;
} {
  const set = new Set(visited);
  return {
    visitedCount: ALL_CUBE_FACE_IDS.filter((id) => set.has(id)).length,
    total: ALL_CUBE_FACE_IDS.length,
  };
}

/** Parse `visited=play,seeds,...` from download URLs. */
export function parseVisitedFacesParam(raw: string | null | undefined): FeatureId[] {
  if (!raw?.trim()) return [];
  const seen = new Set<FeatureId>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (VALID_IDS.has(id)) seen.add(id as FeatureId);
  }
  return ALL_CUBE_FACE_IDS.filter((id) => seen.has(id));
}

/** Encode visited faces for pack download query strings. */
export function encodeVisitedFacesParam(visited: Iterable<FeatureId>): string {
  const set = new Set(visited);
  return ALL_CUBE_FACE_IDS.filter((id) => set.has(id)).join(",");
}
