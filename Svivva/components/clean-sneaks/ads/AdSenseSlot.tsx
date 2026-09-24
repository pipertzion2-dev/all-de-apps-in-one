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
  // Prefer a placement-specific unit. Shared fallback is only for banner — using a
  // banner slot inside interstitial/rewarded chrome is a common source of blank ads.
  return adsenseSlot(placement) || (placement === "menu_banner" ? adsenseAnySlot() : null);
}

/**
 * Only trust Google's explicit fill signal. iframe size alone is a false positive —
 * AdSense often injects a large white empty iframe without data-ad-status="filled".
 */
function looksFilled(el: HTMLElement): boolean {
  return el.getAttribute("data-ad-status") === "filled";
}

function looksUnfilled(el: HTMLElement): boolean {
  return el.getAttribute("data-ad-status") === "unfilled";
}

/**
 * Live Google AdSense unit. Requires publisher client + at least one slot id.
 * Never leaves a white blank box — only renders after a real fill; unfilled → null.
 */
export function AdSenseSlot({ placement, className, format = "auto", onFillChange }: Props) {
  const client = adsenseClientId();
  const slot = resolveSlot(placement);
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty">("idle");
  const onFillChangeRef = useRef(onFillChange);
  onFillChangeRef.current = onFillChange;

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    setStatus("loading");

    const push = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        setStatus("empty");
        onFillChangeRef.current?.(false);
        recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
      }
    };

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

  // Resolve fill vs empty — do not treat "push succeeded" as a filled creative.
  useEffect(() => {
    const el = insRef.current;
    if (!el || status === "idle" || status === "empty" || status === "ready") return;

    let settled = false;
    const markEmpty = () => {
      if (settled) return;
      settled = true;
      setStatus("empty");
      onFillChangeRef.current?.(false);
      recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
    };
    const markFilled = () => {
      if (settled) return;
      settled = true;
      setStatus("ready");
      onFillChangeRef.current?.(true);
      recordAdEvent({ placement, kind: "impression", network: "adsense" });
    };

    const applyStatus = () => {
      if (looksFilled(el)) {
        markFilled();
        return;
      }
      if (looksUnfilled(el)) {
        markEmpty();
      }
    };

    applyStatus();
    const observer = new MutationObserver(applyStatus);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status", "style", "class"],
      childList: true,
      subtree: true,
    });
    // Google often leaves a white empty unit with no data-ad-status — time out to empty.
    const timeout = window.setTimeout(() => {
      if (looksFilled(el)) markFilled();
      else markEmpty();
    }, 2200);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [status, placement]);

  // If Google later flips a "filled" unit to unfilled, tear it down (no lingering blank).
  useEffect(() => {
    const el = insRef.current;
    if (!el || status !== "ready") return;
    const observer = new MutationObserver(() => {
      if (looksUnfilled(el)) {
        setStatus("empty");
        onFillChangeRef.current?.(false);
        recordAdEvent({ placement, kind: "fill_fail", network: "adsense" });
      }
    });
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });
    return () => observer.disconnect();
  }, [status, placement]);

  if (!client || !slot || status === "empty") return null;

  // While loading, keep the probe completely off-screen — never a white card in flow.
  const probeOnly = status === "loading";

  return (
    <div
      className={probeOnly ? undefined : className}
      data-ad-status={status}
      style={
        probeOnly
          ? {
              position: "fixed",
              left: "-10000px",
              top: 0,
              width: 336,
              height: 90,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
              visibility: "hidden",
            }
          : undefined
      }
      aria-hidden={probeOnly ? true : undefined}
    >
      <ins
        ref={insRef}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: probeOnly ? 90 : 60, background: "transparent" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-testid={`adsense-${placement}`}
      />
    </div>
  );
}
