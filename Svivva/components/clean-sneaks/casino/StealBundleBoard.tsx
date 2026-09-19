"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  aiDelayMs,
  aiResolveDelayMs,
  applyAiMove,
  chooseAiMove,
  currentPlayer,
  listLegalMoves,
  payoutWin,
  playCue,
  recordCardGameResult,
  selectHandCard,
  setSessionCredits,
  startCardGame,
  tryHumanPlay,
  type CardGameState,
  type PlayMove,
} from "@/lib/clean-sneaks/casino";
import { PlayingCardView } from "./PlayingCardView";

type Props = {
  playerCount: 2 | 3;
  ante: number;
  startingCredits: number;
  showTutorialFirst?: boolean;
  onCreditsChange?: (credits: number) => void;
  onRequestNewWalk: () => void;
  onReturnToCasino: () => void;
  onPlayAgain: () => void;
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

  const deal = useCallback(() => {
    const paid = Math.min(ante, credits);
    const afterAnte = Math.max(0, credits - paid);
    setAnteLocked(paid);
    setCredits(afterAnte);
    setSessionCredits(afterAnte);
    onCreditsChange?.(afterAnte);
    playCue("card_shuffle");
    const next = startCardGame(playerCount);
    setState(next);
    playCue("card_deal");
    recordedRef.current = false;
    aiPaceAfterHumanRef.current = true;
  }, [playerCount, ante, credits, onCreditsChange]);

  useEffect(() => {
    if (tutorialDone && !state) deal();
  }, [tutorialDone, state, deal]);

  useEffect(() => {
    if (!state || state.phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;
    const humanWon = state.winnerIds.includes("p1");
    const tie = state.winnerIds.length > 1 && humanWon;
    // Ante was already deducted at deal time — settle the stack from remaining credits.
    let nextCredits = credits;
    if (humanWon && !tie) {
      nextCredits = credits + payoutWin(anteLocked);
    } else if (tie) {
      nextCredits = credits + anteLocked;
    }
    setCredits(nextCredits);
    setSessionCredits(nextCredits);
    onCreditsChange?.(nextCredits);
    recordCardGameResult(humanWon && !tie, 0);
    playCue("victory");
  }, [state, anteLocked, credits, onCreditsChange]);

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
      const result = tryHumanPlay(state, move);
      if (!result.ok) {
        playCue("invalid_move");
        showFlash(result.reason, "info");
        return;
      }
      aiPaceAfterHumanRef.current = true;
      if (move.type === "stealBundle") {
        playCue("bundle_steal");
        showFlash("BUNDLE STOLEN!", "steal");
      } else if (move.type === "matchTable") {
        playCue("card_match");
        playCue("bundle_collect");
        showFlash("MATCH!", "match");
      } else {
        playCue("card_flip");
      }
      setState(result.state);
    },
    [state, busy],
  );

  // AI turns
  useEffect(() => {
    if (!state || state.phase !== "playing" || busy) return;
    const cur = currentPlayer(state);
    if (!cur || cur.isHuman) return;

    setBusy(true);
    const afterHuman = aiPaceAfterHumanRef.current;
    const think = window.setTimeout(() => {
      const move = chooseAiMove(state, cur.id);
      if (!move) {
        setBusy(false);
        return;
      }
      const next = applyAiMove(state, move);
      if (next) {
        if (move.type === "stealBundle") {
          playCue("bundle_steal");
          showFlash(`${cur.name} STEALS!`, "steal");
        } else if (move.type === "matchTable") {
          playCue("card_match");
          showFlash(`${cur.name} matches`, "match");
        } else {
          playCue("card_deal");
        }
        setState(next);
        aiPaceAfterHumanRef.current = false;
      }
      window.setTimeout(() => setBusy(false), aiResolveDelayMs(afterHuman));
    }, aiDelayMs(afterHuman));

    return () => window.clearTimeout(think);
  }, [state, busy]);

  if (!tutorialDone) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center"
        data-testid="steal-bundle-tutorial"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.12), transparent 50%), #0a0c10",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">Casino Table</p>
        <h2 className="mt-2 font-serif text-2xl text-[#f7e7b0] sm:text-3xl">
          Steal the Old Man&apos;s Bundle
        </h2>
        <ul className="mt-6 max-w-md space-y-2 text-left text-sm text-[#e8dcc0]/85">
          <li>Match cards by rank.</li>
          <li>Match a card on the table to add cards to your bundle.</li>
          <li>Watch your opponents&apos; bundles.</li>
          <li>Match a bundle&apos;s exposed rank to STEAL it.</li>
          <li className="font-semibold text-[#ffd76a]">Biggest bundle wins.</li>
        </ul>
        <Button
          className="mt-8 bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
          onClick={() => setTutorialDone(true)}
          data-testid="button-deal-cards"
        >
          Deal the Cards
        </Button>
      </div>
    );
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
  const yourTurn = Boolean(cur?.isHuman);

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="steal-bundle-board"
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
              yourTurn ? "text-[#ffd76a]" : "text-[#e8dcc0]/60"
            }`}
            data-testid="turn-indicator"
          >
            {cur?.isHuman ? "Player 1 — Your Turn" : `${cur?.name ?? ""} — Playing…`}
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

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/70">Table</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {state.tableCards.length === 0 && (
            <p className="text-xs text-[#e8dcc0]/40">No cards on the felt</p>
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
        <p className="text-[10px] text-[#e8dcc0]/45">
          Deck: {state.deck.length}
          {state.lastEvent ? ` · ${state.lastEvent}` : ""}
        </p>
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
