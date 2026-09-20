import { describe, expect, it } from "vitest";
import { chooseAiMove } from "@/lib/clean-sneaks/casino/ai-player";
import {
  applyMove,
  canStealBundle,
  createDeck,
  determineWinners,
  listLegalMoves,
  passStuckTurn,
  shouldEndGame,
  shuffleDeck,
  startCardGame,
  STEAL_BUNDLE_RULES,
  tryHumanPlay,
} from "@/lib/clean-sneaks/casino";
import type { CardGameState, PlayingCard } from "@/lib/clean-sneaks/casino/types";
import { readFileSync } from "fs";
import { resolve } from "path";

function card(rank: PlayingCard["rank"], suit: PlayingCard["suit"], id?: string): PlayingCard {
  return { id: id ?? `${rank}-${suit}`, rank, suit, faceUp: true };
}

describe("Steal the Old Man's Bundle deck", () => {
  it("has exactly 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
  });

  it("shuffles without losing cards", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, () => 0.3);
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map((c) => c.id)).size).toBe(52);
  });
});

describe("deal + match rules", () => {
  it("deals 5 table cards and 5 per player", () => {
    const state = startCardGame(2, () => 0.42);
    expect(state.tableCards).toHaveLength(STEAL_BUNDLE_RULES.initialTableCards);
    expect(state.players).toHaveLength(2);
    for (const p of state.players) {
      expect(p.hand).toHaveLength(STEAL_BUNDLE_RULES.startingHandSize);
    }
    expect(state.deck.length).toBe(52 - 5 - 5 * 2);
  });

  it("matches by rank ignoring suit", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("7", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [card("7", "spades")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [card("3", "clubs")],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    const moves = listLegalMoves(state, "p1");
    expect(moves.some((m) => m.type === "matchTable")).toBe(true);
    const next = applyMove(state, "p1", {
      type: "matchTable",
      handCardId: "7-spades",
      tableCardId: "7-hearts",
    });
    expect(next?.players[0]?.bundle).toHaveLength(2);
    expect(next?.players[0]?.bundleMatchRank).toBe("7");
    expect(next?.tableCards).toHaveLength(0);
  });

  it("steals when ranks match exposed bundle", () => {
    expect(canStealBundle("8", "8", 12)).toBe(true);
    expect(canStealBundle("8", "9", 12)).toBe(false);
    expect(canStealBundle("8", null, 12)).toBe(false);

    const state: CardGameState = {
      deck: [],
      tableCards: [],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [card("8", "diamonds")],
          bundle: [card("2", "clubs")],
          bundleMatchRank: "2",
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [],
          bundle: [card("4", "hearts"), card("8", "spades")],
          bundleMatchRank: "8",
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    const next = applyMove(state, "p1", {
      type: "stealBundle",
      handCardId: "8-diamonds",
      targetPlayerId: "p2",
    });
    expect(next?.players[0]?.bundle.length).toBe(4);
    expect(next?.players[1]?.bundle.length).toBe(0);
    expect(next?.lastEvent).toMatch(/STOLEN/i);
  });

  it("allows drop when no match exists", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("K", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [card("2", "spades")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    const moves = listLegalMoves(state, "p1");
    expect(moves).toEqual([{ type: "dropToTable", handCardId: "2-spades" }]);
  });

  it("rejects illegal human moves", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("A", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [card("3", "clubs")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    const bad = tryHumanPlay(state, {
      type: "matchTable",
      handCardId: "3-clubs",
      tableCardId: "A-hearts",
    });
    expect(bad.ok).toBe(false);
  });
});

describe("AI + winners", () => {
  it("prefers steal over match when it notices the steal", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("5", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: false,
          hand: [card("5", "spades")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: true,
          hand: [],
          bundle: [card("9", "clubs"), card("5", "diamonds")],
          bundleMatchRank: "5",
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    // rng() < notice rates → always "sees" the steal first.
    const move = chooseAiMove(state, "p1", () => 0);
    expect(move?.type).toBe("stealBundle");
  });

  it("sometimes drops instead of matching so play feels human", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("5", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: false,
          hand: [card("5", "spades"), card("9", "clubs")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: true,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    // First rng: steal notice (n/a). Second: match notice fails (0.99 >= 0.55).
    // Later rng picks among drops.
    let calls = 0;
    const rng = () => {
      calls += 1;
      return calls === 1 ? 0.99 : 0.1;
    };
    const move = chooseAiMove(state, "p1", rng);
    expect(move).toEqual({ type: "dropToTable", handCardId: "9-clubs" });
  });

  it("must match when every hand card is locked into a match", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("5", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: false,
          hand: [card("5", "spades")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: true,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    const move = chooseAiMove(state, "p1", () => 0.99);
    expect(move?.type).toBe("matchTable");
  });

  it("passes a stuck computer seat so the hand cannot freeze on Playing…", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("Q", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [card("2", "clubs")],
          bundle: [],
          bundleMatchRank: null,
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 1,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: "Player 1 placed a 5 on the table.",
      turnNumber: 4,
    };
    expect(chooseAiMove(state, "p2")).toBeNull();
    const next = passStuckTurn(state);
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.phase).toBe("playing");
    expect(next.turnNumber).toBe(5);
  });

  it("does not cancel the AI think timer by depending on busy", () => {
    const boardSrc = readFileSync(
      resolve(__dirname, "../../../components/clean-sneaks/casino/StealBundleBoard.tsx"),
      "utf8",
    );
    expect(boardSrc).toContain("passStuckTurn");
    expect(boardSrc).toContain("never list `busy` in the dependency array");
    expect(boardSrc).not.toMatch(/\}, \[state, busy\]\);/);
  });

  it("picks largest bundle as winner and handles ties", () => {
    const players = [
      {
        id: "p1",
        name: "Player 1",
        isHuman: true,
        hand: [],
        bundle: [card("A", "spades"), card("2", "spades")],
        bundleMatchRank: "2" as const,
      },
      {
        id: "p2",
        name: "Player 2",
        isHuman: false,
        hand: [],
        bundle: [card("3", "hearts")],
        bundleMatchRank: "3" as const,
      },
    ];
    expect(determineWinners(players).winnerIds).toEqual(["p1"]);

    const tied = [
      { ...players[0]!, bundle: [card("A", "spades")] },
      { ...players[1]!, bundle: [card("K", "hearts")] },
    ];
    expect(determineWinners(tied).winnerIds.sort()).toEqual(["p1", "p2"]);
  });

  it("ends when no cards or matches remain", () => {
    const state: CardGameState = {
      deck: [],
      tableCards: [card("Q", "hearts")],
      players: [
        {
          id: "p1",
          name: "Player 1",
          isHuman: true,
          hand: [],
          bundle: [card("A", "spades")],
          bundleMatchRank: "A",
        },
        {
          id: "p2",
          name: "Player 2",
          isHuman: false,
          hand: [],
          bundle: [],
          bundleMatchRank: null,
        },
      ],
      currentPlayerIndex: 0,
      selectedCardId: null,
      phase: "playing",
      winnerIds: [],
      lastEvent: null,
      turnNumber: 1,
    };
    expect(shouldEndGame(state)).toBe(true);
  });
});
