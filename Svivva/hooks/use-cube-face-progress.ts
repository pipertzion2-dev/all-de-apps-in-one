"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import {
  CUBE_FACE_PROGRESS_STORAGE_KEY,
  cubeVisitProgress,
  isCubeJourneyComplete,
  readCubeFaceProgress,
  recordCubeFaceVisit,
  type CubeFaceProgress,
} from "@/lib/cube/cube-face-progress";

const PROGRESS_EVENT = "svivva-cube-face-progress";
const EMPTY_PROGRESS: CubeFaceProgress = { visited: [], updatedAt: "" };

/** React 19 requires getSnapshot to return a stable reference until the store changes. */
let cachedRaw: string | null | undefined;
let cachedSnapshot: CubeFaceProgress = EMPTY_PROGRESS;

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROGRESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
  };
}

function readRawProgress(): string | null {
  try {
    return window.localStorage.getItem(CUBE_FACE_PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): CubeFaceProgress {
  const raw = readRawProgress();
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = raw == null ? EMPTY_PROGRESS : readCubeFaceProgress(window.localStorage);
  return cachedSnapshot;
}

function getServerSnapshot(): CubeFaceProgress {
  return EMPTY_PROGRESS;
}

export function useCubeFaceProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordVisit = useCallback((faceId: FeatureId) => {
    recordCubeFaceVisit(faceId, window.localStorage);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }, []);

  const counts = cubeVisitProgress(progress.visited);

  return {
    visited: progress.visited,
    visitedSet: new Set(progress.visited),
    isComplete: isCubeJourneyComplete(progress.visited),
    visitedCount: counts.visitedCount,
    totalFaces: counts.total,
    recordVisit,
  };
}
