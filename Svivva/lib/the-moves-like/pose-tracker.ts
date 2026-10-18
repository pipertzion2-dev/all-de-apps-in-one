"use client";

import type { PoseFrame, PoseLandmark } from "./types";

type PoseLandmarkerLike = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { landmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> };
  close?: () => void;
};

let landmarkerPromise: Promise<PoseLandmarkerLike | null> | null = null;

/**
 * Attempt to load MediaPipe Pose Landmarker.
 * Uses optional npm package when present; otherwise returns null so Ghost Mode
 * stays in guidance-only mode (video sync, no fabricated match scores).
 */
export async function loadPoseLandmarker(): Promise<PoseLandmarkerLike | null> {
  if (typeof window === "undefined") return null;
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    try {
      // Dynamic require of optional dependency — do not hard-fail the app bundle.
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
      );
      const opts = {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU" as const,
        },
        runningMode: "VIDEO" as const,
        numPoses: 1,
      };
      try {
        return (await vision.PoseLandmarker.createFromOptions(fileset, opts)) as PoseLandmarkerLike;
      } catch {
        return (await vision.PoseLandmarker.createFromOptions(fileset, {
          ...opts,
          baseOptions: { ...opts.baseOptions, delegate: "CPU" },
        })) as PoseLandmarkerLike;
      }
    } catch {
      return null;
    }
  })();

  return landmarkerPromise;
}

export function detectPoseFrame(
  landmarker: PoseLandmarkerLike,
  video: HTMLVideoElement,
  timestampMs: number,
): PoseFrame {
  try {
    const result = landmarker.detectForVideo(video, timestampMs);
    const raw = result.landmarks?.[0];
    if (!raw?.length) {
      return { timestampMs, landmarks: [], source: "none" };
    }
    const landmarks: PoseLandmark[] = raw.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      visibility: p.visibility,
    }));
    return { timestampMs, landmarks, source: "mediapipe" };
  } catch {
    return { timestampMs, landmarks: [], source: "none" };
  }
}

/** Mean visibility of detected landmarks — not an accuracy / match score. */
export function poseCoverage(frame: PoseFrame): number | null {
  if (frame.source !== "mediapipe" || frame.landmarks.length === 0) return null;
  const vals = frame.landmarks
    .map((l) => l.visibility)
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Compare two pose frames with simple joint distance — only when both are measured. */
export function meanJointDistance(
  a: PoseFrame,
  b: PoseFrame,
): { distance: number; measured: true } | { distance: null; measured: false; reason: string } {
  if (a.source !== "mediapipe" || b.source !== "mediapipe") {
    return {
      distance: null,
      measured: false,
      reason: "Both streams need live MediaPipe landmarks before comparison is shown.",
    };
  }
  const n = Math.min(a.landmarks.length, b.landmarks.length);
  if (n < 10) {
    return {
      distance: null,
      measured: false,
      reason: "Not enough landmarks detected for a reliable comparison.",
    };
  }
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const pa = a.landmarks[i]!;
    const pb = b.landmarks[i]!;
    const dx = pa.x - pb.x;
    const dy = pa.y - pb.y;
    const dz = (pa.z ?? 0) - (pb.z ?? 0);
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return { distance: sum / n, measured: true };
}

export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];
