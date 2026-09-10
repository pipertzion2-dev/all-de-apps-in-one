"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import {
  cubeVisitProgress,
  isCubeJourneyComplete,
  readCubeFaceProgress,
  recordCubeFaceVisit,
  type CubeFaceProgress,
} from "@/lib/cube/cube-face-progress";

const PROGRESS_EVENT = "svivva-cube-face-progress";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROGRESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
  };
}

function getSnapshot(): CubeFaceProgress {
  return readCubeFaceProgress(window.localStorage);
}

function getServerSnapshot(): CubeFaceProgress {
  return { visited: [], updatedAt: "" };
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
