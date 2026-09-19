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

export function drawCards(
  deck: PlayingCard[],
  count: number,
): { drawn: PlayingCard[]; remaining: PlayingCard[] } {
  const drawn = deck.slice(0, count).map((c) => ({ ...c }));
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

export function dealOpeningLayout(
  shuffled: PlayingCard[],
  playerCount: number,
  rules = STEAL_BUNDLE_RULES,
): {
  deck: PlayingCard[];
  tableCards: PlayingCard[];
  hands: PlayingCard[][];
} {
  let remaining = shuffled.slice();
  const tableDraw = drawCards(remaining, rules.initialTableCards);
  remaining = tableDraw.remaining;
  const tableCards = tableDraw.drawn.map((c) => ({ ...c, faceUp: true }));

  const hands: PlayingCard[][] = [];
  for (let p = 0; p < playerCount; p++) {
    const handDraw = drawCards(remaining, rules.startingHandSize);
    remaining = handDraw.remaining;
    hands.push(handDraw.drawn.map((c) => ({ ...c, faceUp: true })));
  }

  return { deck: remaining, tableCards, hands };
}

export function nextRankInOrder(rank: Rank, rules = STEAL_BUNDLE_RULES): Rank | null {
  const i = rules.rankOrder.indexOf(rank);
  if (i < 0 || i >= rules.rankOrder.length - 1) return null;
  return rules.rankOrder[i + 1]!;
}
