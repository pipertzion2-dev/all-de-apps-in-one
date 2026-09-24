"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adsEnabled,
  canShowPlacement,
  markAdCooldown,
  pickHouseCreative,
  recordAdEvent,
  resolveAdNetwork,
} from "@/lib/clean-sneaks/ads";
import { AdSenseSlot } from "./AdSenseSlot";

type Props = {
  requestOpen: boolean;
  onComplete: () => void;
};

/**
 * Full-screen Google AdSense break (paid) between walk complete and casino.
 * Never leave a blank “Google Advertisement” overlay when inventory does not fill.
 */
export function GameInterstitialAd({ requestOpen, onComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  /** null = waiting; true = filled; false = unfilled / skip */
  const [adsenseFilled, setAdsenseFilled] = useState<boolean | null>(null);
  const creative = useMemo(() => pickHouseCreative(Date.now() + 3), [requestOpen]);
  const network = resolveAdNetwork("run_interstitial");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const handledRef = useRef(false);
  const finishedRef = useRef(false);

  const finish = (clicked: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const net = network === "adsense" ? "adsense" : "house";
    if (clicked) {
      recordAdEvent({ placement: "run_interstitial", kind: "click", network: net });
    } else {
      recordAdEvent({ placement: "run_interstitial", kind: "dismiss", network: net });
    }
    setVisible(false);
    onCompleteRef.current();
  };

  useEffect(() => {
    if (!requestOpen) {
      handledRef.current = false;
      finishedRef.current = false;
      setVisible(false);
      setAdsenseFilled(null);
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;
    finishedRef.current = false;
    setAdsenseFilled(null);

    // Skip when ads off, cooldown, or no fillable unit (don't block casino with empty UI).
    if (!adsEnabled() || network === "unconfigured" || !canShowPlacement("run_interstitial")) {
      onCompleteRef.current();
      return;
    }

    setVisible(true);
    setCanSkip(false);
    recordAdEvent({
      placement: "run_interstitial",
      kind: "impression",
      network: network === "adsense" ? "adsense" : "house",
    });
    markAdCooldown("run_interstitial");
    const skipAt = window.setTimeout(() => setCanSkip(true), network === "adsense" ? 2200 : 1800);
    return () => window.clearTimeout(skipAt);
  }, [requestOpen, network]);

  // No AdSense creative → close immediately / after short wait (no blank modal).
  useEffect(() => {
    if (!visible || network !== "adsense") return;
    if (adsenseFilled === false) {
      finish(false);
      return;
    }
    if (adsenseFilled === true) return;
    const t = window.setTimeout(() => finish(false), 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish is stable via refs
  }, [visible, network, adsenseFilled]);

  if (!visible) return null;

  const showChrome = network !== "adsense" || adsenseFilled === true;

  return (
    <div
      className={`fixed inset-0 z-[235] flex items-center justify-center p-4 ${
        showChrome ? "bg-black/85 backdrop-blur-md" : "pointer-events-none bg-transparent"
      }`}
      role="dialog"
      aria-modal={showChrome ? true : undefined}
      aria-label="Advertisement"
      aria-hidden={showChrome ? undefined : true}
      data-testid="game-interstitial-ad"
    >
      <div
        className={`w-full max-w-lg rounded-xl border border-white/15 bg-[#0c0e14] p-5 ${
          showChrome ? "" : "max-h-[220px] overflow-hidden opacity-[0.01]"
        }`}
      >
        {showChrome && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">
              {network === "adsense" ? "Google Advertisement" : "Advertisement"}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/50"
              disabled={!canSkip}
              onClick={() => finish(false)}
              data-testid="button-skip-interstitial"
            >
              {canSkip ? "Continue" : "…"}
            </Button>
          </div>
        )}

        {network === "adsense" ? (
          <div className={showChrome ? "mt-4 min-h-[180px]" : "min-h-[180px]"}>
            <AdSenseSlot
              placement="run_interstitial"
              className="min-h-[180px] w-full"
              format="auto"
              onFillChange={setAdsenseFilled}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-white/10 p-5 text-center">
            <p className="text-lg font-medium" style={{ color: creative.accent }}>
              {creative.headline}
            </p>
            <p className="mt-2 text-sm text-white/60">{creative.body}</p>
            <Button
              className="mt-5"
              style={{ background: creative.accent, color: "#0a0c10" }}
              asChild
            >
              <Link
                href={creative.href}
                onClick={() => finish(true)}
                data-testid="interstitial-cta"
              >
                {creative.cta}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
