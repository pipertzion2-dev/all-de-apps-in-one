"use client";

import dynamic from "next/dynamic";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { KLEAN_HOMEPAGE_TAGLINE } from "@/lib/clean-sneaks/game-copy";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

type HomepageGamePanelProps = {
  /** Full-screen first page that flips into the main app. */
  asIntro?: boolean;
};

/** First page — Game cube on white with flowers + digi camo across the full viewport. */
export function HomepageGamePanel({ asIntro = false }: HomepageGamePanelProps) {
  const enterGame = () => {
    // Hard nav so the header/cube Game path never soft-routes into /play.
    window.location.assign("/clean-sneaks");
  };

  return (
    <section
      id="home-game"
      data-homepage-cube-face="game"
      data-homepage-game-intro={asIntro ? "true" : undefined}
      className={`relative flex h-[100svh] min-h-0 flex-col overflow-hidden bg-white ${
        asIntro
          ? ""
          : "scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:scroll-mt-[calc(4rem+env(safe-area-inset-top,0px))]"
      }`}
      style={asIntro ? { minHeight: "100svh", height: "100svh" } : { scrollSnapAlign: "start" }}
    >
      {/* Flowers + digi camo over white */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <CamoThreeOverlay preset="lock" isIntro eagerMount keepMounted className="h-full w-full" />
      </div>

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col px-3 sm:px-6 ${
          asIntro ? "pb-28 pt-16 sm:pb-32 sm:pt-20" : "pb-[5.5rem] pt-[4.5rem] sm:pb-28 sm:pt-20"
        }`}
      >
        <div
          className="relative mx-auto mt-2 flex min-h-0 w-full max-w-lg flex-1 items-center justify-center"
          data-testid="homepage-bundle-cube"
        >
          <CleanSneaksLogoCube
            className="h-full max-h-[min(52svh,400px)] w-full"
            onActivate={enterGame}
          />
        </div>

        {!asIntro ? (
          <p
            className="mt-2 shrink-0 text-center text-[10px] uppercase tracking-[0.25em] text-black/50 sm:text-[11px]"
            data-testid="text-clean-sneaks-goal"
          >
            {KLEAN_HOMEPAGE_TAGLINE} — tap to play free
          </p>
        ) : (
          <p className="mt-3 shrink-0 pb-16 text-center text-[10px] uppercase tracking-[0.18em] text-black/45 sm:pb-20 sm:text-[11px]">
            Tap cube to play free
          </p>
        )}
      </div>
    </section>
  );
}
