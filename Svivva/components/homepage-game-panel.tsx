"use client";

import dynamic from "next/dynamic";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { Button } from "@/components/ui/button";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

type HomepageGamePanelProps = {
  journeyMode?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onEnterGame?: () => void;
};

/** Game face — Steal the old man&apos;s bundle cube; tap to open the full game. */
export function HomepageGamePanel({
  journeyMode = false,
  onBack,
  onNext,
  onEnterGame,
}: HomepageGamePanelProps) {
  const enterGame = onEnterGame;

  return (
    <section
      data-homepage-scroll-panel={journeyMode ? undefined : ""}
      className={`relative flex flex-col overflow-hidden bg-black ${
        journeyMode ? "min-h-[60svh]" : "homepage-scroll-panel min-h-[100svh]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      {journeyMode ? (
        <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 gap-2">
          {onBack ? (
            <Button size="sm" variant="outline" className="border-white/20 text-white/80" onClick={onBack}>
              ← Begin
            </Button>
          ) : null}
          {onNext ? (
            <Button size="sm" className="bg-[#5B8DA8]" onClick={onNext}>
              Home →
            </Button>
          ) : null}
        </div>
      ) : (
        <HomepageScrollHint
          label="Scroll up · cube"
          direction="up"
          onActivate={() => scrollToHomepagePanel("nav-cube")}
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
        <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-[#A8BA48]/90">ZZAI Play</p>
        <h2 className="seeds-holo-text text-center text-2xl font-bold tracking-[0.06em] sm:text-3xl">
          {KLEAN_SNEAKS.display}
        </h2>
        <p
          className="mt-3 max-w-md text-center text-sm font-semibold text-[#E8D9A8] sm:text-base"
          data-testid="text-clean-sneaks-goal"
        >
          Goal: Steal the old man&apos;s bundle
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/45">
          stiehl den alten Manns Bündel
        </p>

        <div
          className="relative mt-8 flex h-[min(52vh,420px)] w-full max-w-xl items-center justify-center"
          data-testid="homepage-bundle-cube"
        >
          {enterGame ? (
            <CleanSneaksLogoCube className="h-full w-full" onActivate={enterGame} />
          ) : (
            <CleanSneaksLogoCube className="h-full w-full" />
          )}
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.32em] text-white/50">
          Drag to spin · Tap cube to play
        </p>
      </div>

      {!journeyMode ? (
        <HomepageScrollHint
          label="Scroll · explore"
          direction="down"
          onActivate={() => scrollToHomepagePanel("home-explore")}
        />
      ) : null}
    </section>
  );
}
