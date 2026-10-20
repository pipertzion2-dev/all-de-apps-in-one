"use client";

import { useState } from "react";
import { programmaticNetwork } from "@/lib/clean-sneaks/ads/programmatic";
import {
  kleanInGameUsesAdsense,
  GOOGLE_ADS_TROUBLESHOOTING,
} from "@/lib/clean-sneaks/ads/google-in-game";

type Props = { className?: string };

/** Explains why Google in-game ads are off by default and which free network to use. */
export function GameAdNetworkHint({ className }: Props) {
  const [open, setOpen] = useState(false);
  const alt = programmaticNetwork();

  return (
    <div className={`text-left ${className ?? ""}`} data-testid="game-ad-network-hint">
      <button
        type="button"
        className="text-[10px] text-[#e8dcc0]/45 underline-offset-2 hover:text-[#7EC8D9]/80 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide" : "Why not Google ads?"}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 rounded border border-white/10 bg-black/50 px-2.5 py-2 text-[10px] leading-relaxed text-[#e8dcc0]/70">
          {!kleanInGameUsesAdsense() && (
            <p>
              <strong className="text-[#ffd76a]">In-game AdSense is off by default</strong> — site
              verification can work while game units stay blank. You see house sponsors or a free
              network instead.
            </p>
          )}
          {alt && kleanInGameUsesAdsense() ? (
            <p>
              Paid inventory rotates between <strong className="text-[#7dffb2]">Google AdSense</strong>{" "}
              and <strong className="text-[#7dffb2]">{alt}</strong>. House sponsors only fill when a
              network returns no ad.
            </p>
          ) : alt ? (
            <p>
              Active alt network: <strong className="text-[#7dffb2]">{alt}</strong> (real CPM payouts).
            </p>
          ) : (
            <p>
              <strong className="text-[#7dffb2]">Free option:</strong> sign up at{" "}
              <a
                href="https://monetag.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7EC8D9] underline"
              >
                Monetag
              </a>{" "}
              or{" "}
              <a
                href="https://www.adsterra.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7EC8D9] underline"
              >
                Adsterra
              </a>
              , create a banner tag, set{" "}
              <code className="text-[#ffd76a]">NEXT_PUBLIC_MONETAG_ZONE_ID</code> or{" "}
              <code className="text-[#ffd76a]">NEXT_PUBLIC_ADSTERRA_INVOKE_URL</code> in Vercel,
              redeploy.
            </p>
          )}
          <ul className="list-disc pl-4">
            {GOOGLE_ADS_TROUBLESHOOTING.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
