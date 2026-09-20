"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
        Add your AdSense publisher id in Orbit → AdSense (or NEXT_PUBLIC_ADSENSE_CLIENT).
      </p>
    );
  }

  if (!slot) {
    return (
      <div className="space-y-2 text-xs text-white/55" data-testid="adsense-missing-slot">
        <p>
          Create a <strong className="text-white/80">Display</strong> ad unit in AdSense, then paste
          the slot number in Orbit → AdSense (Banner). Auto ads can still run site-wide without
          this.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a
            href="https://adsense.google.com/adsense/new/myads/units"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7EC8D9] underline-offset-2 hover:underline"
            data-testid="adsense-open-create-unit"
          >
            AdSense → By ad unit
          </a>
          <Link
            href="/dashboard/launchpad"
            className="text-[#ffd76a] underline-offset-2 hover:underline"
            data-testid="adsense-open-orbit"
          >
            Paste slot in Orbit
          </Link>
        </div>
      </div>
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
