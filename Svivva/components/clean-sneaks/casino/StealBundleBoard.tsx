"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  aiDelayMs,
  aiResolveDelayMs,
  applyAiMove,
  applyDealStep,
  beginCardGameDeal,
  chooseAiMove,
  currentPlayer,
  finishDealing,
  listLegalMoves,
  passStuckTurn,
  listUnlockedUpgrades,
  payoutWin,
  playCue,
  readCasinoSession,
  recordCardGameResult,
  selectHandCard,
  setSessionCredits,
  tryHumanPlay,
  type CardGameState,
  type DealStep,
  type PlayMove,
  type PlayingCard,
} from "@/lib/clean-sneaks/casino";
import { PlayingCardView } from "./PlayingCardView";
import { StealBundleHowToPlay } from "./StealBundleHowToPlay";

export type HandCompleteStats = {
  humanWonSolo: boolean;
  steals: number;
  bundleSize: number;
  dropsToTable: number;
  clearedTable: boolean;
};

type Props = {
  playerCount: 2 | 3;
  ante: number;
  startingCredits: number;
  showTutorialFirst?: boolean;
  onCreditsChange?: (credits: number) => void;
  onRequestNewWalk: () => void;
  onReturnToCasino: () => void;
  onPlayAgain: () => void;
  /** Fired once when the hand reaches results — used for parlays. */
  onHandComplete?: (stats: HandCompleteStats) => void;
};

type UiFlash = { text: string; kind: "steal" | "match" | "info" } | null;

export function StealBundleBoard({
  playerCount,
  ante,
  startingCredits,
  showTutorialFirst = true,
  onCreditsChange,
  onRequestNewWalk,
  onReturnToCasino,
  onPlayAgain,
  onHandComplete,
}: Props) {
  const [tutorialDone, setTutorialDone] = useState(!showTutorialFirst);
  const [state, setState] = useState<CardGameState | null>(null);
  const [flash, setFlash] = useState<UiFlash>(null);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState(startingCredits);
  const [anteLocked, setAnteLocked] = useState(0);
  const recordedRef = useRef(false);
  /** After a human move, use full AI pacing; chain AI→AI turns stay snappy. */
  const aiPaceAfterHumanRef = useRef(true);
  const [dealQueue, setDealQueue] = useState<DealStep[] | null>(null);
  const handStatsRef = useRef({
    steals: 0,
    dropsToTable: 0,
    clearedTable: false,
  });
  const handCompleteFiredRef = useRef(false);

  const deal = useCallback(() => {
    const paid = Math.min(ante, credits);
    const afterAnte = Math.max(0, credits - paid);
    setAnteLocked(paid);
    setCredits(afterAnte);
    setSessionCredits(afterAnte);
    onCreditsChange?.(afterAnte);
    playCue("card_shuffle");
    const { state: dealing, steps } = beginCardGameDeal(playerCount);
    setDealQueue(steps);
    setBusy(true);
    setState(dealing);
    recordedRef.current = false;
    handCompleteFiredRef.current = false;
    handStatsRef.current = { steals: 0, dropsToTable: 0, clearedTable: false };
    aiPaceAfterHumanRef.current = true;
  }, [playerCount, ante, credits, onCreditsChange]);

  useEffect(() => {
    if (tutorialDone && !state) deal();
  }, [tutorialDone, state, deal]);

  // Peel cards one-by-one from the top of the shuffled stock (real dealer order).
  useEffect(() => {
    if (!state || state.phase !== "dealing" || !dealQueue?.length) return;
    const steps = dealQueue;
    let cancelled = false;
    let i = 0;
    let timer = 0;

    const run = () => {
      if (cancelled) return;
      if (i >= steps.length) {
        setDealQueue(null);
        setState((s) => (s ? finishDealing(s) : s));
        setBusy(false);
        return;
      }
      const step = steps[i]!;
      i += 1;
      playCue("card_deal");
      setState((s) => (s ? applyDealStep(s, step) : s));
      timer = window.setTimeout(run, step.kind === "table" ? 120 : 78);
    };

    timer = window.setTimeout(run, 420);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state?.phase, dealQueue]);

  useEffect(() => {
    if (!state || state.phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;
    const humanWon = state.winnerIds.includes("p1");
    const tie = state.winnerIds.length > 1 && humanWon;
    // Ante was already deducted at deal time — settle the stack from remaining credits.
    let nextCredits = credits;
    if (humanWon && !tie) {
      nextCredits =
        credits + payoutWin(anteLocked, listUnlockedUpgrades(readCasinoSession()));
    } else if (tie) {
      nextCredits = credits + anteLocked;
    }
    setCredits(nextCredits);
    setSessionCredits(nextCredits);
    onCreditsChange?.(nextCredits);
    recordCardGameResult(humanWon && !tie, 0);
    playCue("victory");
    if (!handCompleteFiredRef.current) {
      handCompleteFiredRef.current = true;
      const human = state.players.find((p) => p.id === "p1");
      onHandComplete?.({
        humanWonSolo: humanWon && !tie,
        steals: handStatsRef.current.steals,
        bundleSize: human?.bundle.length ?? 0,
        dropsToTable: handStatsRef.current.dropsToTable,
        clearedTable: handStatsRef.current.clearedTable,
      });
    }
  }, [state, anteLocked, credits, onCreditsChange, onHandComplete]);

  const legal = useMemo(() => {
    if (!state) return [] as PlayMove[];
    const cur = currentPlayer(state);
    if (!cur?.isHuman) return [];
    return listLegalMoves(state, cur.id);
  }, [state]);

  const selectedMoves = useMemo(() => {
    if (!state?.selectedCardId) return [] as PlayMove[];
    return legal.filter((m) => m.handCardId === state.selectedCardId);
  }, [legal, state?.selectedCardId]);

  const showFlash = (
    text: string,
    kind: UiFlash extends null ? never : NonNullable<UiFlash>["kind"],
  ) => {
    setFlash({ text, kind });
    window.setTimeout(() => setFlash(null), 1200);
  };

  const commitMove = useCallback(
    (move: PlayMove) => {
      if (!state || busy) return;
      const tableBefore = state.tableCards.length;
      const result = tryHumanPlay(state, move);
      if (!result.ok) {
        playCue("invalid_move");
        showFlash(result.reason, "info");
        return;
      }
      aiPaceAfterHumanRef.current = true;
      if (move.type === "stealBundle") {
        handStatsRef.current.steals += 1;
        playCue("bundle_steal");
        showFlash("BUNDLE STOLEN!", "steal");
      } else if (move.type === "matchTable") {
        playCue("card_match");
        playCue("bundle_collect");
        showFlash("MATCH!", "match");
        if (tableBefore <= 1 || result.state.tableCards.length === 0) {
          handStatsRef.current.clearedTable = true;
        }
      } else if (move.type === "dropToTable") {
        handStatsRef.current.dropsToTable += 1;
        playCue("card_flip");
      } else {
        playCue("card_flip");
      }
      setState(result.state);
    },
    [state, busy],
  );

  // AI turns — never list `busy` in the dependency array. setBusy(true) would
  // re-run this effect, cleanup would clearTimeout the think timer, and the
  // computer player stays frozen on "Playing…" forever.
  useEffect(() => {
    if (!state || state.phase !== "playing") return;
    const cur = currentPlayer(state);
    if (!cur || cur.isHuman) {
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    const afterHuman = aiPaceAfterHumanRef.current;
    const stateSnapshot = state;
    const playerId = cur.id;
    const playerName = cur.name;

    const thinkTimer = window.setTimeout(() => {
      if (cancelled) return;

      const move = chooseAiMove(stateSnapshot, playerId);
      if (!move) {
        setState(passStuckTurn(stateSnapshot));
        aiPaceAfterHumanRef.current = false;
        setBusy(false);
        return;
      }

      const next = applyAiMove(stateSnapshot, move);
      if (!next) {
        setState(passStuckTurn(stateSnapshot));
        aiPaceAfterHumanRef.current = false;
        setBusy(false);
        return;
      }

      if (move.type === "stealBundle") {
        playCue("bundle_steal");
        showFlash(`${playerName} STEALS!`, "steal");
      } else if (move.type === "matchTable") {
        playCue("card_match");
        showFlash(`${playerName} matches`, "match");
      } else {
        playCue("card_deal");
      }
      setState(next);
      aiPaceAfterHumanRef.current = false;
      window.setTimeout(() => {
        // Always unlock input after a committed AI move — clearing this timer in
        // effect cleanup left busy=true when the next seat's effect started.
        setBusy(false);
      }, aiResolveDelayMs(afterHuman));
    }, aiDelayMs(afterHuman));

    return () => {
      cancelled = true;
      window.clearTimeout(thinkTimer);
    };
  }, [state]);

  if (!tutorialDone) {
    return <StealBundleHowToPlay onStart={() => setTutorialDone(true)} />;
  }

  if (!state) {
    return <div className="flex flex-1 items-center justify-center text-[#d4af37]">Shuffling…</div>;
  }

  if (state.phase === "results") {
    const sizes = state.players.map((p) => ({
      name: p.name,
      size: p.bundle.length,
      id: p.id,
    }));
    const winners = state.winnerIds;
    const tie = winners.length > 1;
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center"
        data-testid="steal-bundle-results"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,77,122,0.15), transparent 55%), #0a0c10",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">Final Count</p>
        <div className="mt-4 w-full max-w-sm space-y-2">
          {sizes
            .slice()
            .sort((a, b) => b.size - a.size)
            .map((s) => (
              <div
                key={s.id}
                className={`flex justify-between rounded border px-4 py-2 text-sm ${
                  winners.includes(s.id)
                    ? "border-[#d4af37] bg-[#d4af37]/15 text-[#ffd76a]"
                    : "border-white/10 bg-white/5 text-[#e8dcc0]"
                }`}
              >
                <span>{s.name}</span>
                <span className="tabular-nums">{s.size} cards</span>
              </div>
            ))}
        </div>
        <h3 className="mt-6 font-serif text-2xl text-[#f7e7b0] sm:text-3xl">
          {tie
            ? "TIE!"
            : `${state.players.find((p) => p.id === winners[0])?.name ?? "Player"} WINS!`}
        </h3>
        <p className="mt-2 text-sm text-[#ffd76a]" data-testid="results-credits">
          Chip stack: {credits.toLocaleString()} credits
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button
            className="bg-[#d4af37] text-[#1a1008]"
            onClick={onPlayAgain}
            data-testid="button-play-again"
          >
            Play Again
          </Button>
          <Button
            variant="outline"
            className="border-[#d4af37]/50 text-[#f7e7b0]"
            onClick={onReturnToCasino}
          >
            Return to Casino
          </Button>
          <Button variant="ghost" className="text-[#e8dcc0]/70" onClick={onRequestNewWalk}>
            New Walk
          </Button>
        </div>
      </div>
    );
  }

  const human = state.players[0]!;
  const cur = currentPlayer(state);
  const yourTurn = Boolean(cur?.isHuman) && state.phase === "playing";
  const dealing = state.phase === "dealing";
  const deckTop: PlayingCard | null = state.deck[0] ?? null;

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="steal-bundle-board"
      data-phase={state.phase}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(13,74,47,0.55), #0a120e 60%), #060a08",
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/25 px-3 py-2 sm:px-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#d4af37]">
            Steal the Old Man&apos;s Bundle
          </p>
          <p className="text-xs text-[#e8dcc0]/70">Build the biggest bundle.</p>
        </div>
        <div className="text-right">
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              dealing ? "text-[#7dffb2]" : yourTurn ? "text-[#ffd76a]" : "text-[#e8dcc0]/60"
            }`}
            data-testid="turn-indicator"
          >
            {dealing
              ? "Dealing from the deck…"
              : cur?.isHuman
                ? "Player 1 — Your Turn"
                : `${cur?.name ?? ""} — Playing…`}
          </p>
          <p className="text-[10px] tabular-nums text-[#d4af37]/80" data-testid="table-credits">
            Credits {credits.toLocaleString()} · Ante {anteLocked.toLocaleString()}
          </p>
        </div>
      </div>

      {flash && (
        <div
          className={`pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-bold tracking-wide shadow-lg ${
            flash.kind === "steal"
              ? "bg-[#ff2d6a] text-white"
              : flash.kind === "match"
                ? "bg-[#0d4a2f] text-[#7dffb2]"
                : "bg-black/80 text-[#ffd76a]"
          }`}
          data-testid="bundle-flash"
        >
          {flash.text}
        </div>
      )}

      {/* Opponents */}
      <div className="grid gap-2 px-2 pt-2 sm:grid-cols-2 sm:px-4">
        {state.players.slice(1).map((p) => (
          <OpponentPanel
            key={p.id}
            name={p.name}
            handCount={p.hand.length}
            bundleCount={p.bundle.length}
            topRank={p.bundleMatchRank}
            stealTarget={
              yourTurn &&
              Boolean(
                state.selectedCardId &&
                selectedMoves.some((m) => m.type === "stealBundle" && m.targetPlayerId === p.id),
              )
            }
            onSteal={() => {
              if (!state.selectedCardId) return;
              commitMove({
                type: "stealBundle",
                handCardId: state.selectedCardId,
                targetPlayerId: p.id,
              });
            }}
          />
        ))}
      </div>

      {/* Table + stock */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-3">
        <div className="flex w-full max-w-3xl flex-wrap items-start justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1" data-testid="deck-stock">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Deck</p>
            <div className="relative h-[4.5rem] w-[3.15rem] sm:h-20 sm:w-14">
              {state.deck.length > 2 && (
                <div
                  aria-hidden
                  className="absolute inset-0 translate-x-1 translate-y-1 rounded-md border border-[#d4af37]/25 bg-[#1a0810]"
                />
              )}
              {state.deck.length > 1 && (
                <div
                  aria-hidden
                  className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-md border border-[#d4af37]/35 bg-[#2a1018]"
                />
              )}
              {deckTop ? (
                <PlayingCardView
                  card={deckTop}
                  faceDown
                  className="absolute inset-0"
                  data-testid="deck-top-card"
                />
              ) : (
                <div className="absolute inset-0 rounded-md border border-dashed border-white/15" />
              )}
            </div>
            <p className="text-[10px] tabular-nums text-[#e8dcc0]/55" data-testid="deck-count">
              {state.deck.length} left
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Table</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {state.tableCards.length === 0 && (
                <p className="text-xs text-[#e8dcc0]/40">
                  {dealing ? "Flipping table cards…" : "No cards on the felt"}
                </p>
              )}
              {state.tableCards.map((c) => {
                const canMatch =
                  yourTurn &&
                  Boolean(
                    state.selectedCardId &&
                    selectedMoves.some((m) => m.type === "matchTable" && m.tableCardId === c.id),
                  );
                return (
                  <PlayingCardView
                    key={c.id}
                    card={c}
                    highlight={canMatch}
                    onClick={
                      canMatch && state.selectedCardId
                        ? () =>
                            commitMove({
                              type: "matchTable",
                              handCardId: state.selectedCardId!,
                              tableCardId: c.id,
                            })
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#e8dcc0]/45">{state.lastEvent ?? ""}</p>
      </div>

      {/* Human hand + bundle */}
      <div className="border-t border-[#d4af37]/20 bg-black/35 px-2 py-3 sm:px-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#e8dcc0]/80">
          <span>
            {human.name} · Cards: {human.hand.length} · Bundle: {human.bundle.length}
            {human.bundleMatchRank ? ` · Top: ${human.bundleMatchRank}` : ""}
          </span>
          {yourTurn && state.selectedCardId && (
            <button
              type="button"
              className="text-[10px] uppercase tracking-wider text-[#ffd76a] underline"
              onClick={() => setState((s) => (s ? selectHandCard(s, null) : s))}
            >
              Deselect
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end justify-center gap-1.5 sm:gap-2">
          {human.hand.map((c) => {
            const playable = yourTurn && legal.some((m) => m.handCardId === c.id);
            const selected = state.selectedCardId === c.id;
            const onlyDrop =
              selected && selectedMoves.length === 1 && selectedMoves[0]?.type === "dropToTable";
            return (
              <PlayingCardView
                key={c.id}
                card={c}
                selected={selected}
                dimmed={yourTurn && !playable}
                highlight={playable && !selected}
                onClick={() => {
                  if (!yourTurn || busy) return;
                  if (selected && onlyDrop) {
                    commitMove({ type: "dropToTable", handCardId: c.id });
                    return;
                  }
                  if (selected) {
                    setState((s) => (s ? selectHandCard(s, null) : s));
                    return;
                  }
                  if (!playable) {
                    playCue("invalid_move");
                    return;
                  }
                  setState((s) => (s ? selectHandCard(s, c.id) : s));
                }}
              />
            );
          })}
        </div>
        {yourTurn &&
          state.selectedCardId &&
          selectedMoves.some((m) => m.type === "dropToTable") && (
            <div className="mt-2 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="border-[#d4af37]/40 text-[#f7e7b0]"
                onClick={() =>
                  commitMove({ type: "dropToTable", handCardId: state.selectedCardId! })
                }
                data-testid="button-drop-card"
              >
                Place on table
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

function OpponentPanel({
  name,
  handCount,
  bundleCount,
  topRank,
  stealTarget,
  onSteal,
}: {
  name: string;
  handCount: number;
  bundleCount: number;
  topRank: string | null;
  stealTarget: boolean;
  onSteal: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!stealTarget}
      onClick={onSteal}
      className={`rounded-lg border px-3 py-2 text-left transition ${
        stealTarget
          ? "border-[#ff2d6a] bg-[#ff2d6a]/15 ring-2 ring-[#ff2d6a]/60"
          : "border-white/10 bg-black/30"
      }`}
      data-testid={`opponent-${name}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#d4af37]">{name}</p>
      <p className="text-xs text-[#e8dcc0]/80">
        Cards: {handCount} · Bundle: {bundleCount}
        {topRank ? ` · Top Match: ${topRank}` : ""}
      </p>
      {stealTarget && (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#ff7aa0]">Steal!</p>
      )}
    </button>
  );
}
