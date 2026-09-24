"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  canShowPlacement,
  houseAdsAllowed,
  markAdCooldown,
  pickHouseCreative,
  recordAdEvent,
  resolveAdNetwork,
} from "@/lib/clean-sneaks/ads";
import {
  claimAdBonus,
  claimBaseReward,
  describeLines,
  makeClaimId,
  trackMonetization,
  type RewardedOffer,
} from "@/lib/clean-sneaks/monetization";
import { AdSenseSlot } from "@/components/clean-sneaks/ads/AdSenseSlot";
import { HouseAdCreative } from "@/components/clean-sneaks/ads/HouseAdCreative";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  offer: RewardedOffer | null;
  /** When no ad offer, still allow claiming base. */
  baseOnlyClaimId?: string;
  onClose: () => void;
  onClaimed?: () => void;
};

/**
 * JOB/MISSION style dual CTA:
 * [CLAIM base] always available
 * [WATCH AD — CLAIM bonus] opt-in; shows Google when it fills, otherwise a ZZAI house ad
 * so players always see a real creative (never a blank white box).
 */
export function RewardClaimModal({
  open,
  title,
  subtitle,
  offer,
  baseOnlyClaimId,
  onClose,
  onClaimed,
}: Props) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** null = waiting; true = Google filled; false = unfilled */
  const [adsenseFilled, setAdsenseFilled] = useState<boolean | null>(null);
  const [forceHouse, setForceHouse] = useState(false);
  const preferred = resolveAdNetwork("rewarded_credits");
  const network: "adsense" | "house" | "unconfigured" = forceHouse
    ? "house"
    : preferred === "unconfigured" && houseAdsAllowed()
      ? "house"
      : preferred;
  const creative = useMemo(() => pickHouseCreative(Date.now() + 3), [open]);

  useEffect(() => {
    if (!open) {
      setWatching(false);
      setProgress(0);
      setDone(false);
      setMessage(null);
      setAdsenseFilled(null);
      setForceHouse(false);
    } else if (offer) {
      trackMonetization("rewarded_ad_offered", { context: offer.context, offerId: offer.offerId });
    }
  }, [open, offer]);

  // Blank AdSense → house creative (player still sees an ad and can earn the bonus).
  useEffect(() => {
    if (!watching || preferred !== "adsense" || forceHouse) return;
    if (adsenseFilled !== false) return;
    if (houseAdsAllowed()) {
      setForceHouse(true);
      setAdsenseFilled(null);
      recordAdEvent({ placement: "rewarded_credits", kind: "impression", network: "house" });
      trackMonetization("rewarded_ad_failed", { reason: "adsense_unfilled_house_fallback" });
      return;
    }
    setWatching(false);
    setProgress(0);
    setDone(false);
    setAdsenseFilled(null);
    setMessage("Ad didn’t load — claim your normal reward.");
    trackMonetization("rewarded_ad_failed", { reason: "adsense_unfilled" });
  }, [watching, preferred, adsenseFilled, forceHouse]);

  useEffect(() => {
    if (!watching || done) return;
    // AdSense path: wait for fill (or house fallback) before starting the watch timer.
    if (network === "adsense" && adsenseFilled !== true) return;

    const started = Date.now();
    const needMs = network === "adsense" ? 5500 : 3500;
    trackMonetization("rewarded_ad_started", { context: offer?.context || "unknown" });
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / needMs);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(tick);
        setDone(true);
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [watching, done, network, adsenseFilled, offer?.context]);

  const claimBase = useCallback(() => {
    if (!offer && !baseOnlyClaimId) {
      onClose();
      return;
    }
    if (offer) {
      // Mission/walk credits are already in the wallet — acknowledging must not double-pay.
      if (offer.context === "mission_complete") {
        trackMonetization("mission_completed", {
          amount: offer.baseLines[0]?.amount ?? 0,
        });
        onClaimed?.();
        onClose();
        return;
      }
      if (offer.baseLines.length) {
        const claimId = makeClaimId(["base", offer.offerId]);
        const result = claimBaseReward({
          claimId,
          source: offer.context === "offline_boost" ? "offline" : "mission",
          lines: offer.baseLines,
        });
        if (!result.ok) {
          setMessage(result.reason);
          return;
        }
      }
    }
    onClaimed?.();
    onClose();
  }, [offer, baseOnlyClaimId, onClose, onClaimed]);

  const startAd = () => {
    if (!offer) return;
    if (network === "unconfigured") {
      setMessage("Ads unavailable right now — claim your normal reward.");
      trackMonetization("rewarded_ad_failed", { reason: "unconfigured" });
      return;
    }
    if (!canShowPlacement("rewarded_credits")) {
      setMessage("Ad bonus cooling down — claim your normal reward.");
      return;
    }
    setAdsenseFilled(null);
    setForceHouse(network === "house");
    setProgress(0);
    setDone(false);
    setWatching(true);
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "impression",
      network: network === "adsense" ? "adsense" : "house",
    });
  };

  const claimAd = () => {
    if (!offer || !done) return;
    if (network === "adsense" && adsenseFilled !== true) {
      setMessage("Ad didn’t load — claim your normal reward.");
      return;
    }
    const result = claimAdBonus({ offer, token: offer.token, adCompleted: true });
    if (!result.ok) {
      setMessage(result.reason);
      trackMonetization("rewarded_ad_failed", { reason: result.reason });
      return;
    }
    trackMonetization("rewarded_ad_completed", { offerId: offer.offerId });
    trackMonetization("ad_bonus_claimed", {
      offerId: offer.offerId,
      preview: describeLines(offer.previewLines),
    });
    recordAdEvent({
      placement: "rewarded_credits",
      kind: "reward_granted",
      network: network === "adsense" ? "adsense" : "house",
    });
    markAdCooldown("rewarded_credits");
    onClaimed?.();
    onClose();
  };

  if (!open) return null;

  const baseText = offer?.baseLabel || "CLAIM";
  const adText = offer?.adLabel || "WATCH AD";
  const showHouse = network === "house";
  const showAdsenseChrome = network === "adsense" && adsenseFilled === true;
  const waitingForFill = network === "adsense" && watching && adsenseFilled !== true;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      data-testid="reward-claim-modal"
    >
      <div className="w-full max-w-md rounded-xl border border-[#d4af37]/40 bg-[#0c0a08] p-5 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">{title}</p>
        {subtitle && <p className="mt-2 text-sm text-[#e8dcc0]/70">{subtitle}</p>}

        {offer && offer.baseLines.length > 0 && (
          <p className="mt-4 font-serif text-2xl text-[#ffd76a]" data-testid="reward-base-amount">
            Normal Reward: {describeLines(offer.baseLines)}
          </p>
        )}

        {!watching ? (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
              onClick={claimBase}
              data-testid="button-claim-base-reward"
            >
              {baseText}
            </Button>
            {offer && (
              <Button
                variant="outline"
                className="border-[#ffd76a]/45 text-[#ffd76a]"
                onClick={startAd}
                data-testid="button-watch-ad-bonus"
              >
                {adText}
              </Button>
            )}
            <Button variant="ghost" className="text-[#e8dcc0]/50" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#e8dcc0]/65">
              Bonus if completed: {offer ? describeLines(offer.previewLines) : ""}
            </p>
            {showHouse ? (
              <HouseAdCreative
                creative={creative}
                variant="featured"
                data-testid="reward-house-ad"
              />
            ) : (
              <>
                {adsenseFilled !== false && (
                  <AdSenseSlot
                    placement="rewarded_credits"
                    className={showAdsenseChrome ? "min-h-[120px] w-full" : undefined}
                    onFillChange={setAdsenseFilled}
                  />
                )}
                {waitingForFill && (
                  <p
                    className="text-center text-xs text-[#e8dcc0]/50"
                    data-testid="reward-ad-loading"
                  >
                    Loading ad…
                  </p>
                )}
              </>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#d4af37]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <Button
              className="w-full bg-[#d4af37] text-[#1a1008]"
              disabled={!done || (network === "adsense" && adsenseFilled !== true)}
              onClick={claimAd}
              data-testid="button-claim-ad-bonus"
            >
              {done ? "Claim bonus" : waitingForFill ? "Waiting for ad…" : "Watching…"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[#e8dcc0]/55"
              onClick={() => {
                setWatching(false);
                setProgress(0);
                setDone(false);
                setAdsenseFilled(null);
                setForceHouse(false);
                trackMonetization("rewarded_ad_failed", { reason: "closed_early" });
              }}
            >
              Cancel ad — keep normal reward
            </Button>
          </div>
        )}

        {message && <p className="mt-3 text-center text-xs text-[#ff6b8a]">{message}</p>}
      </div>
    </div>
  );
}
