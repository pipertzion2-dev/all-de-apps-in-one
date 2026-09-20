/**
 * Sneak Vision — cleanliness heat map projected onto the ground.
 * GREEN safe · YELLOW maybe · ORANGE dangerous · RED disaster · BLUE wet · PURPLE unknown
 */

import type { ObstacleKind } from "./types";
import type { SubstanceKind } from "./dirt-system";

export type VisionLevel = "safe" | "caution" | "danger" | "disaster" | "wet" | "unknown";

export const VISION_COLORS: Record<VisionLevel, string> = {
  safe: "#3d9b5f",
  caution: "#d4b84a",
  danger: "#d4782a",
  disaster: "#c62828",
  wet: "#3a7ca5",
  unknown: "#7a4db8",
};

export const VISION_HEX_THREE: Record<VisionLevel, number> = {
  safe: 0x3d9b5f,
  caution: 0xd4b84a,
  danger: 0xd4782a,
  disaster: 0xc62828,
  wet: 0x3a7ca5,
  unknown: 0x7a4db8,
};

const OBSTACLE_VISION: Record<ObstacleKind, VisionLevel> = {
  gum: "caution",
  banana: "caution",
  dirt: "caution",
  water: "wet",
  drink: "danger",
  trash: "caution",
  street: "caution",
  grass: "caution",
  bag: "danger",
  debris: "danger",
  poop: "disaster",
  paint: "disaster",
  pothole: "disaster",
  mud: "disaster",
  pedestrian: "danger",
  bike: "danger",
};

export function visionForObstacle(kind: ObstacleKind): VisionLevel {
  return OBSTACLE_VISION[kind] ?? "unknown";
}

export function visionForSubstance(kind: SubstanceKind): VisionLevel {
  switch (kind) {
    case "water":
    case "snow":
      return "wet";
    case "dust":
    case "gum":
    case "dirt":
    case "banana":
      return "caution";
    case "grass":
    case "oil":
    case "food":
    case "drink":
      return "danger";
    case "mud":
    case "paint":
    case "poop":
      return "disaster";
    default:
      return "unknown";
  }
}

export const SNEAK_VISION_DURATION_MS = 2800;
export const SNEAK_VISION_COOLDOWN_MS = 5200;

export type CleanPathKind = "fast" | "safe" | "style";

export type CleanPathOption = {
  kind: CleanPathKind;
  label: string;
  lane: number;
  predictedClean: number;
  blurb: string;
};

/**
 * Suggest Fast / Safe / Style lanes from upcoming obstacles.
 * Experimental nav — projected footprints, not a GPS line.
 */
export function suggestCleanPaths(args: {
  obstacles: { kind: ObstacleKind; lane: number; z: number; hit: boolean }[];
  currentLane: number;
  cleanliness: number;
}): CleanPathOption[] {
  const ahead = args.obstacles.filter((o) => !o.hit && o.z < -2 && o.z > -40);
  const riskByLane = [0, 0, 0];
  const styleByLane = [0, 0, 0];

  for (const o of ahead) {
    const v = visionForObstacle(o.kind);
    const weight =
      v === "disaster" ? 28 : v === "danger" ? 16 : v === "wet" ? 10 : v === "caution" ? 6 : 2;
    const proximity = Math.max(0.35, 1 - Math.abs(o.z) / 40);
    riskByLane[o.lane]! += weight * proximity;
    if (o.kind === "bike" || o.kind === "pedestrian" || o.kind === "bag") {
      styleByLane[o.lane]! += 8 * proximity;
    }
  }

  const safeLane = riskByLane.indexOf(Math.min(...riskByLane));
  const fastLane =
    riskByLane[args.currentLane]! <= riskByLane[1]! + 4 ? args.currentLane : safeLane;
  let styleLane = styleByLane.indexOf(Math.max(...styleByLane));
  if (styleByLane.every((v) => v === 0)) {
    styleLane = (safeLane + 1) % 3;
  }

  const pred = (lane: number, bias: number) =>
    Math.max(40, Math.min(99, Math.round(args.cleanliness - riskByLane[lane]! * 0.55 + bias)));

  return [
    {
      kind: "fast",
      label: "FAST",
      lane: fastLane,
      predictedClean: pred(fastLane, -4),
      blurb: "Straight line. More risk.",
    },
    {
      kind: "safe",
      label: "SAFE",
      lane: safeLane,
      predictedClean: pred(safeLane, 6),
      blurb: "Dry line. Protect the fit.",
    },
    {
      kind: "style",
      label: "STYLE",
      lane: styleLane,
      predictedClean: pred(styleLane, 0),
      blurb: "Trick opportunities.",
    },
  ];
}
