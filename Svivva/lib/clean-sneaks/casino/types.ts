/** Shared types for Steal the Old Man's Bundle + casino flow. */

export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = (typeof RANKS)[number];

export type PlayingCard = {
  id: string;
  rank: Rank;
  suit: Suit;
  /** Face-up on table / in hand when human. */
  faceUp: boolean;
};

export type CardPlayer = {
  id: string;
  name: string;
  isHuman: boolean;
  hand: PlayingCard[];
  bundle: PlayingCard[];
  /** Exposed/top rank associated with this player's bundle for stealing. */
  bundleMatchRank: Rank | null;
};

export type CardGamePhase =
  | "setup"
  | "tutorial"
  | "playerCount"
  | "dealing"
  | "playing"
  | "animating"
  | "results";

export type CardGameState = {
  deck: PlayingCard[];
  tableCards: PlayingCard[];
  players: CardPlayer[];
  currentPlayerIndex: number;
  selectedCardId: string | null;
  phase: CardGamePhase;
  winnerIds: string[];
  lastEvent: string | null;
  turnNumber: number;
};

export type SessionCasinoState = {
  walkingScore: number;
  walkingDistance: number;
  /** Spendable casino chips — earned from walking score. */
  credits: number;
  casinoUnlocked: boolean;
  scoreAccepted: boolean;
  cardGamesPlayed: number;
  cardGamesWon: number;
};

/** High-level experience states spanning walk → casino → cards. */
export type ExperienceState =
  | "WALKING"
  | "WALK_COMPLETE"
  | "CASINO_APPROACH"
  | "CASINO_CHECK_IN"
  | "CASINO_ENTERING"
  | "CASINO_LOBBY"
  | "CARD_GAME_SETUP"
  | "CARD_GAME_DEALING"
  | "CARD_GAME_PLAYING"
  | "CARD_GAME_RESULTS";

export type PlayMove =
  | { type: "matchTable"; handCardId: string; tableCardId: string }
  | { type: "stealBundle"; handCardId: string; targetPlayerId: string }
  | { type: "dropToTable"; handCardId: string };

export type AudioCue =
  | "walking_complete"
  | "casino_ambience"
  | "casino_door"
  | "card_shuffle"
  | "card_deal"
  | "card_flip"
  | "card_match"
  | "bundle_collect"
  | "bundle_steal"
  | "invalid_move"
  | "victory";
