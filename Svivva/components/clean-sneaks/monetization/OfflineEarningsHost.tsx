"use client";

import { useEffect, useState } from "react";
import {
  computeOfflineEarnings,
  offlineAdOffer,
  touchLastSeen,
  trackMonetization,
  type RewardedOffer,
} from "@/lib/clean-sneaks/monetization";
import { RewardClaimModal } from "./RewardClaimModal";

/**
 * Shows once when the player returns after being away long enough.
 * Base claim / ad boost are handled solely by RewardClaimModal (idempotent offer ids).
 */
export function OfflineEarningsHost() {
  const [offer, setOffer] = useState<RewardedOffer | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const calc = computeOfflineEarnings();
    if (calc.eligible) {
      const o = offlineAdOffer();
      setOffer(o);
      setOpen(true);
    } else {
      touchLastSeen();
    }
    const onHide = () => touchLastSeen();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  return (
    <RewardClaimModal
      open={open}
      title="While You Were Away"
      subtitle={
        offer
          ? `You earned ${offer.baseLines[0]?.amount?.toLocaleString() ?? 0} on the corner.`
          : undefined
      }
      offer={offer}
      onClose={() => {
        setOpen(false);
        touchLastSeen();
      }}
      onClaimed={() => {
        trackMonetization("offline_reward_claimed", {});
        touchLastSeen();
      }}
    />
  );
}
