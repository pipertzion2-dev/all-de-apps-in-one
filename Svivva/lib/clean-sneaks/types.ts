import type { SneakerArchetypeId } from "./sneaker-catalog";
import type { ContaminationEvent, DirtZone, ShoeCondition, ShoeSide } from "./dirt-system";
import type { CleanPathOption } from "./sneak-vision";
import type { OhNoAction, OhNoWindow, WalkStyleId, WeatherId } from "./contact-map";

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

export type GamePhase = "idle" | "countdown" | "running" | "over";

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
  /** Gameplay personality */
  archetype?: SneakerArchetypeId;
}

export interface RunStats {
  score: number;
  distance: number;
  cleanliness: number;
  leftClean: number;
  rightClean: number;
  cleanLabel: CleanLabel;
  streak: number;
  streakLabel: string;
  bestScore: number;
  closeCalls: number;
  styleScore: number;
  creases: number;
  weather: WeatherId;
  walkStyle: WalkStyleId;
  sneakVisionActive: boolean;
  cleanChain: number;
}

export interface GameOverPayload extends RunStats {
  finalCleanliness: number;
  maxStreak: number;
  maxCleanChain: number;
  left: ShoeCondition;
  right: ShoeCondition;
  contaminations: ContaminationEvent[];
  worstHit: ContaminationEvent | null;
  perfectClean: boolean;
  conditionScore: number;
}

export type HudShoeSnapshot = {
  side: ShoeSide;
  cleanliness: number;
  zones: Record<DirtZone, { amount: number; wetness: number; color: string | null }>;
  creases: number;
  scuffs: number;
};

export type EngineUiSnapshot = {
  paths: CleanPathOption[] | null;
  ohNo: OhNoWindow | null;
  weatherLabel: string;
  npcLine: string | null;
};

export type { ContaminationEvent, DirtZone, ShoeCondition, ShoeSide, CleanPathOption };
export type { OhNoAction, OhNoWindow, WalkStyleId, WeatherId, SneakerArchetypeId };
