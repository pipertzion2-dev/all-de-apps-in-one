"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { STEAL_BUNDLE_TITLE_ART_URL } from "@/lib/clean-sneaks/assets";
import { STEAL_BUNDLE_GERMAN_TITLE, KLEAN_BUNDLE_CARD_HEADLINE } from "@/lib/clean-sneaks/game-copy";
import { STEAL_BUNDLE_THEME } from "@/lib/clean-sneaks/casino/theme";

type Props = {
  onContinue: () => void;
};

/**
 * Full-bleed title graphic shown once before Steal Bundle howto / deal.
 * Matches the glitch / film-strip main art for "Stiehl den alten Manns Bündel".
 */
export function StealBundleTitleScreen({ onContinue }: Props) {
  const [ready, setReady] = useState(false);
  const [glitch, setGlitch] = useState(0);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setReady(true);
    img.onerror = () => setReady(true);
    img.src = STEAL_BUNDLE_TITLE_ART_URL;
  }, []);

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      // Occasional horizontal jitter — presence without noise spam
      setGlitch(frame % 11 === 0 ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0);
    }, 180);
    return () => window.clearInterval(id);
  }, [ready]);

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="steal-bundle-title-screen"
      style={{ background: STEAL_BUNDLE_THEME.bgDeep }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STEAL_BUNDLE_TITLE_ART_URL}
        alt={STEAL_BUNDLE_GERMAN_TITLE}
        draggable={false}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
        style={{
          opacity: ready ? 1 : 0,
          transform: `translateX(${glitch}px)`,
          filter: "contrast(1.05) saturate(1.08)",
        }}
        data-testid="img-steal-bundle-title-art"
      />

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.65'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Film-strip sprocket edge */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] flex w-5 flex-col justify-around sm:w-6"
        aria-hidden
        style={{ background: "rgba(169,146,193,0.22)" }}
      >
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className="mx-auto block h-2.5 w-2.5 rounded-[2px] bg-[#E5E4C2]/85 sm:h-3 sm:w-3"
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(18,12,24,0.15) 0%, transparent 28%, transparent 55%, rgba(18,12,24,0.88) 100%)",
        }}
      />

      <div
        className="relative z-10 mt-auto flex flex-col items-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-center"
      >
        <p
          className="font-serif text-lg leading-tight tracking-wide sm:text-xl"
          style={{ color: STEAL_BUNDLE_THEME.lavenderSoft }}
          data-testid="text-steal-bundle-german-title"
        >
          {STEAL_BUNDLE_GERMAN_TITLE}
        </p>
        <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: STEAL_BUNDLE_THEME.sage }}>
          {KLEAN_BUNDLE_CARD_HEADLINE}
        </p>
        <Button
          className="mt-1 min-w-[200px] font-serif text-base hover:brightness-110"
          style={{
            background: STEAL_BUNDLE_THEME.sage,
            color: STEAL_BUNDLE_THEME.bgDeep,
          }}
          onClick={onContinue}
          data-testid="button-enter-steal-bundle"
        >
          Enter the table
        </Button>
        <p
          className="animate-pulse text-[10px] uppercase tracking-[0.32em]"
          style={{ color: "rgba(229,228,194,0.65)" }}
        >
          Tap to continue
        </p>
      </div>
    </div>
  );
}
