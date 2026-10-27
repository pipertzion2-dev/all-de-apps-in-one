"use client";

import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageExploreLinks } from "@/components/homepage-explore-links";
import { HomepageFaqSection } from "@/components/homepage-faq-section";
import { HomepageHowToSection } from "@/components/homepage-howto-section";
import { HomepageFounderSonSection } from "@/components/homepage-founder-son-section";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import Link from "next/link";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";
import {
  HOMEPAGE_SCROLL_TO_GAME,
  HOMEPAGE_SCROLL_TO_MOVES,
  HOMEPAGE_SCROLL_TO_PROTECTION,
  PRODUCT_PROTECTION_PATH,
} from "@/lib/product-positioning";

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/**
 * Combined story face — about, how-to, explore, founder, pricing, FAQ.
 * Poor Man Protection leads the product story; Moves Like is in /play;
 * Klean Sneaks opens from the intro or /clean-sneaks.
 */
export function HomepageCubePanel({
  mountCanvas: _mountCanvas = true,
  interactive = true,
}: HomepageCubePanelProps) {
  return (
    <div
      id="nav-cube"
      data-homepage-cube-face="combined"
      className="relative isolate bg-background pb-8 scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:scroll-mt-[calc(4rem+env(safe-area-inset-top,0px))]"
      style={{ scrollSnapAlign: "start" }}
    >
      {interactive ? <HomepageCubeFaceHint /> : null}

      <div className="px-4 pt-6 pb-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Story, plans, and answers
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          How zzai zzai fits together — Poor Man Protection first, beta apps on the cube, The Moves
          Like in Play, Klean Sneaks on the walk.
        </p>
      </div>

      <HomepageAboutSection />
      <HomepageHowToSection />
      <HomepageExploreLinks />
      <HomepageFounderSonSection />
      <HomepagePricingSection />
      <HomepageFaqSection />

      {interactive ? (
        <div className="relative z-20 flex flex-wrap justify-center gap-3 px-4 py-8">
          <Link
            href={PRODUCT_PROTECTION_PATH}
            className="rounded-full border border-[#5B8DA8]/50 bg-[#5B8DA8] px-6 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-transform active:scale-95"
            data-testid="button-open-poor-man-protection"
          >
            {HOMEPAGE_SCROLL_TO_PROTECTION}
          </Link>
          <Link
            href="/clean-sneaks"
            className="rounded-full border border-[#5B8DA8]/45 bg-background px-6 py-2.5 text-xs font-semibold tracking-wide text-foreground shadow-sm transition-transform active:scale-95"
            data-testid="button-scroll-to-klean-sneaks"
          >
            {HOMEPAGE_SCROLL_TO_GAME}
          </Link>
          <Link
            href="/play"
            className="rounded-full border border-[#AC81AF]/45 bg-background px-6 py-2.5 text-xs font-semibold tracking-wide text-foreground shadow-sm transition-transform active:scale-95"
            data-testid="button-open-moves-in-play"
          >
            {HOMEPAGE_SCROLL_TO_MOVES}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
