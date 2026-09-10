import { describe, expect, it, beforeEach } from "vitest";
import {
  ALL_CUBE_FACE_IDS,
  CUBE_FACE_PROGRESS_STORAGE_KEY,
  cubeVisitProgress,
  encodeVisitedFacesParam,
  isCubeJourneyComplete,
  parseVisitedFacesParam,
  readCubeFaceProgress,
  recordCubeFaceVisit,
} from "./cube-face-progress";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("cube face progress", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
  });

  it("starts empty", () => {
    expect(readCubeFaceProgress(storage).visited).toEqual([]);
    expect(isCubeJourneyComplete([])).toBe(false);
    expect(cubeVisitProgress([])).toEqual({ visitedCount: 0, total: 6 });
  });

  it("records visits in stable face order", () => {
    recordCubeFaceVisit("orbit", storage);
    recordCubeFaceVisit("play", storage);
    const { visited } = readCubeFaceProgress(storage);
    expect(visited).toEqual(["play", "orbit"]);
  });

  it("completes after all six faces", () => {
    for (const id of ALL_CUBE_FACE_IDS) {
      recordCubeFaceVisit(id, storage);
    }
    const progress = readCubeFaceProgress(storage);
    expect(isCubeJourneyComplete(progress.visited)).toBe(true);
    expect(cubeVisitProgress(progress.visited).visitedCount).toBe(6);
  });

  it("persists to storage key", () => {
    recordCubeFaceVisit("seeds", storage);
    const raw = storage.getItem(CUBE_FACE_PROGRESS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).visited).toContain("seeds");
  });

  it("round-trips visited query param", () => {
    const encoded = encodeVisitedFacesParam(["api", "play", "seeds"]);
    expect(parseVisitedFacesParam(encoded)).toEqual(["play", "seeds", "api"]);
  });

  it("ignores invalid ids in query param", () => {
    expect(parseVisitedFacesParam("play,invalid,seeds")).toEqual(["play", "seeds"]);
  });
});
