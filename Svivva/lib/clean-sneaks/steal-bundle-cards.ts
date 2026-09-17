import { KLEAN_SNEAKS } from "./brand";

/** Card definitions for "Steal the Old Man's Bundle". */

export type StealCardKind = "hazard" | "tactic";

export type StealCard = {
  id: string;
  kind: StealCardKind;
  label: string;
  power: number;
  blurb: string;
};

export const OLD_MAN_HAZARDS: StealCard[] = [
  { id: "mud", kind: "hazard", label: "Mud", power: 2, blurb: "Splashes the toe box." },
  { id: "puddle", kind: "hazard", label: "Puddle", power: 3, blurb: "Soaks the midsole." },
  { id: "crowd", kind: "hazard", label: "Crowd", power: 4, blurb: "Shoulders close in." },
  { id: "weather", kind: "hazard", label: "Weather", power: 5, blurb: "Rain on the balloons." },
  { id: "bag", kind: "hazard", label: "Heavy Bag", power: 6, blurb: "He clutches tighter." },
];

export const PLAYER_TACTICS: StealCard[] = [
  { id: "protect", kind: "tactic", label: "Protect Fit", power: 4, blurb: "Shield the balloons." },
  { id: "dash", kind: "tactic", label: "Dash", power: 5, blurb: "Cut through the lane." },
  { id: "sneak", kind: "tactic", label: "Sneak", power: 6, blurb: "Slip past unnoticed." },
  { id: "clean", kind: "tactic", label: "Quick Klean", power: 7, blurb: "Wipe mid-run." },
  { id: "steal", kind: "tactic", label: "Steal", power: 8, blurb: "Grab the bundle." },
];

export const ROUNDS_TO_WIN = 3;
export const BUNDLE_CARD_COUNT = 8;

export type StealRoundResult = {
  playerCard: StealCard;
  oldManCard: StealCard;
  playerWon: boolean;
  playerStole: boolean;
};

export function pickOldManCard(): StealCard {
  const pool = OLD_MAN_HAZARDS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function resolveStealRound(playerCard: StealCard, oldManCard: StealCard): StealRoundResult {
  const playerWon = playerCard.power >= oldManCard.power;
  return {
    playerCard,
    oldManCard,
    playerWon,
    playerStole: playerWon,
  };
}

export function stealBundleShareText(wins: number): string {
  return `STEAL THE BUNDLE — I stole the old man's bundle ${wins}× on ${KLEAN_SNEAKS.title}. zzaizzai.com/clean-sneaks`;
}
