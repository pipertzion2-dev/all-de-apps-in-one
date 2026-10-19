"use client";

import { HomepageMovesLikeHero } from "@/components/homepage-moves-like-hero";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_BETA, HOMEPAGE_SCROLL_TO_GAME } from "@/lib/product-positioning";

/** Second cube face — The Moves Like alone. */
export function HomepageMovesPanel() {
  return (
    <section
      id="home-moves"
      data-homepage-cube-face="moves"
      className="relative min-h-[100svh] scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:scroll-mt-[calc(4rem+env(safe-area-inset-top,0px))]"
      style={{ scrollSnapAlign: "start" }}
    >
      <HomepageScrollHint
        label={HOMEPAGE_SCROLL_TO_GAME}
        direction="up"
        onActivate={() => scrollToHomepagePanel("home-game")}
      />
      <HomepageMovesLikeHero />
      <HomepageScrollHint
        label={HOMEPAGE_SCROLL_TO_BETA}
        direction="down"
        prominent
        onActivate={() => scrollToHomepagePanel("home-beta")}
      />
    </section>
  );
}
