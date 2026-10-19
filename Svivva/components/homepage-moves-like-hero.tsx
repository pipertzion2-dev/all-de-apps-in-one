"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { Button } from "@/components/ui/button";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import {
  PRODUCT_HERO_HEADLINE,
  PRODUCT_HERO_SUBLINE,
  PRODUCT_NAME_LINE,
} from "@/lib/product-positioning";

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[50svh] items-center justify-center text-sm text-muted-foreground">
        Loading stage…
      </div>
    ),
  },
);

/**
 * Homepage first composition: THE MOVES LIKE as the brand signal,
 * Three.js CRT flowers as the atmosphere, dancer stage underneath.
 * WebGL layers are pointer-events-none so homepage flip / scroll stays smooth.
 */
export function HomepageMovesLikeHero() {
  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden border-b border-border/30"
      data-testid="homepage-moves-like-hero"
      aria-labelledby="homepage-moves-like-heading"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <CamoThreeOverlay
          preset="oaas"
          eagerMount
          keepMounted
          className="h-full w-full opacity-[0.72] md:opacity-[0.58]"
        />
      </div>

      {/* Decorative only — never steal wheel / touch from the flip scroller */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <MovementStage
          moveIds={["body-roll", "afro-bounce", "two-step"]}
          mode="freestyle"
          interactive={false}
          className="h-full min-h-[100svh]"
          showCaption={false}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#e8f0f6] via-[#F7FBFC]/40 to-white/20 sm:bg-gradient-to-r sm:from-white/82 sm:via-[rgba(247,251,252,0.45)] sm:to-transparent"
      />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-4 pb-20 pt-28 sm:justify-center sm:px-10 sm:pb-24 sm:pt-24">
        <div className="max-w-xl space-y-5 rounded-3xl border border-white/75 bg-[linear-gradient(160deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.22)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_18px_48px_rgba(109,145,179,0.18)] backdrop-blur-[20px] backdrop-saturate-[1.85] sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6D91B3]">
            zzai zzai · {PRODUCT_NAME_LINE}
          </p>
          <BrandMark size="hero" priority className="max-w-[min(88vw,420px)]" />
          <h1 id="homepage-moves-like-heading" className="sr-only">
            {PRODUCT_NAME_LINE}
          </h1>
          <p className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {PRODUCT_HERO_HEADLINE}
          </p>
          <p className="max-w-md text-sm leading-relaxed text-foreground/85 sm:text-base">
            {PRODUCT_HERO_SUBLINE}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="min-h-12 bg-[#AC81AF] px-6 text-white hover:bg-[#9a6f9d]">
              <Link href="/the-moves-like" data-testid="link-hero-open-moves-like">
                Open {MOVES_LIKE.shortName}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 border-white/80 bg-white/50"
              data-testid="button-hero-klean-sneaks"
              onClick={() => scrollToHomepagePanel("home-game")}
            >
              Play Klean Sneaks
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 border-white/80 bg-white/50"
              data-testid="button-hero-beta-apps"
              onClick={() => scrollToHomepagePanel("home-beta")}
            >
              Beta apps
            </Button>
            <Button asChild variant="ghost" className="min-h-11 text-[#6D91B3]">
              <Link href="/the-moves-like">Practice with front camera</Link>
            </Button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Scroll ↓ for beta apps · ↑ for Klean Sneaks
          </p>
        </div>
      </div>
    </section>
  );
}
