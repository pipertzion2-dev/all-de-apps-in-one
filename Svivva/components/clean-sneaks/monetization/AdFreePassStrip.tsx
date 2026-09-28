"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AD_FREE_CASHAPP_DOLLARS,
  cashAppAdFreeUrl,
  grantAdFreePass,
  readAdFreePass,
} from "@/lib/clean-sneaks/monetization/ad-free-pass";
import { PRODUCT_TAGLINE } from "@/lib/product-positioning";

type Props = {
  className?: string;
  onActivated?: () => void;
};

/** $5 one-time Cash App — no in-game ads on this device. */
export function AdFreePassStrip({ className, onActivated }: Props) {
  const [active, setActive] = useState(() => readAdFreePass());
  const [showConfirm, setShowConfirm] = useState(false);

  const openCashApp = useCallback(() => {
    window.open(cashAppAdFreeUrl(), "_blank", "noopener,noreferrer");
    setShowConfirm(true);
  }, []);

  const confirmPaid = useCallback(() => {
    grantAdFreePass();
    setActive(true);
    setShowConfirm(false);
    onActivated?.();
  }, [onActivated]);

  if (active) {
    return (
      <p
        className={`text-center text-[10px] text-[#7dffb2]/90 ${className ?? ""}`}
        data-testid="ad-free-active"
      >
        Ad-free — {PRODUCT_TAGLINE}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-1.5 text-center ${className ?? ""}`}
      data-testid="ad-free-pass-strip"
    >
      <p className="text-[10px] leading-snug text-[#e8dcc0]/55">
        Free to play · ads fund the walk. Rest while the sap runs — or go ad-free.
      </p>
      {!showConfirm ? (
        <Button
          type="button"
          variant="outline"
          className="h-8 border-[#00D632]/45 px-3 text-[11px] text-[#00D632]"
          onClick={openCashApp}
          data-testid="button-adfree-cashapp"
        >
          No ads — ${AD_FREE_CASHAPP_DOLLARS} once · Cash App
        </Button>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            className="h-8 bg-[#00D632] px-3 text-[11px] text-black"
            onClick={confirmPaid}
            data-testid="button-adfree-confirm"
          >
            I paid — remove ads
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-[11px] text-[#e8dcc0]/50"
            onClick={() => setShowConfirm(false)}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
