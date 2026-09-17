"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BUNDLE_CARD_COUNT,
  pickOldManCard,
  PLAYER_TACTICS,
  resolveStealRound,
  ROUNDS_TO_WIN,
  type StealCard,
  type StealRoundResult,
} from "@/lib/clean-sneaks/steal-bundle-cards";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { readBundleCardWins, writeBundleCardWin } from "@/lib/clean-sneaks/bundle-unlock";

type Props = {
  onBack: () => void;
};

type Phase = "pick" | "reveal" | "won" | "lost";

export function StealTheBundleCardGame({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [playerSteals, setPlayerSteals] = useState(0);
  const [oldManSteals, setOldManSteals] = useState(0);
  const [bundleLeft, setBundleLeft] = useState(BUNDLE_CARD_COUNT);
  const [lastRound, setLastRound] = useState<StealRoundResult | null>(null);
  const [history, setHistory] = useState<StealRoundResult[]>([]);
  const [totalWins, setTotalWins] = useState(() => readBundleCardWins());

  const playerNeeds = ROUNDS_TO_WIN - playerSteals;
  const oldManNeeds = ROUNDS_TO_WIN - oldManSteals;

  const statusLine = useMemo(() => {
    if (phase === "won") return "Bundle stolen. Baloon8 stays clean.";
    if (phase === "lost") return "Old man kept the bundle this round.";
    return `Steal ${playerNeeds} more · He needs ${oldManNeeds} to stop you · ${bundleLeft} cards in the bag`;
  }, [phase, playerNeeds, oldManNeeds, bundleLeft]);

  const playCard = useCallback(
    (card: StealCard) => {
      if (phase !== "pick") return;
      const oldManCard = pickOldManCard();
      const result = resolveStealRound(card, oldManCard);
      setLastRound(result);
      setHistory((h) => [...h, result].slice(-6));

      if (result.playerStole) {
        const nextSteals = playerSteals + 1;
        setPlayerSteals(nextSteals);
        setBundleLeft((b) => Math.max(0, b - 1));
        if (nextSteals >= ROUNDS_TO_WIN) {
          const wins = writeBundleCardWin();
          setTotalWins(wins);
          setPhase("won");
          return;
        }
      } else {
        const nextOld = oldManSteals + 1;
        setOldManSteals(nextOld);
        if (nextOld >= ROUNDS_TO_WIN) {
          setPhase("lost");
          return;
        }
      }

      setPhase("reveal");
    },
    [phase, playerSteals, oldManSteals],
  );

  const nextRound = () => {
    setLastRound(null);
    setPhase("pick");
  };

  const resetMatch = () => {
    setPhase("pick");
    setPlayerSteals(0);
    setOldManSteals(0);
    setBundleLeft(BUNDLE_CARD_COUNT);
    setLastRound(null);
    setHistory([]);
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a0c10]/95"
      data-testid="steal-bundle-card-game"
    >
      <div className="border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">
          {KLEAN_SNEAKS.title}
        </p>
        <h2 className="seeds-holo-text text-xl font-bold tracking-wide sm:text-2xl">
          Steal the Old Man&apos;s Bundle
        </h2>
        <p className="mt-1 text-xs text-white/55 sm:text-sm">{statusLine}</p>
        {totalWins > 0 && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[#7EC8D9]/80">
            Lifetime steals: {totalWins}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:gap-3 sm:text-sm">
          <ScorePill label="You stole" value={playerSteals} accent />
          <ScorePill label="In the bag" value={bundleLeft} />
          <ScorePill label="He blocked" value={oldManSteals} warn={oldManSteals > 0} />
        </div>

        {phase === "reveal" && lastRound && (
          <div className="grid gap-3 sm:grid-cols-2">
            <PlayedCard title="Your move" card={lastRound.playerCard} won={lastRound.playerWon} />
            <PlayedCard
              title="Old man's defense"
              card={lastRound.oldManCard}
              won={!lastRound.playerWon}
              hazard
            />
          </div>
        )}

        {(phase === "won" || phase === "lost") && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D94F9C]">
              {phase === "won" ? "Bundle secured" : "Not this time"}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {phase === "won"
                ? "You stole the old man's bundle — Baloon8 stays fresh."
                : "Crowds and weather held the bag. Run it back."}
            </p>
          </div>
        )}

        {phase === "pick" && (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/45">
              Pick your finish · protect the fit · steal the bag
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PLAYER_TACTICS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => playCard(card)}
                  className="rounded-xl border border-[#5B8DA8]/40 bg-[#5B8DA8]/10 px-3 py-3 text-left transition hover:border-[#7EC8D9]/60 hover:bg-[#5B8DA8]/20 active:scale-[0.98]"
                  data-testid={`button-tactic-${card.id}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#E8D9A8]">{card.label}</span>
                    <span className="text-xs tabular-nums text-[#7EC8D9]">PWR {card.power}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">{card.blurb}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && phase !== "pick" && (
          <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-white/50">
            Last rounds:{" "}
            {history
              .map((r) => (r.playerWon ? `✓ ${r.playerCard.label}` : `✗ ${r.oldManCard.label}`))
              .join(" · ")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
        {phase === "reveal" && (
          <Button className="bg-[#5B8DA8] text-white" onClick={nextRound}>
            Next card
          </Button>
        )}
        {(phase === "won" || phase === "lost") && (
          <Button className="bg-[#5B8DA8] text-white" onClick={resetMatch}>
            Steal again
          </Button>
        )}
        <Button variant="outline" onClick={onBack} data-testid="button-steal-bundle-back">
          Back to runner
        </Button>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold tabular-nums ${
          accent ? "text-[#7EC8D9]" : warn ? "text-[#D94F9C]" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PlayedCard({
  title,
  card,
  won,
  hazard,
}: {
  title: string;
  card: StealCard;
  won: boolean;
  hazard?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        won
          ? "border-[#7EC8D9]/50 bg-[#7EC8D9]/10"
          : hazard
            ? "border-[#D94F9C]/40 bg-[#D94F9C]/10"
            : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/45">{title}</p>
      <p className="mt-1 font-semibold text-foreground">{card.label}</p>
      <p className="text-xs text-white/55">{card.blurb}</p>
      <p className="mt-2 text-xs tabular-nums text-[#7EC8D9]">Power {card.power}</p>
    </div>
  );
}
