"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import {
  cubeVisitProgress,
  isCubeJourneyComplete,
  readCubeFaceProgress,
  recordCubeFaceVisit,
  type CubeFaceProgress,
} from "@/lib/cube/cube-face-progress";

const PROGRESS_EVENT = "svivva-cube-face-progress";
const EMPTY_PROGRESS: CubeFaceProgress = { visited: [], updatedAt: "" };

export function useCubeFaceProgress() {
  const [progress, setProgress] = useState<CubeFaceProgress>(EMPTY_PROGRESS);

  useEffect(() => {
    setProgress(readCubeFaceProgress(window.localStorage));

    const sync = () => setProgress(readCubeFaceProgress(window.localStorage));
    window.addEventListener("storage", sync);
    window.addEventListener(PROGRESS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROGRESS_EVENT, sync);
    };
  }, []);

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
