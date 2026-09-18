"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { GameStartScreen, preloadMainGameCover } from "@/components/clean-sneaks/GameStartScreen";

const GameLoadingWheels = dynamic(
  () => import("@/components/clean-sneaks/GameLoadingWheels").then((m) => m.GameLoadingWheels),
  { ssr: false },
);

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

const MIN_LOADING_MS = 2200;

type IntroGamePhase = "loading" | "cube" | "start";

type HomepageIntroGameFlowProps = {
  /** After Start — reveal the ZZAI homepage. */
  onEnterHomepage: () => void;
};

/**
 * Intro flip back face: loading wheels → steal-the-bundle cube → Start screen.
 * Shown during and immediately after the intro flip until the user continues.
 */
export function HomepageIntroGameFlow({ onEnterHomepage }: HomepageIntroGameFlowProps) {
  const [phase, setPhase] = useState<IntroGamePhase>("loading");

  useEffect(() => {
    if (phase !== "loading") return;

    let cancelled = false;
    const started = performance.now();

    void preloadMainGameCover().then(() => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_LOADING_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setPhase("cube");
      }, wait);
    });

    return () => {
      cancelled = true;
    };
  }, [phase]);

  return (
    <div
      id="home-intro-game"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-black"
      data-testid="homepage-intro-game-flow"
    >
      {phase === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col">
          <GameLoadingWheels fullscreen={false} />
        </div>
      )}

      {phase === "cube" && (
        <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
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
            className="relative mt-8 flex h-[min(48vh,380px)] w-full max-w-xl items-center justify-center"
            data-testid="homepage-bundle-cube"
          >
            <CleanSneaksLogoCube className="h-full w-full" onActivate={() => setPhase("start")} />
          </div>

          <p className="mt-6 text-center text-[11px] uppercase tracking-[0.32em] text-white/50">
            Drag to spin · Tap cube to continue
          </p>
        </div>
      )}

      {phase === "start" && (
        <>
          <GameStartScreen
            contained
            actionHint="Tap to enter ZZAI"
            onStart={onEnterHomepage}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(6.5rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="pointer-events-auto border-white/30 bg-black/40 text-white/90 backdrop-blur-sm"
            >
              <Link href="/clean-sneaks">Play full screen</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
