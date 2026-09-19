import { canStealBundle, ranksMatch, STEAL_BUNDLE_RULES, type StealBundleRules } from "./rules";
import type { CardGameState, CardPlayer, PlayMove, PlayingCard, Rank } from "./types";

export function getBundleTopRank(bundle: PlayingCard[]): Rank | null {
  if (bundle.length === 0) return null;
  return bundle[bundle.length - 1]!.rank;
}

export function stealBundle(
  state: CardGameState,
  thiefId: string,
  victimId: string,
  playedCard: PlayingCard,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): CardGameState {
  if (!rules.allowBundleStealing) return state;
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.slice(),
    bundle: p.bundle.slice(),
  }));
  const thief = players.find((p) => p.id === thiefId);
  const victim = players.find((p) => p.id === victimId);
  if (!thief || !victim) return state;
  if (!canStealBundle(playedCard.rank, victim.bundleMatchRank, victim.bundle.length, rules)) {
    return state;
  }

  const stolen = victim.bundle.slice();
  victim.bundle = [];
  victim.bundleMatchRank = null;
  thief.bundle = [...thief.bundle, ...stolen, playedCard];
  thief.bundleMatchRank = playedCard.rank;
  thief.hand = thief.hand.filter((c) => c.id !== playedCard.id);

  return {
    ...state,
    players,
    lastEvent: `BUNDLE STOLEN! ${thief.name} took ${victim.name}'s stack.`,
  };
}

export function matchTableCard(
  state: CardGameState,
  playerId: string,
  handCardId: string,
  tableCardId: string,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): CardGameState | null {
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.slice(),
    bundle: p.bundle.slice(),
  }));
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;
  const handCard = player.hand.find((c) => c.id === handCardId);
  const tableCard = state.tableCards.find((c) => c.id === tableCardId);
  if (!handCard || !tableCard) return null;
  if (!ranksMatch(handCard.rank, tableCard.rank, rules)) return null;

  player.hand = player.hand.filter((c) => c.id !== handCardId);
  player.bundle = [...player.bundle, tableCard, handCard];
  player.bundleMatchRank = handCard.rank;

  return {
    ...state,
    players,
    tableCards: state.tableCards.filter((c) => c.id !== tableCardId),
    lastEvent: `${player.name} matched ${handCard.rank}s.`,
  };
}

export function dropCardToTable(
  state: CardGameState,
  playerId: string,
  handCardId: string,
): CardGameState | null {
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.slice(),
    bundle: p.bundle.slice(),
  }));
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;
  const handCard = player.hand.find((c) => c.id === handCardId);
  if (!handCard) return null;

  // Only allow drop when no legal match or steal exists for this card…
  // Caller should validate with listLegalMoves; here we enforce per-card drop legality.
  player.hand = player.hand.filter((c) => c.id !== handCardId);
  const placed = { ...handCard, faceUp: true };

  return {
    ...state,
    players,
    tableCards: [...state.tableCards, placed],
    lastEvent: `${player.name} placed a ${handCard.rank} on the table.`,
  };
}

export function listLegalMoves(
  state: CardGameState,
  playerId: string,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): PlayMove[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  const moves: PlayMove[] = [];

  for (const handCard of player.hand) {
    for (const tableCard of state.tableCards) {
      if (ranksMatch(handCard.rank, tableCard.rank, rules)) {
        moves.push({
          type: "matchTable",
          handCardId: handCard.id,
          tableCardId: tableCard.id,
        });
      }
    }
    for (const other of state.players) {
      if (other.id === playerId) continue;
      if (canStealBundle(handCard.rank, other.bundleMatchRank, other.bundle.length, rules)) {
        moves.push({
          type: "stealBundle",
          handCardId: handCard.id,
          targetPlayerId: other.id,
        });
      }
    }
  }

  // Drop allowed when that hand card has no match and no steal.
  for (const handCard of player.hand) {
    const hasAction = moves.some((m) => m.handCardId === handCard.id);
    if (!hasAction) {
      moves.push({ type: "dropToTable", handCardId: handCard.id });
    }
  }

  return moves;
}

export function playerHasAnyLegalMatchOrSteal(
  state: CardGameState,
  playerId: string,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): boolean {
  return listLegalMoves(state, playerId, rules).some(
    (m) => m.type === "matchTable" || m.type === "stealBundle",
  );
}

export function refillHandFromDeck(
  state: CardGameState,
  playerId: string,
  targetSize: number = STEAL_BUNDLE_RULES.startingHandSize,
): CardGameState {
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.slice(),
    bundle: p.bundle.slice(),
  }));
  const player = players.find((p) => p.id === playerId);
  if (!player) return state;
  const need = Math.max(0, targetSize - player.hand.length);
  if (need === 0 || state.deck.length === 0) return state;
  const take = Math.min(need, state.deck.length);
  const drawn = state.deck.slice(0, take).map((c) => ({ ...c, faceUp: true }));
  const deck = state.deck.slice(take);
  player.hand = [...player.hand, ...drawn];
  return { ...state, players, deck };
}

export function advanceTurn(state: CardGameState): CardGameState {
  const next = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...state,
    currentPlayerIndex: next,
    selectedCardId: null,
    turnNumber: state.turnNumber + 1,
  };
}

export function isGameExhausted(state: CardGameState, rules = STEAL_BUNDLE_RULES): boolean {
  if (state.deck.length > 0) return false;
  // Continue while any player has cards and any legal match/steal/drop exists.
  for (const p of state.players) {
    if (p.hand.length === 0) continue;
    const moves = listLegalMoves(state, p.id, rules);
    if (moves.length > 0) return false;
  }
  // Also end when nobody has cards left.
  const anyHand = state.players.some((p) => p.hand.length > 0);
  if (!anyHand && state.deck.length === 0) return true;
  // Stuck: no hands with moves, deck empty.
  return true;
}

/**
 * End when deck empty AND no player can make a match/steal,
 * and remaining drops cannot create further playable chains in a practical sense.
 * Spec: "until there are no more cards or matches left on the table/deck."
 */
export function shouldEndGame(state: CardGameState, rules = STEAL_BUNDLE_RULES): boolean {
  if (state.deck.length > 0) {
    // Still cards to deal into hands — keep going if anyone needs a refill next turn.
    const anyoneNeedsCards = state.players.some(
      (p) => p.hand.length < rules.startingHandSize || p.hand.length > 0,
    );
    if (anyoneNeedsCards) {
      // Only end early if every hand empty and nobody can play — rare mid-deck.
      const allEmpty = state.players.every((p) => p.hand.length === 0);
      if (!allEmpty) return false;
    }
  }

  const anyPlayable = state.players.some((p) => {
    if (p.hand.length === 0) return false;
    return listLegalMoves(state, p.id, rules).length > 0;
  });

  if (anyPlayable) return false;

  // No playable moves. If deck has cards, refill will happen on turn start.
  if (state.deck.length > 0) {
    const someoneCanRefill = state.players.some((p) => p.hand.length < rules.startingHandSize);
    if (someoneCanRefill) return false;
  }

  return true;
}

export function determineWinners(players: CardPlayer[]): {
  winnerIds: string[];
  sizes: { id: string; name: string; size: number }[];
} {
  const sizes = players.map((p) => ({
    id: p.id,
    name: p.name,
    size: p.bundle.length,
  }));
  const max = Math.max(0, ...sizes.map((s) => s.size));
  const winnerIds = sizes.filter((s) => s.size === max && max > 0).map((s) => s.id);
  // All-zero tie — everyone shares or nobody; treat as all tied.
  if (max === 0) {
    return { winnerIds: players.map((p) => p.id), sizes };
  }
  return { winnerIds, sizes };
}

export function applyMove(
  state: CardGameState,
  playerId: string,
  move: PlayMove,
  rules: StealBundleRules = STEAL_BUNDLE_RULES,
): CardGameState | null {
  const legal = listLegalMoves(state, playerId, rules);
  const ok = legal.some((m) => {
    if (m.type !== move.type) return false;
    if (m.type === "matchTable" && move.type === "matchTable") {
      return m.handCardId === move.handCardId && m.tableCardId === move.tableCardId;
    }
    if (m.type === "stealBundle" && move.type === "stealBundle") {
      return m.handCardId === move.handCardId && m.targetPlayerId === move.targetPlayerId;
    }
    if (m.type === "dropToTable" && move.type === "dropToTable") {
      return m.handCardId === move.handCardId;
    }
    return false;
  });
  if (!ok) return null;

  if (move.type === "matchTable") {
    return matchTableCard(state, playerId, move.handCardId, move.tableCardId, rules);
  }
  if (move.type === "stealBundle") {
    const player = state.players.find((p) => p.id === playerId);
    const card = player?.hand.find((c) => c.id === move.handCardId);
    if (!card) return null;
    return stealBundle(state, playerId, move.targetPlayerId, card, rules);
  }
  return dropCardToTable(state, playerId, move.handCardId);
}
