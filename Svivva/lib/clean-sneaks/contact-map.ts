/**
 * Map runner obstacles → dirt substances + contact profiles.
 */

import type { ObstacleKind } from "./types";
import type { DirtZone, ShoeSide, SubstanceKind } from "./dirt-system";

export type ContactProfile = {
  substance: SubstanceKind;
  intensity: number;
  splash: boolean;
  /** Prefer dirtying this shoe; null = both / random */
  preferShoe: ShoeSide | "both" | null;
  zones?: DirtZone[];
  jumpable: boolean;
  canScuff: boolean;
  /** Close-call radius in world Z for near-miss scoring */
  closeCallPad: number;
};

export const OBSTACLE_CONTACT: Record<ObstacleKind, ContactProfile> = {
  mud: {
    substance: "mud",
    intensity: 1.2,
    splash: false,
    preferShoe: "both",
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.85,
  },
  water: {
    substance: "water",
    intensity: 0.9,
    splash: true,
    preferShoe: "both",
    jumpable: true,
    canScuff: false,
    closeCallPad: 1.0,
  },
  drink: {
    substance: "drink",
    intensity: 1.0,
    splash: true,
    preferShoe: null,
    zones: ["toeBox", "laces", "midsole"],
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.9,
  },
  trash: {
    substance: "food",
    intensity: 0.85,
    splash: false,
    preferShoe: null,
    jumpable: true,
    canScuff: true,
    closeCallPad: 0.75,
  },
  gum: {
    substance: "gum",
    intensity: 1.0,
    splash: false,
    preferShoe: null,
    zones: ["outsole"],
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.7,
  },
  paint: {
    substance: "paint",
    intensity: 1.35,
    splash: false,
    preferShoe: "both",
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.95,
  },
  debris: {
    substance: "dust",
    intensity: 1.1,
    splash: false,
    preferShoe: "both",
    jumpable: false,
    canScuff: true,
    closeCallPad: 0.8,
  },
  grass: {
    substance: "grass",
    intensity: 1.0,
    splash: false,
    preferShoe: "both",
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.85,
  },
  pothole: {
    substance: "mud",
    intensity: 1.4,
    splash: true,
    preferShoe: "both",
    jumpable: true,
    canScuff: true,
    closeCallPad: 1.05,
  },
  bag: {
    substance: "dust",
    intensity: 0.7,
    splash: false,
    preferShoe: null,
    jumpable: false,
    canScuff: true,
    closeCallPad: 0.75,
  },
  street: {
    substance: "oil",
    intensity: 0.95,
    splash: false,
    preferShoe: "both",
    jumpable: true,
    canScuff: false,
    closeCallPad: 0.8,
  },
  pedestrian: {
    substance: "dust",
    intensity: 0.9,
    splash: false,
    preferShoe: null,
    zones: ["toeBox", "tongue", "laces"],
    jumpable: false,
    canScuff: true,
    closeCallPad: 0.9,
  },
  bike: {
    substance: "water",
    intensity: 0.75,
    splash: true,
    preferShoe: "both",
    jumpable: false,
    canScuff: true,
    closeCallPad: 1.0,
  },
};

export function contactForObstacle(kind: ObstacleKind): ContactProfile {
  return OBSTACLE_CONTACT[kind];
}

export type WeatherId = "clear" | "rain" | "storm";

export type WeatherState = {
  id: WeatherId;
  label: string;
  /** Extra water/mud spawn weight */
  wetBias: number;
  speedMul: number;
  visionDim: number;
};

export const WEATHER: Record<WeatherId, WeatherState> = {
  clear: { id: "clear", label: "CLEAR", wetBias: 0, speedMul: 1, visionDim: 0 },
  rain: { id: "rain", label: "RAIN", wetBias: 0.55, speedMul: 0.96, visionDim: 0.15 },
  storm: { id: "storm", label: "STORM", wetBias: 0.9, speedMul: 0.9, visionDim: 0.3 },
};

export function pickWeatherWeighted(distance: number): WeatherId {
  if (distance < 40) return "clear";
  if (distance < 100) return Math.random() < 0.22 ? "rain" : "clear";
  if (Math.random() < 0.12) return "storm";
  if (Math.random() < 0.35) return "rain";
  return "clear";
}

export type WalkStyleId = "normal" | "tiptoe" | "creaseWalk" | "heelWalk" | "wideStep" | "sideStep";

export type WalkStyle = {
  id: WalkStyleId;
  label: string;
  speedMul: number;
  creaseMul: number;
  balanceHard: number;
};

export const WALK_STYLES: Record<WalkStyleId, WalkStyle> = {
  normal: { id: "normal", label: "WALK", speedMul: 1, creaseMul: 1, balanceHard: 0 },
  tiptoe: { id: "tiptoe", label: "TIPTOE", speedMul: 0.72, creaseMul: 0.35, balanceHard: 0.4 },
  creaseWalk: {
    id: "creaseWalk",
    label: "STIFF",
    speedMul: 0.58,
    creaseMul: 0.08,
    balanceHard: 0.7,
  },
  heelWalk: {
    id: "heelWalk",
    label: "HEEL",
    speedMul: 0.65,
    creaseMul: 0.25,
    balanceHard: 0.55,
  },
  wideStep: {
    id: "wideStep",
    label: "WIDE",
    speedMul: 0.85,
    creaseMul: 0.7,
    balanceHard: 0.25,
  },
  sideStep: {
    id: "sideStep",
    label: "SIDE",
    speedMul: 0.78,
    creaseMul: 0.5,
    balanceHard: 0.35,
  },
};

export type OhNoAction = "liftFoot" | "twist" | "hop" | "kickAway" | "sacrificeOther" | "block";

export const OH_NO_ACTIONS: { id: OhNoAction; label: string; key: string }[] = [
  { id: "liftFoot", label: "LIFT", key: "1" },
  { id: "twist", label: "TWIST", key: "2" },
  { id: "hop", label: "HOP", key: "3" },
  { id: "kickAway", label: "KICK", key: "4" },
  { id: "sacrificeOther", label: "SACRIFICE", key: "5" },
  { id: "block", label: "BLOCK", key: "6" },
];

export type OhNoWindow = {
  active: boolean;
  obstacleId: number;
  shoe: ShoeSide;
  startedAt: number;
  endsAt: number;
  correctAction: OhNoAction;
  resolved: boolean;
};

export function pickOhNoAction(): OhNoAction {
  const list = OH_NO_ACTIONS;
  return list[Math.floor(Math.random() * list.length)]!.id;
}
