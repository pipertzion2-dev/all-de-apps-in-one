"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adsEnabled,
  canShowPlacement,
  cooldownRemainingMs,
  markAdCooldown,
  pickHouseCreative,
  recordAdEvent,
  resolveAdNetwork,
  rewardedCreditsAmount,
} from "@/lib/clean-sneaks/ads";
import { addSessionCredits } from "@/lib/clean-sneaks/casino";
import { AdSenseSlot } from "./AdSenseSlot";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after credits are granted. */
  onRewarded?: (credits: number) => void;
};

/**
 * Rewarded placement — watch a short sponsor / AdSense unit, earn casino credits.
 * Real money lands in your AdSense account; players get soft currency.
 */
export function GameRewardedAd({ open, onClose, onRewarded }: Props) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [blockedMs, setBlockedMs] = useState(0);
  const creative = useMemo(() => pickHouseCreative(Date.now() + 7), [open]);
  const network = resolveAdNetwork("rewarded_credits");
  const credits = rewardedCreditsAmount();

  useEffect(() => {
    if (!open) {
      setWatching(false);
      setProgress(0);
      setDone(false);
      return;
    }
    setBlockedMs(cooldownRemainingMs("rewarded_credits"));
  }, [open]);

  useEffect(() => {
    if (!watching || done) return;
    const started = Date.now();
    const needMs = network === "adsense" ? 5000 : 3500;
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / needMs);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(tick);
        setDone(true);
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [watching, done, network]);

  const startWatch = useCallback(() => {
    if (!adsEnabled() || !canShowPlacement("rewarded_credits")) return;
    setWatching(true);
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "impression",
      network,
    });
  }, [network]);

  const claim = useCallback(() => {
    if (!done) return;
    addSessionCredits(credits);
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "reward_granted",
      network,
    });
    markAdCooldown("rewarded_credits");
    onRewarded?.(credits);
    onClose();
  }, [done, credits, network, onRewarded, onClose]);

  if (!open || !adsEnabled()) return null;

  const onCooldown = blockedMs > 0 && !watching;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Rewarded advertisement"
      data-testid="game-rewarded-ad"
    >
      <div className="w-full max-w-md rounded-xl border border-[#d4af37]/35 bg-[#0e1016] p-5 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">Sponsored · Earn</p>
        <h3 className="mt-2 font-serif text-2xl text-[#f7e7b0]">+{credits} casino credits</h3>
        <p className="mt-2 text-sm text-[#e8dcc0]/70">
          Watch a short ad. You keep the chips; AdSense pays the game when live ads are connected.
        </p>

        {onCooldown ? (
          <p className="mt-4 text-sm text-white/50" data-testid="rewarded-cooldown">
            Next bonus in {Math.ceil(blockedMs / 1000)}s
          </p>
        ) : !watching ? (
          <div className="mt-5 space-y-3">
            {network === "adsense" ? (
              <AdSenseSlot placement="rewarded_credits" className="min-h-[120px] w-full" />
            ) : (
              <div
                className="rounded-lg border border-white/10 p-4"
                style={{ borderColor: `${creative.accent}55` }}
              >
                <p className="text-sm font-medium" style={{ color: creative.accent }}>
                  {creative.headline}
                </p>
                <p className="mt-1 text-xs text-white/55">{creative.body}</p>
              </div>
            )}
            <Button
              className="w-full bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
              onClick={startWatch}
              data-testid="button-watch-rewarded-ad"
            >
              Watch ad
            </Button>
            <Button variant="ghost" className="w-full text-white/50" onClick={onClose}>
              Not now
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {network === "house" && (
              <Link
                href={creative.href}
                className="block rounded-lg border border-white/10 p-4 transition hover:border-white/25"
                onClick={() =>
                  recordAdEvent({
                    placement: "rewarded_credits",
                    kind: "click",
                    network: "house",
                  })
                }
              >
                <p className="text-sm font-medium" style={{ color: creative.accent }}>
                  {creative.headline}
                </p>
                <p className="mt-1 text-xs text-white/55">{creative.body}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wider text-white/40">
                  {creative.cta} →
                </p>
              </Link>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#d4af37] transition-[width] duration-100"
                style={{ width: `${Math.round(progress * 100)}%` }}
                data-testid="rewarded-progress"
              />
            </div>
            <Button
              className="w-full bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
              disabled={!done}
              onClick={claim}
              data-testid="button-claim-rewarded-credits"
            >
              {done ? `Claim +${credits} credits` : "Watching…"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
