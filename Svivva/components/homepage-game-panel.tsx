"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_PLATFORM } from "@/lib/product-positioning";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { HomepageMainGoal } from "@/components/homepage-main-goal";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

/** Game face — first panel after the intro flip. */
export function HomepageGamePanel() {
  const router = useRouter();

  const enterGame = () => {
    router.push("/clean-sneaks");
  };

  return (
    <section className="relative flex h-[100svh] min-h-0 flex-col overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-[5.5rem] pt-[4.5rem] sm:px-6 sm:pb-28 sm:pt-20">
        <HomepageMainGoal
          variant="dark"
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
          className="mt-2 shrink-0 text-center text-[10px] uppercase tracking-[0.25em] text-white/50 sm:text-[11px]"
          data-testid="text-clean-sneaks-goal"
        >
          Tap the cube — car×sneaker hybrid, colorways inside
        </p>
      </div>

      <HomepageScrollHint
        label={HOMEPAGE_SCROLL_TO_PLATFORM}
        direction="down"
        prominent={false}
        onActivate={() => scrollToHomepagePanel("nav-cube")}
      />
    </section>
  );
}
