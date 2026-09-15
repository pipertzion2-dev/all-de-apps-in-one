export type CleanLabel = "FRESH" | "CLEAN" | "GETTING DIRTY" | "DIRTY" | "FILTHY" | "COOKED";

export type ObstacleKind =
  | "mud"
  | "water"
  | "drink"
  | "trash"
  | "gum"
  | "paint"
  | "debris"
  | "grass"
  | "pothole"
  | "bag"
  | "street"
  | "pedestrian"
  | "bike";

export type PowerUpKind = "shield" | "quickClean" | "freshKicks" | "perfectStep";

export type GamePhase = "idle" | "logo" | "countdown" | "running" | "over";

export interface SneakerAssetRef {
  /** Public URL or data URL for the 2D side sprite */
  spriteUrl: string;
  /** Draw animated walking sneaker pair instead of a flat sprite (default gameplay). */
  useWalkingSprite?: boolean;
  /** Optional future Three.js / GLB path */
  modelUrl?: string;
  /** Display name for HUD / share */
  label?: string;
  /** Source: default pack, user design, AI, etc. */
  source?: "default" | "user" | "ai" | "unlock";
}

export interface RunStats {
  score: number;
  distance: number;
  cleanliness: number;
  cleanLabel: CleanLabel;
  streak: number;
  streakLabel: string;
  bestScore: number;
}

export interface GameOverPayload extends RunStats {
  finalCleanliness: number;
  maxStreak: number;
}
