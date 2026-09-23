"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PARLAY_LEGS,
  PARLAY_MAX_LEGS,
  PARLAY_MIN_LEGS,
  PARLAY_MIN_STAKE,
  canPlaceParlay,
  placeParlay,
  potentialPayout,
  type ParlayLegId,
  type ParlayTicket,
} from "@/lib/clean-sneaks/casino/parlay";

type Props = {
  credits: number;
  disabled?: boolean;
  onPlaced: (ticket: ParlayTicket, creditsAfter: number) => void;
  onSkip: () => void;
};

export function ParlayDesk({ credits, disabled, onPlaced, onSkip }: Props) {
  const [selected, setSelected] = useState<ParlayLegId[]>([]);
  const [stake, setStake] = useState(Math.min(credits, Math.max(PARLAY_MIN_STAKE, 50)));
  const [error, setError] = useState<string | null>(null);

  const odds = useMemo(() => potentialPayout(stake, selected) / Math.max(1, stake), [stake, selected]);
  const payout = useMemo(() => potentialPayout(stake, selected), [stake, selected]);

  const toggle = (id: ParlayLegId) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= PARLAY_MAX_LEGS) return prev;
      return [...prev, id];
    });
  };

  const submit = () => {
    const check = canPlaceParlay(credits, stake, selected);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    const placed = placeParlay(credits, stake, selected);
    if (!placed.ok) {
      setError(placed.reason);
      return;
    }
    onPlaced(placed.ticket, placed.creditsAfter);
  };

  return (
    <div
      className="flex max-h-full w-full max-w-lg flex-col gap-4 overflow-y-auto px-4 py-6 text-left"
      data-testid="parlay-desk"
    >
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">Parlay desk</p>
        <h2 className="mt-1 font-serif text-2xl text-[#f7e7b0]">Build a credit parlay</h2>
        <p className="mt-2 text-xs text-[#e8dcc0]/65">
          Multi-leg bets settle in entertainment credits only — never cash. Pick {PARLAY_MIN_LEGS}–
          {PARLAY_MAX_LEGS} legs.
        </p>
      </div>

      <div className="grid gap-2">
        {PARLAY_LEGS.map((leg) => {
          const on = selected.includes(leg.id);
          return (
            <button
              key={leg.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(leg.id)}
              className={`rounded-md border px-3 py-2 text-left transition ${
                on
                  ? "border-[#d4af37] bg-[#d4af37]/15 text-[#ffd76a]"
                  : "border-[#d4af37]/25 bg-black/30 text-[#e8dcc0]/85 hover:border-[#d4af37]/50"
              }`}
              data-testid={`parlay-leg-${leg.id}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{leg.label}</span>
                <span className="text-[11px] tabular-nums text-[#d4af37]">{leg.odds.toFixed(2)}×</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#e8dcc0]/50">{leg.hint}</p>
            </button>
          );
        })}
      </div>

      <label className="block text-xs text-[#e8dcc0]/70">
        Stake (min {PARLAY_MIN_STAKE}) · you have {credits.toLocaleString()}
        <input
          type="number"
          min={PARLAY_MIN_STAKE}
          max={credits}
          value={stake}
          disabled={disabled}
          onChange={(e) => setStake(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="mt-1 w-full rounded-md border border-[#d4af37]/35 bg-black/40 px-3 py-2 text-sm text-[#ffd76a]"
          data-testid="parlay-stake"
        />
      </label>

      <p className="text-center text-sm text-[#ffd76a]" data-testid="parlay-payout-preview">
        {selected.length >= PARLAY_MIN_LEGS
          ? `${selected.length} legs · ${odds.toFixed(2)}× · payout ${payout.toLocaleString()} credits`
          : `Select at least ${PARLAY_MIN_LEGS} legs`}
      </p>

      {error && (
        <p className="text-center text-xs text-[#ff6b8a]" data-testid="parlay-error">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
          disabled={disabled || selected.length < PARLAY_MIN_LEGS}
          onClick={submit}
          data-testid="button-place-parlay"
        >
          Place parlay
        </Button>
        <Button
          variant="outline"
          className="border-[#d4af37]/40 text-[#e8dcc0]"
          disabled={disabled}
          onClick={onSkip}
          data-testid="button-skip-parlay"
        >
          Skip — play without parlay
        </Button>
      </div>
    </div>
  );
}
