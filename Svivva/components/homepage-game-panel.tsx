"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
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
    <section className="relative flex h-[100svh] flex-col overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-24 pt-20 sm:px-6 sm:pt-24">
        <HomepageMainGoal variant="dark" className="mb-6" />
        <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-[#A8BA48]/90">
          Public demo · ZZAI Play
        </p>
        <h2 className="seeds-holo-text text-center text-xl font-bold tracking-[0.06em] sm:text-2xl">
          {KLEAN_SNEAKS.display}
        </h2>
        <p
          className="mt-2 max-w-md text-center text-xs text-white/60 sm:text-sm"
          data-testid="text-clean-sneaks-goal"
        >
          Sneak Vision = hazard preview · zone dirt = live quality · mission save = rollback. Tap
          the cube to play.
        </p>

        <div
          className="relative mt-8 flex h-[min(52vh,420px)] w-full max-w-xl items-center justify-center"
          data-testid="homepage-bundle-cube"
        >
          <CleanSneaksLogoCube className="h-full w-full" onActivate={enterGame} />
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.32em] text-white/45">
          Drag cube to spin · Tap to play
        </p>
      </div>

      <HomepageScrollHint
        label="Swipe the cube once to go to the main homepage"
        direction="down"
        prominent
        onActivate={() => scrollToHomepagePanel("nav-cube")}
      />
    </section>
  );
}
