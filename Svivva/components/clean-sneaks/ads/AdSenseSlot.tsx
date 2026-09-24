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
  /** Called when Google reports fill vs unfilled (so parent chrome can hide). */
  onFillChange?: (filled: boolean) => void;
};

function resolveSlot(placement: AdPlacementId): string | null {
  return adsenseSlot(placement) || adsenseAnySlot();
}

/**
 * Live Google AdSense unit. Requires publisher client + at least one slot id.
 * Missing config or unfilled inventory renders nothing — never leave a blank box.
 * Configure slots in Orbit → AdSense (or Vercel NEXT_PUBLIC_ADSENSE_SLOT_*).
 */
export function AdSenseSlot({ placement, className, format = "auto", onFillChange }: Props) {
  const client = adsenseClientId();
  const slot = resolveSlot(placement);
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);
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
        onFillChange?.(false);
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
  }, [client, slot, placement, onFillChange]);

  // Google sets data-ad-status="unfilled" when there is no creative — collapse the blank unit.
  useEffect(() => {
    const el = insRef.current;
    if (!el || status === "idle" || status === "empty") return;

    const applyStatus = () => {
      const adStatus = el.getAttribute("data-ad-status");
      if (adStatus === "unfilled") {
        setStatus("empty");
        onFillChange?.(false);
        recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
        return;
      }
      if (adStatus === "filled") {
        setStatus("ready");
        onFillChange?.(true);
      }
    };

    applyStatus();
    const observer = new MutationObserver(applyStatus);
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    const timeout = window.setTimeout(applyStatus, 4000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [status, placement, onFillChange]);

  // Silent no-op for visitors when Orbit/Vercel slots are not set yet, or Google returned no fill.
  if (!client || !slot || status === "empty") return null;

  return (
    <div className={className} data-ad-status={status}>
      <ins
        ref={insRef}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: status === "loading" ? 60 : undefined }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-testid={`adsense-${placement}`}
      />
    </div>
  );
}
