"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { bundleUnlockHint, isBundleCardUnlocked } from "@/lib/clean-sneaks/bundle-unlock";
import { readBestScore } from "@/lib/clean-sneaks/storage";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";

const CleanSneaksLogoCube = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

/** Scroll-friendly game panel — no fixed fullscreen overlays that trap page scroll. */
export function HomepageGamePanel() {
  const router = useRouter();
  const [best, setBest] = useState(0);
  const [bundleUnlocked, setBundleUnlocked] = useState(false);

  useEffect(() => {
    setBest(readBestScore());
    setBundleUnlocked(isBundleCardUnlocked());
  }, []);

  return (
    <section
      id="home-game"
      data-homepage-scroll-panel=""
      className="homepage-scroll-panel relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0c10]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 28% 40%, rgba(74,47,92,0.42), transparent 58%),
            radial-gradient(ellipse 55% 45% at 78% 65%, rgba(168,186,72,0.10), transparent 52%),
            linear-gradient(180deg, #0a0c10, #06080c)
          `,
        }}
      />

      <HomepageScrollHint
        label="Scroll up · cube"
        direction="up"
        onActivate={() => scrollToHomepagePanel("nav-cube")}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#A8BA48]/90">ZZAI Play</p>
          <h2 className="seeds-holo-text mt-2 text-3xl font-bold sm:text-4xl">{KLEAN_SNEAKS.display}</h2>
          <p className="mt-3 text-sm text-white/65">Steal the old man&apos;s bundle — keep the Baloon8 clean.</p>
        </div>

        <div
          className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 sm:min-h-[260px]"
          style={{
            background: `
              radial-gradient(ellipse 60% 55% at 50% 48%, rgba(58,32,72,0.55), rgba(8,6,12,0.92) 70%),
              linear-gradient(160deg, #1a1022 0%, #0a080e 100%)
            `,
          }}
          data-testid="homepage-game-panel-hero"
        >
          <CleanSneaksLogoCube
            className="relative z-[1] h-[200px] w-full sm:h-[240px]"
            onActivate={() => router.push("/clean-sneaks")}
          />
          <span className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-[0.35em] text-white/45">
            Drag to spin · Tap to play
          </span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="min-w-[220px] bg-[#5B8DA8] text-white shadow-[0_0_28px_rgba(91,141,168,0.35)]"
            asChild
            data-testid="button-homepage-play-game"
          >
            <Link href="/clean-sneaks">{KLEAN_SNEAKS.playLabel}</Link>
          </Button>
          {bundleUnlocked ? (
            <Button
              size="lg"
              variant="outline"
              className="min-w-[220px] border-[#D94F9C]/50 text-[#E8D9A8]"
              asChild
            >
              <Link href="/clean-sneaks?mode=bundle">Steal the Old Man&apos;s Bundle</Link>
            </Button>
          ) : (
            <p className="max-w-sm text-center text-xs text-white/50">{bundleUnlockHint(best)}</p>
          )}
          {best > 0 && (
            <p className="text-xs text-[#7EC8D9]/90">Best score: {best.toLocaleString()}</p>
          )}
        </div>
      </div>

      <HomepageScrollHint
        label="Scroll · explore"
        direction="down"
        onActivate={() => scrollToHomepagePanel("home-explore")}
      />
    </section>
  );
}
