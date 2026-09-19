"use client";

import { useEffect, useRef } from "react";
import {
  adsenseClientId,
  adsenseSlot,
  recordAdEvent,
  type AdPlacementId,
} from "@/lib/clean-sneaks/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  placement: AdPlacementId;
  className?: string;
  /** AdSense format hint — auto is fine for responsive banners. */
  format?: string;
};

/**
 * Renders a live AdSense unit when client + slot env vars are set.
 * Parent should only mount this when resolveAdNetwork(placement) === "adsense".
 */
export function AdSenseSlot({ placement, className, format = "auto" }: Props) {
  const client = adsenseClientId();
  const slot = adsenseSlot(placement);
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      recordAdEvent({ placement, kind: "impression", network: "adsense" });
    } catch {
      recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
    }
  }, [client, slot, placement]);

  if (!client || !slot) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      data-testid={`adsense-${placement}`}
    />
  );
}
