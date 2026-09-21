"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  canAffordTable,
  computeAnte,
  describeCreditsGate,
  markScoreAccepted,
  playCue,
  readCasinoSession,
  scoreToCredits,
  type ExperienceState,
} from "@/lib/clean-sneaks/casino";
import { StealBundleBoard } from "./StealBundleBoard";

const CasinoScene = dynamic(
  () => import("./CasinoScene").then((m) => ({ default: m.CasinoScene })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-[#07050a]" /> },
);

type Props = {
  walkingScore: number;
  initialState?: ExperienceState;
  onNewWalk: () => void;
  onExit?: () => void;
};

export function CasinoExperience({
  walkingScore,
  initialState = "WALK_COMPLETE",
  onNewWalk,
  onExit,
}: Props) {
  const [flow, setFlow] = useState<ExperienceState>(initialState);
  const [doorsOpen, setDoorsOpen] = useState(0);
  const [playerCount, setPlayerCount] = useState<2 | 3 | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [cameraPunch, setCameraPunch] = useState(0);
  const [credits, setCredits] = useState(() => {
    const session = readCasinoSession();
    return session.credits || scoreToCredits(walkingScore || session.walkingScore);
  });

  const ante = useMemo(() => computeAnte(credits), [credits]);
  const canSit = canAffordTable(credits);
  const score = walkingScore || readCasinoSession().walkingScore || credits;

  useEffect(() => {
    if (flow === "WALK_COMPLETE") playCue("walking_complete");
    if (flow === "CASINO_APPROACH" || flow === "CASINO_LOBBY") playCue("casino_ambience");
  }, [flow]);

  const submitTicket = useCallback(() => {
    if (ticketSubmitted) return;
    setTicketSubmitted(true);
    markScoreAccepted();
    setFlow("CASINO_CHECK_IN");
    window.setTimeout(() => {
      setFlow("CASINO_ENTERING");
      playCue("casino_door");
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setDoorsOpen(t);
        if (t < 1) requestAnimationFrame(tick);
        else {
          window.setTimeout(() => {
            setFlow("CASINO_LOBBY");
            setCameraPunch(0.6);
            window.setTimeout(() => setCameraPunch(0), 400);
          }, 700);
        }
      };
      requestAnimationFrame(tick);
    }, 900);
  }, [ticketSubmitted]);

  const sceneMode =
    flow === "CASINO_LOBBY" ||
    flow === "CARD_GAME_SETUP" ||
    flow === "CARD_GAME_DEALING" ||
    flow === "CARD_GAME_PLAYING" ||
    flow === "CARD_GAME_RESULTS"
      ? flow === "CARD_GAME_PLAYING" || flow === "CARD_GAME_RESULTS" || flow === "CARD_GAME_DEALING"
        ? "table"
        : "interior"
      : flow === "CASINO_ENTERING"
        ? "entering"
        : "exterior";

  const showCardGame =
    flow === "CARD_GAME_PLAYING" ||
    flow === "CARD_GAME_DEALING" ||
    flow === "CARD_GAME_RESULTS" ||
    (flow === "CARD_GAME_SETUP" && playerCount != null);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d4af37]/30 bg-[#07050a]"
      data-testid="casino-experience"
      data-flow={flow}
    >
      <CasinoScene
        mode={sceneMode}
        doorsOpen={doorsOpen}
        cameraPunch={cameraPunch}
        className="absolute inset-0"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {(flow === "WALK_COMPLETE" || flow === "CASINO_APPROACH") && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[#d4af37]">Walk Complete</p>
          <h2 className="mt-2 font-serif text-3xl text-[#f7e7b0] sm:text-4xl">Final Score</h2>
          <p
            className="mt-3 font-serif text-5xl tabular-nums text-[#ffd76a] sm:text-6xl"
            data-testid="casino-final-score"
          >
            {score.toLocaleString()}
          </p>
          <p className="mt-4 max-w-sm text-sm text-[#e8dcc0]/75">
            Cash out {credits.toLocaleString()} credits — that&apos;s your chip stack inside.
          </p>
          <button
            type="button"
            onClick={() => {
              setFlow("CASINO_APPROACH");
              submitTicket();
            }}
            className="mt-6 rounded-md border-2 border-[#d4af37] bg-[#d4af37] px-8 py-4 font-serif text-lg text-[#1a1008] transition hover:bg-[#e0c15a] active:scale-[0.98]"
            data-testid="button-score-ticket"
          >
            Score Ticket · {credits.toLocaleString()} credits
          </button>
          <p className="mt-3 text-[11px] text-[#e8dcc0]/45">
            Tap the ticket or approach the podium
          </p>
        </div>
      )}

      {flow === "CASINO_CHECK_IN" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 px-4 text-center backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#7dffb2]">Score Accepted</p>
          <h2 className="mt-2 font-serif text-3xl text-[#f7e7b0]">Casino Entry Unlocked</h2>
          <p className="mt-3 text-sm text-[#e8dcc0]/70">
            {credits.toLocaleString()} credits on your chip stack
          </p>
        </div>
      )}

      {flow === "CASINO_ENTERING" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-10">
          <p className="rounded bg-black/50 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#ffd76a]">
            Entering the casino
          </p>
        </div>
      )}

      {flow === "CASINO_LOBBY" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#ff4d7a]">Main Floor</p>
          <h2 className="mt-2 font-serif text-3xl text-[#f7e7b0] sm:text-4xl">
            Steal the Old Man&apos;s Bundle
          </h2>
          <p className="mt-2 text-sm text-[#e8dcc0]/70">Build the biggest bundle.</p>
          <p className="mt-2 text-sm text-[#ffd76a]" data-testid="lobby-credits">
            Credits: {credits.toLocaleString()}
            {canSit ? ` · Ante: ${ante.toLocaleString()}` : ""}
          </p>
          <p className="mt-1 max-w-sm text-[11px] text-[#e8dcc0]/55">
            {describeCreditsGate(credits)}
          </p>
          <Button
            className="mt-8 bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] disabled:opacity-40"
            disabled={!canSit}
            onClick={() => setFlow("CARD_GAME_SETUP")}
            data-testid="button-sit-at-table"
          >
            {canSit ? "Sit at the Table" : "Need more credits"}
          </Button>
          {!canSit && (
            <Button
              className="mt-3 border border-[#7EC8D9]/40 text-[#7EC8D9]"
              variant="outline"
              onClick={onNewWalk}
              data-testid="button-earn-credits-walk"
            >
              New Walk — earn credits
            </Button>
          )}
          {onExit && (
            <Button variant="ghost" className="mt-2 text-[#e8dcc0]/60" onClick={onExit}>
              Exit
            </Button>
          )}
        </div>
      )}

      {flow === "CARD_GAME_SETUP" && playerCount == null && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07050a]/92 px-4 text-center"
          data-testid="player-count-select"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">
            Steal the Old Man&apos;s Bundle
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#f7e7b0] sm:text-3xl">Choose Players</h2>
          <p className="mt-3 text-sm text-[#ffd76a]">
            Table ante: {ante.toLocaleString()} of {credits.toLocaleString()} credits
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="min-w-[160px] bg-[#d4af37] text-[#1a1008]"
              onClick={() => {
                setPlayerCount(2);
                setFlow("CARD_GAME_PLAYING");
              }}
              data-testid="button-2-players"
            >
              2 Players
            </Button>
            <Button
              className="min-w-[160px] border border-[#d4af37]/50 bg-[#7a1028] text-[#f7e7b0] hover:bg-[#9a1834]"
              onClick={() => {
                setPlayerCount(3);
                setFlow("CARD_GAME_PLAYING");
              }}
              data-testid="button-3-players"
            >
              3 Players
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-[#e8dcc0]/50">
            Player 1 is you · others are dealers&apos; opponents
          </p>
        </div>
      )}

      {showCardGame && playerCount != null && (
        <div className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[#07050a]/88">
          <StealBundleBoard
            key={gameKey}
            playerCount={playerCount}
            ante={ante}
            startingCredits={credits}
            showTutorialFirst={gameKey === 0}
            onCreditsChange={setCredits}
            onPlayAgain={() => {
              const latest = readCasinoSession().credits;
              setCredits(latest);
              if (!canAffordTable(latest)) {
                setPlayerCount(null);
                setFlow("CASINO_LOBBY");
                return;
              }
              setGameKey((k) => k + 1);
              setFlow("CARD_GAME_PLAYING");
            }}
            onReturnToCasino={() => {
              setCredits(readCasinoSession().credits);
              setPlayerCount(null);
              setFlow("CASINO_LOBBY");
            }}
            onRequestNewWalk={onNewWalk}
          />
        </div>
      )}
    </div>
  );
}
