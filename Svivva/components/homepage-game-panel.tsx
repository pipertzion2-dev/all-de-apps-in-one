"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";

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
    <section className="relative flex h-[100svh] flex-col overflow-hidden bg-[#050505]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,141,168,0.18)_0%,transparent_58%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
        <h1 className="text-center text-4xl font-bold lowercase tracking-[0.16em] text-white sm:text-5xl">
          {BRAND.name}
        </h1>
        <p className="mt-3 text-[10px] uppercase tracking-[0.42em] text-[#A8BA48]/90">Play</p>
        <p className="seeds-holo-text mt-2 text-center text-xl font-bold tracking-[0.08em] sm:text-2xl">
          {KLEAN_SNEAKS.display}
        </p>
        <p
          className="mt-4 max-w-md text-center text-sm font-medium leading-relaxed text-[#E8D9A8]/95 sm:text-base"
          data-testid="text-clean-sneaks-goal"
        >
          Goal: Steal the old man&apos;s bundle
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/40">
          stiehl den alten Manns Bündel
        </p>

        <div
          className="relative mt-10 flex h-[min(52vh,420px)] w-full max-w-xl items-center justify-center"
          data-testid="homepage-bundle-cube"
        >
          <CleanSneaksLogoCube className="h-full w-full" onActivate={enterGame} />
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.32em] text-white/45">
          Swipe up for home · Drag cube to spin
        </p>
      </div>

      <HomepageScrollHint
        label="Swipe up · home"
        direction="down"
        prominent
        onActivate={() => scrollToHomepagePanel("nav-cube")}
      />
    </section>
  );
}
