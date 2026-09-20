import { STEAL_BUNDLE_RULES } from "./rules";
import { RANKS, SUITS, type PlayingCard, type Rank, type Suit } from "./types";

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOL[suit];
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

/** Build a standard 52-card deck, face-down in new-deck order. */
export function createDeck(): PlayingCard[] {
  const cards: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${rank}-${suit}`,
        rank,
        suit,
        faceUp: false,
      });
    }
  }
  return cards;
}

/** Fisher–Yates. Pass a rng for deterministic tests. */
export function shuffleDeck(deck: PlayingCard[], rng: () => number = Math.random): PlayingCard[] {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function assertStandardDeck(deck: PlayingCard[]): void {
  if (deck.length !== 52) {
    throw new Error(`Expected 52 cards, got ${deck.length}`);
  }
  const seen = new Set<string>();
  for (const c of deck) {
    if (seen.has(c.id)) throw new Error(`Duplicate card: ${c.id}`);
    seen.add(c.id);
  }
}

/**
 * Take the top `count` cards from the stock (index 0 = top of the face-down pile).
 * Does not mutate the input array.
 */
export function drawCards(
  deck: PlayingCard[],
  count: number,
): { drawn: PlayingCard[]; remaining: PlayingCard[] } {
  const n = Math.max(0, Math.min(count, deck.length));
  const drawn = deck.slice(0, n).map((c) => ({ ...c }));
  const remaining = deck.slice(n);
  return { drawn, remaining };
}

/** One physical card taken from the top of the shuffled stock. */
export type DealStep =
  | { kind: "hand"; playerIndex: number; card: PlayingCard }
  | { kind: "table"; card: PlayingCard };

/**
 * Plan a real-dealer opening: shuffle is already done; this only peels from the top.
 * Order: round-robin one card to each player until hands are full, then flip table cards.
 */
export function planOpeningDeal(
  shuffled: PlayingCard[],
  playerCount: number,
  rules = STEAL_BUNDLE_RULES,
): { steps: DealStep[]; remaining: PlayingCard[] } {
  let stock = shuffled.slice();
  const steps: DealStep[] = [];

  for (let round = 0; round < rules.startingHandSize; round++) {
    for (let p = 0; p < playerCount; p++) {
      const { drawn, remaining } = drawCards(stock, 1);
      const card = drawn[0];
      if (!card) break;
      stock = remaining;
      steps.push({
        kind: "hand",
        playerIndex: p,
        card: { ...card, faceUp: true },
      });
    }
  }

  for (let t = 0; t < rules.initialTableCards; t++) {
    const { drawn, remaining } = drawCards(stock, 1);
    const card = drawn[0];
    if (!card) break;
    stock = remaining;
    steps.push({
      kind: "table",
      card: { ...card, faceUp: true },
    });
  }

  return { steps, remaining: stock };
}

/** Apply planned steps to produce the opening layout (same end state as animated deal). */
export function dealOpeningLayout(
  shuffled: PlayingCard[],
  playerCount: number,
  rules = STEAL_BUNDLE_RULES,
): {
  deck: PlayingCard[];
  tableCards: PlayingCard[];
  hands: PlayingCard[][];
  steps: DealStep[];
} {
  const { steps, remaining } = planOpeningDeal(shuffled, playerCount, rules);
  const hands: PlayingCard[][] = Array.from({ length: playerCount }, () => []);
  const tableCards: PlayingCard[] = [];

  for (const step of steps) {
    if (step.kind === "hand") {
      hands[step.playerIndex]?.push({ ...step.card });
    } else {
      tableCards.push({ ...step.card });
    }
  }

  return { deck: remaining, tableCards, hands, steps };
}

export function nextRankInOrder(rank: Rank, rules = STEAL_BUNDLE_RULES): Rank | null {
  const i = rules.rankOrder.indexOf(rank);
  if (i < 0 || i >= rules.rankOrder.length - 1) return null;
  return rules.rankOrder[i + 1]!;
}
