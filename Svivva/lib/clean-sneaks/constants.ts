import type { ObstacleKind, PowerUpKind } from "./types";

export const LANES = 3;

export const OBSTACLE_META: Record<
  ObstacleKind,
  { label: string; color: string; w: number; h: number; jumpable: boolean }
> = {
  mud: { label: "MUD", color: "#5c4033", w: 56, h: 22, jumpable: true },
  water: { label: "SPLASH", color: "#3a7ca5", w: 52, h: 18, jumpable: true },
  drink: { label: "SPILL", color: "#c45c26", w: 36, h: 20, jumpable: true },
  trash: { label: "TRASH", color: "#6b7280", w: 40, h: 28, jumpable: true },
  gum: { label: "GUM", color: "#ff5aaa", w: 40, h: 18, jumpable: true },
  dirt: { label: "DIRT", color: "#8a5a32", w: 48, h: 20, jumpable: true },
  poop: { label: "POOP", color: "#6b3a18", w: 42, h: 24, jumpable: true },
  banana: { label: "BANANA", color: "#ffd84a", w: 46, h: 18, jumpable: true },
  paint: { label: "PAINT", color: "#5b8da8", w: 48, h: 16, jumpable: true },
  debris: { label: "DEBRIS", color: "#8b7355", w: 44, h: 26, jumpable: false },
  grass: { label: "MUDDY", color: "#3d5c3a", w: 50, h: 20, jumpable: true },
  pothole: { label: "HOLE", color: "#1a1a1a", w: 48, h: 18, jumpable: true },
  bag: { label: "BAG", color: "#2d3748", w: 36, h: 32, jumpable: false },
  street: { label: "MESS", color: "#4a5568", w: 42, h: 22, jumpable: true },
  pedestrian: { label: "PPL", color: "#c4b8a8", w: 28, h: 48, jumpable: false },
  bike: { label: "BIKE", color: "#7ec8d9", w: 48, h: 34, jumpable: false },
};

export const POWERUP_META: Record<
  PowerUpKind,
  { label: string; color: string; durationMs: number; cleanRestore?: number }
> = {
  shield: { label: "SHOE SHIELD", color: "#5B8DA8", durationMs: 4500 },
  quickClean: { label: "QUICK CLEAN", color: "#7EC8D9", durationMs: 0, cleanRestore: 18 },
  freshKicks: { label: "FRESH KICKS", color: "#D94F9C", durationMs: 5000 },
  perfectStep: { label: "PERFECT STEP", color: "#e8e8ec", durationMs: 2800 },
};

export const ALL_OBSTACLES: ObstacleKind[] = [
  "mud",
  "water",
  "drink",
  "trash",
  "gum",
  "dirt",
  "poop",
  "banana",
  "paint",
  "debris",
  "grass",
  "pothole",
  "bag",
  "street",
  "pedestrian",
  "bike",
];

/** Street trash that sticks to the sole — spawn these often. */
export const STICKY_STREET_OBSTACLES: ObstacleKind[] = ["dirt", "poop", "banana", "gum"];

export const ALL_POWERUPS: PowerUpKind[] = ["shield", "quickClean", "freshKicks", "perfectStep"];
