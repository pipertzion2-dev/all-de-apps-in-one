"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { HomepageMainGoal } from "@/components/homepage-main-goal";
import { KLEAN_HOMEPAGE_TAGLINE } from "@/lib/clean-sneaks/game-copy";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

type HomepageGamePanelProps = {
  /** Full-screen first page that flips into the main app. */
  asIntro?: boolean;
  onEnterApp?: () => void;
};

/** First page — Klean Sneaks cube on white with Three.js flowers + camo water. */
export function HomepageGamePanel({ asIntro = false, onEnterApp }: HomepageGamePanelProps) {
  const router = useRouter();

  const enterGame = () => {
    router.push("/clean-sneaks");
  };

  const enterApp = () => {
    onEnterApp?.();
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
      {/* Three.js flowers + digi camo water on white */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <CamoThreeOverlay preset="lock" isIntro eagerMount keepMounted className="h-full w-full" />
      </div>

      {asIntro ? (
        <HomepageScrollHint
          label="Scroll up to enter zzai zzai"
          direction="up"
          prominent
          onActivate={enterApp}
        />
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-[5.5rem] pt-[4.5rem] sm:px-6 sm:pb-28 sm:pt-20">
        <HomepageMainGoal
          variant="light"
          density="compact"
          surface="game"
          className="shrink-0 px-1"
        />

        <div
          className="relative mx-auto mt-1 flex min-h-0 w-full max-w-lg flex-1 items-center justify-center"
          data-testid="homepage-bundle-cube"
        >
          <CleanSneaksLogoCube
            className="h-full max-h-[min(48svh,380px)] w-full"
            onActivate={enterGame}
          />
        </div>

        <p
          className="mt-2 shrink-0 text-center text-[10px] uppercase tracking-[0.25em] text-foreground/55 sm:text-[11px]"
          data-testid="text-clean-sneaks-goal"
        >
          {KLEAN_HOMEPAGE_TAGLINE} — tap to play free
        </p>

        {asIntro ? (
          <div className="mt-4 flex shrink-0 justify-center">
            <button
              type="button"
              onClick={enterApp}
              className="rounded-full border border-[#5B8DA8]/45 bg-white/85 px-5 py-2 text-xs font-semibold tracking-wide text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95"
              data-testid="button-enter-main-app"
            >
              Enter zzai zzai
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
