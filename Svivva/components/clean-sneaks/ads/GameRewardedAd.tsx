"use client";

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
import { HouseAdCreative } from "./HouseAdCreative";

type Props = {
  open: boolean;
  onClose: () => void;
  onRewarded?: (credits: number) => void;
};

/**
 * Rewarded placement — Google AdSense display unit (paid to you) + casino credits for the player.
 */
export function GameRewardedAd({ open, onClose, onRewarded }: Props) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [blockedMs, setBlockedMs] = useState(0);
  const [adsenseFilled, setAdsenseFilled] = useState<boolean | null>(null);
  const creative = useMemo(() => pickHouseCreative(Date.now() + 7), [open]);
  const network = resolveAdNetwork("rewarded_credits");
  const credits = rewardedCreditsAmount();

  useEffect(() => {
    if (!open) {
      setWatching(false);
      setProgress(0);
      setDone(false);
      setAdsenseFilled(null);
      return;
    }
    setBlockedMs(cooldownRemainingMs("rewarded_credits"));
    setAdsenseFilled(null);
  }, [open]);

  useEffect(() => {
    if (!watching || done) return;
    const started = Date.now();
    // Real AdSense needs a bit longer for a fill; house is shorter.
    const needMs = network === "adsense" ? 5500 : 3500;
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
    if (!adsEnabled() || network === "unconfigured") return;
    if (!canShowPlacement("rewarded_credits")) return;
    setWatching(true);
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "impression",
      network: network === "adsense" ? "adsense" : "house",
    });
  }, [network]);

  const claim = useCallback(() => {
    if (!done) return;
    addSessionCredits(credits);
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "reward_granted",
      network: network === "adsense" ? "adsense" : "house",
    });
    markAdCooldown("rewarded_credits");
    onRewarded?.(credits);
    onClose();
  }, [done, credits, network, onRewarded, onClose]);

  useEffect(() => {
    if (!open) return;
    if (!adsEnabled() || network === "unconfigured") {
      onClose();
    }
  }, [open, network, onClose]);

  if (!open || !adsEnabled() || network === "unconfigured") return null;

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
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">
          {network === "adsense" ? "Google Ad · Earn" : "Sponsored · Earn"}
        </p>
        <h3 className="mt-2 font-serif text-2xl text-[#f7e7b0]">+{credits} casino credits</h3>
        <p className="mt-2 text-sm text-[#e8dcc0]/70">
          Watch the ad. Players get chips; AdSense pays your publisher account.
        </p>

        {onCooldown ? (
          <p className="mt-4 text-sm text-white/50" data-testid="rewarded-cooldown">
            Next bonus in {Math.ceil(blockedMs / 1000)}s
          </p>
        ) : !watching ? (
          <div className="mt-5 space-y-3">
            {network === "adsense" ? (
              adsenseFilled === false ? null : (
                <AdSenseSlot
                  placement="rewarded_credits"
                  className="min-h-[120px] w-full"
                  onFillChange={setAdsenseFilled}
                />
              )
            ) : (
              <HouseAdCreative
                creative={creative}
                variant="featured"
                data-testid="rewarded-house-ad"
              />
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
            {network === "adsense" ? (
              adsenseFilled === false ? null : (
                <AdSenseSlot
                  placement="rewarded_credits"
                  className="min-h-[140px] w-full"
                  onFillChange={setAdsenseFilled}
                />
              )
            ) : (
              <HouseAdCreative
                creative={creative}
                variant="featured"
                onCtaClick={() =>
                  recordAdEvent({
                    placement: "rewarded_credits",
                    kind: "click",
                    network: "house",
                  })
                }
                data-testid="rewarded-house-ad-watching"
              />
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
