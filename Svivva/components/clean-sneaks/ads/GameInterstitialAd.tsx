"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adsEnabled,
  adsenseUnitReady,
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
 */
export function GameInterstitialAd({ requestOpen, onComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const creative = useMemo(() => pickHouseCreative(Date.now() + 3), [requestOpen]);
  const network = resolveAdNetwork("run_interstitial");
  const unitReady = adsenseUnitReady("run_interstitial");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const handledRef = useRef(false);

  useEffect(() => {
    if (!requestOpen) {
      handledRef.current = false;
      setVisible(false);
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    // Skip when ads off, cooldown, or AdSense not configured (don't block casino).
    // Publisher-only (Auto ads) has no Display slot yet — skip the empty unit dialog.
    if (
      !adsEnabled() ||
      network === "unconfigured" ||
      !canShowPlacement("run_interstitial") ||
      (network === "adsense" && !unitReady)
    ) {
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
  }, [requestOpen, network, unitReady]);

  const finish = (clicked: boolean) => {
    const net = network === "adsense" ? "adsense" : "house";
    if (clicked) {
      recordAdEvent({ placement: "run_interstitial", kind: "click", network: net });
    } else {
      recordAdEvent({ placement: "run_interstitial", kind: "dismiss", network: net });
    }
    setVisible(false);
    onCompleteRef.current();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[235] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
      data-testid="game-interstitial-ad"
    >
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0c0e14] p-5">
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

        {network === "adsense" ? (
          <div className="mt-4 min-h-[180px]">
            <AdSenseSlot
              placement="run_interstitial"
              className="min-h-[180px] w-full"
              format="auto"
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
