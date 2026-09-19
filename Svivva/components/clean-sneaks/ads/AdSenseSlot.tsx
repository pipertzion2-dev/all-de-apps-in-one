"use client";

import { useEffect, useRef, useState } from "react";
import {
  adsenseAnySlot,
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

function resolveSlot(placement: AdPlacementId): string | null {
  return adsenseSlot(placement) || adsenseAnySlot();
}

/**
 * Live Google AdSense unit. Requires NEXT_PUBLIC_ADSENSE_CLIENT and at least
 * one slot id (placement-specific or shared).
 */
export function AdSenseSlot({ placement, className, format = "auto" }: Props) {
  const client = adsenseClientId();
  const slot = resolveSlot(placement);
  const pushed = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty">("idle");

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    setStatus("loading");

    const push = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setStatus("ready");
        recordAdEvent({ placement, kind: "impression", network: "adsense" });
      } catch {
        setStatus("empty");
        recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
      }
    };

    // Wait for adsbygoogle.js if the script tag is still loading.
    if (window.adsbygoogle) {
      push();
      return;
    }
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (window.adsbygoogle || tries > 40) {
        window.clearInterval(id);
        push();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [client, slot, placement]);

  if (!client) {
    return (
      <p className="text-xs text-white/45" data-testid="adsense-missing-client">
        Add NEXT_PUBLIC_ADSENSE_CLIENT in Vercel to show paid ads.
      </p>
    );
  }

  if (!slot) {
    return (
      <p className="text-xs text-white/45" data-testid="adsense-missing-slot">
        Create a Display ad unit in AdSense and set NEXT_PUBLIC_ADSENSE_SLOT_BANNER (or enable Auto
        ads in the AdSense console).
      </p>
    );
  }

  return (
    <div className={className} data-ad-status={status}>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: 60 }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-testid={`adsense-${placement}`}
      />
    </div>
  );
}
