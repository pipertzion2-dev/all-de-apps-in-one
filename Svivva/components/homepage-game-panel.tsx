"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

type HomepageGamePanelProps = {
  /** Full-screen first page that flips into the main app. */
  asIntro?: boolean;
  onEnterApp?: () => void;
};

/** First page — walk-game cube on white with flowers + digi camo across the full viewport. */
export function HomepageGamePanel({ asIntro = false, onEnterApp }: HomepageGamePanelProps) {
  const router = useRouter();

  const enterGame = () => {
    router.push("/clean-sneaks");
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

        {asIntro ? (
          <div className="mt-3 flex shrink-0 justify-center">
            <button
              type="button"
              onClick={() => onEnterApp?.()}
              className="rounded-full border border-black/20 bg-white px-6 py-2.5 text-xs font-semibold tracking-wide text-black shadow-sm transition-transform active:scale-95"
              data-testid="button-enter-main-app"
            >
              Enter
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
