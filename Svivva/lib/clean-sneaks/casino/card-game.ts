import {
  advanceTurn,
  applyMove,
  determineWinners,
  listLegalMoves,
  refillHandFromDeck,
  shouldEndGame,
} from "./card-game-rules";
import {
  assertStandardDeck,
  createDeck,
  dealOpeningLayout,
  planOpeningDeal,
  shuffleDeck,
  type DealStep,
} from "./deck";
import { STEAL_BUNDLE_RULES } from "./rules";
import type { CardGameState, CardPlayer, PlayMove, PlayingCard } from "./types";

export type { DealStep };

export function createEmptyCardGameState(): CardGameState {
  return {
    deck: [],
    tableCards: [],
    players: [],
    currentPlayerIndex: 0,
    selectedCardId: null,
    phase: "setup",
    winnerIds: [],
    lastEvent: null,
    turnNumber: 0,
  };
}

export function buildPlayers(count: 2 | 3): CardPlayer[] {
  const names = count === 2 ? ["Player 1", "Player 2"] : ["Player 1", "Player 2", "Player 3"];
  return names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    isHuman: i === 0,
    hand: [],
    bundle: [],
    bundleMatchRank: null,
  }));
}

/**
 * Shuffle a fresh 52-card deck and return the dealing phase with an empty table/hands.
 * Cards are still in `deck` (top = index 0); apply `DealStep`s one at a time like a real dealer.
 */
export function beginCardGameDeal(
  playerCount: 2 | 3,
  rng: () => number = Math.random,
): { state: CardGameState; steps: DealStep[] } {
  const raw = createDeck();
  assertStandardDeck(raw);
  const shuffled = shuffleDeck(raw, rng);
  const { steps } = planOpeningDeal(shuffled, playerCount, STEAL_BUNDLE_RULES);

  return {
    state: {
      deck: shuffled.map((c) => ({ ...c, faceUp: false })),
      tableCards: [],
      players: buildPlayers(playerCount),
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "dealing",
      winnerIds: [],
      lastEvent: "Shuffling a fresh deck…",
      turnNumber: 0,
    },
    steps,
  };
}

/** Peel one planned card from the top of the stock into a hand or the table. */
export function applyDealStep(state: CardGameState, step: DealStep): CardGameState {
  if (state.phase !== "dealing" && state.phase !== "setup") return state;
  if (state.deck.length === 0) return state;

  const [top, ...rest] = state.deck;
  if (!top || top.id !== step.card.id) {
    // Still apply by id if the stock was reordered — find the planned card.
    const idx = state.deck.findIndex((c) => c.id === step.card.id);
    if (idx < 0) return state;
    const card = state.deck[idx]!;
    const deck = [...state.deck.slice(0, idx), ...state.deck.slice(idx + 1)];
    return placeDealtCard({ ...state, deck }, step, { ...card, faceUp: true });
  }

  return placeDealtCard({ ...state, deck: rest }, step, { ...top, faceUp: true });
}

function placeDealtCard(state: CardGameState, step: DealStep, card: PlayingCard): CardGameState {
  if (step.kind === "table") {
    return {
      ...state,
      tableCards: [...state.tableCards, card],
      lastEvent: `Flipped ${card.rank} onto the table.`,
    };
  }

  const players = state.players.map((p, i) => {
    if (i !== step.playerIndex) return p;
    return { ...p, hand: [...p.hand, card] };
  });
  const seat = players[step.playerIndex];
  return {
    ...state,
    players,
    lastEvent: `Dealt to ${seat?.name ?? `seat ${step.playerIndex + 1}`}.`,
  };
}

export function finishDealing(state: CardGameState): CardGameState {
  return {
    ...state,
    phase: "playing",
    turnNumber: 1,
    selectedCardId: null,
    lastEvent: "Cards dealt. Match by rank — biggest bundle wins.",
  };
}

/** Pure setup — instantly dealt end state (tests / skip animation). */
export function startCardGame(playerCount: 2 | 3, rng: () => number = Math.random): CardGameState {
  const raw = createDeck();
  assertStandardDeck(raw);
  const shuffled = shuffleDeck(raw, rng);
  const dealt = dealOpeningLayout(shuffled, playerCount, STEAL_BUNDLE_RULES);
  const players = buildPlayers(playerCount).map((p, i) => ({
    ...p,
    hand: dealt.hands[i] ?? [],
  }));

  return {
    deck: dealt.deck.map((c) => ({ ...c, faceUp: false })),
    tableCards: dealt.tableCards,
    players,
    currentPlayerIndex: 0,
    selectedCardId: null,
    phase: "playing",
    winnerIds: [],
    lastEvent: "Cards dealt. Match by rank — biggest bundle wins.",
    turnNumber: 1,
  };
}

export function selectHandCard(state: CardGameState, cardId: string | null): CardGameState {
  if (state.phase !== "playing") return state;
  const current = state.players[state.currentPlayerIndex];
  if (!current?.isHuman) return state;
  if (cardId && !current.hand.some((c) => c.id === cardId)) return state;
  return { ...state, selectedCardId: cardId };
}

export function tryHumanPlay(
  state: CardGameState,
  move: PlayMove,
): { ok: true; state: CardGameState } | { ok: false; reason: string } {
  if (state.phase !== "playing") return { ok: false, reason: "Not playing." };
  const current = state.players[state.currentPlayerIndex];
  if (!current?.isHuman) return { ok: false, reason: "Not your turn." };

  const next = applyMove(state, current.id, move, STEAL_BUNDLE_RULES);
  if (!next) return { ok: false, reason: "Illegal move." };

  return { ok: true, state: finalizeAfterMove(next) };
}

export function applyAiMove(state: CardGameState, move: PlayMove): CardGameState | null {
  if (state.phase !== "playing") return null;
  const current = state.players[state.currentPlayerIndex];
  if (!current || current.isHuman) return null;
  const next = applyMove(state, current.id, move, STEAL_BUNDLE_RULES);
  if (!next) return null;
  return finalizeAfterMove(next);
}

/**
 * Recover when the computer seat has no legal move (empty hand / soft-lock).
 * Refills from the deck when possible; otherwise advances to the next seat.
 */
export function passStuckTurn(state: CardGameState): CardGameState {
  if (state.phase !== "playing") return state;
  const current = state.players[state.currentPlayerIndex];
  if (!current) return state;

  let next = refillHandFromDeck(state, current.id);
  if (listLegalMoves(next, current.id).length > 0) {
    return {
      ...next,
      lastEvent: `${current.name} drew up to continue.`,
    };
  }

  return settleAfterAdvance(
    advanceTurn({
      ...next,
      selectedCardId: null,
      lastEvent: `${current.name} had no move — turn passed.`,
    }),
  );
}

function finalizeAfterMove(state: CardGameState): CardGameState {
  let next: CardGameState = { ...state, selectedCardId: null };

  // After a play, if hand empty and deck remains, top up for current player.
  const cur = next.players[next.currentPlayerIndex];
  if (cur) {
    next = refillHandFromDeck(next, cur.id);
  }

  if (shouldEndGame(next)) {
    const { winnerIds } = determineWinners(next.players);
    return {
      ...next,
      phase: "results",
      winnerIds,
      lastEvent: "FINAL COUNT",
    };
  }

  return settleAfterAdvance(advanceTurn(next));
}

/** Refill the upcoming seat and skip seats that still cannot act. */
function settleAfterAdvance(state: CardGameState): CardGameState {
  let next = state;
  const upcoming = next.players[next.currentPlayerIndex];
  if (upcoming) {
    next = refillHandFromDeck(next, upcoming.id);
  }

  let guard = 0;
  while (guard++ < next.players.length + 2) {
    if (shouldEndGame(next)) {
      const { winnerIds } = determineWinners(next.players);
      return { ...next, phase: "results", winnerIds, lastEvent: "FINAL COUNT" };
    }
    const p = next.players[next.currentPlayerIndex];
    if (!p) break;
    next = refillHandFromDeck(next, p.id);
    const moves = listLegalMoves(next, p.id);
    if (moves.length > 0 || next.deck.length > 0) break;
    // No moves and no refill — skip
    if (p.hand.length === 0) {
      next = advanceTurn(next);
      continue;
    }
    break;
  }

  return next;
}

export function currentPlayer(state: CardGameState): CardPlayer | null {
  return state.players[state.currentPlayerIndex] ?? null;
}
