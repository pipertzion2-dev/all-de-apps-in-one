"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PlayingCard } from "@/lib/clean-sneaks/casino";
import { PlayingCardView } from "./PlayingCardView";

type Props = {
  onStart: () => void;
};

const demo = (id: string, rank: PlayingCard["rank"], suit: PlayingCard["suit"]): PlayingCard => ({
  id,
  rank,
  suit,
  faceUp: true,
});

/** Visual how-to shown once at the start of Steal Bundle. */
export function StealBundleHowToPlay({ onStart }: Props) {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-6"
      data-testid="steal-bundle-tutorial"
      style={{
        background:
          "radial-gradient(ellipse at 50% 12%, rgba(212,175,55,0.14), transparent 48%), #0a0c10",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">How to play</p>
      <h2 className="mt-2 text-center font-serif text-2xl text-[#f7e7b0] sm:text-3xl">
        Steal the Old Man&apos;s Bundle
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-[#e8dcc0]/70">
        Match ranks. Grow your bundle. Steal theirs. Biggest stack wins.
      </p>

      <div className="mt-6 grid w-full max-w-lg gap-4">
        <HowToStep
          step={1}
          title="Match the table"
          body="Tap a hand card, then tap a table card of the same rank. Both go into your bundle."
        >
          <div className="flex items-center justify-center gap-2">
            <LabeledCard label="Your hand" card={demo("h7", "7", "hearts")} highlight />
            <Arrow />
            <LabeledCard label="Table" card={demo("t7", "7", "spades")} highlight />
            <Arrow />
            <BundleStack
              label="Your bundle"
              cards={[demo("b7a", "7", "spades"), demo("b7b", "7", "hearts")]}
            />
          </div>
        </HowToStep>

        <HowToStep
          step={2}
          title="Steal a bundle"
          body="If your card matches an opponent’s exposed top rank, tap their panel to steal the whole stack."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LabeledCard label="Your hand" card={demo("hq", "Q", "diamonds")} highlight />
            <Arrow />
            <div className="rounded-lg border border-[#ff2d6a]/70 bg-[#ff2d6a]/15 px-3 py-2 text-left ring-2 ring-[#ff2d6a]/40">
              <p className="text-[9px] uppercase tracking-wider text-[#ff7aa0]">
                Opponent · Steal!
              </p>
              <p className="text-[10px] text-[#e8dcc0]/80">Bundle · Top Match: Q</p>
              <div className="mt-1.5 flex -space-x-2">
                <PlayingCardView
                  card={demo("oq1", "4", "clubs")}
                  size="sm"
                  className="opacity-70"
                />
                <PlayingCardView card={demo("oq2", "Q", "clubs")} size="sm" />
              </div>
            </div>
          </div>
        </HowToStep>

        <HowToStep
          step={3}
          title="No match? Place it"
          body="If nothing matches, place your card on the table for someone else to grab later."
        >
          <div className="flex items-center justify-center gap-2">
            <LabeledCard label="Your hand" card={demo("h3", "3", "clubs")} selected />
            <Arrow />
            <LabeledCard label="Table" card={demo("t3", "3", "clubs")} />
          </div>
        </HowToStep>

        <HowToStep
          step={4}
          title="Biggest bundle wins"
          body="When the round ends, the player with the most cards in their bundle takes the pot."
        >
          <div className="flex items-end justify-center gap-4">
            <div className="text-center">
              <BundleStack
                label="You · 6"
                cards={[
                  demo("w1", "A", "spades"),
                  demo("w2", "9", "hearts"),
                  demo("w3", "9", "diamonds"),
                ]}
                emphasize
              />
            </div>
            <div className="text-center opacity-55">
              <BundleStack
                label="Them · 2"
                cards={[demo("l1", "5", "clubs"), demo("l2", "5", "spades")]}
              />
            </div>
          </div>
        </HowToStep>
      </div>

      <Button
        className="mt-8 mb-4 bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
        onClick={onStart}
        data-testid="button-deal-cards"
      >
        Deal the Cards
      </Button>
    </div>
  );
}

function HowToStep({
  step,
  title,
  body,
  children,
}: {
  step: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#d4af37]/25 bg-black/40 px-3 py-3 sm:px-4 sm:py-4">
      <div className="mb-3 flex items-start gap-3 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[11px] font-bold text-[#1a1008]">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#f7e7b0]">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[#e8dcc0]/70">{body}</p>
        </div>
      </div>
      <div className="rounded-lg border border-white/5 bg-[#0d4a2f]/15 px-2 py-3">{children}</div>
    </section>
  );
}

function LabeledCard({
  label,
  card,
  highlight,
  selected,
}: {
  label: string;
  card: PlayingCard;
  highlight?: boolean;
  selected?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#d4af37]/75">{label}</p>
      <PlayingCardView card={card} size="sm" highlight={highlight} selected={selected} />
    </div>
  );
}

function BundleStack({
  label,
  cards,
  emphasize,
}: {
  label: string;
  cards: PlayingCard[];
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className={`text-[9px] uppercase tracking-[0.2em] ${
          emphasize ? "text-[#ffd76a]" : "text-[#d4af37]/75"
        }`}
      >
        {label}
      </p>
      <div className="relative h-14 w-12">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className="absolute left-0 top-0"
            style={{ transform: `translate(${i * 4}px, ${-i * 3}px)` }}
          >
            <PlayingCardView card={c} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span className="px-0.5 text-sm font-bold text-[#d4af37]/80" aria-hidden>
      →
    </span>
  );
}
