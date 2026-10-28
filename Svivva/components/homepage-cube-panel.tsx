"use client";

import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageExploreLinks } from "@/components/homepage-explore-links";
import { HomepageFaqSection } from "@/components/homepage-faq-section";
import { HomepageHowToSection } from "@/components/homepage-howto-section";
import { HomepageFounderSonSection } from "@/components/homepage-founder-son-section";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import Link from "next/link";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";
import { flipToHomepagePanel } from "@/lib/homepage-scroll";
import {
  HOMEPAGE_SCROLL_TO_GAME,
  HOMEPAGE_SCROLL_TO_PROTECTION,
  PRODUCT_PROTECTION_PATH,
} from "@/lib/product-positioning";

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/**
 * Combined story face — about, how-to, explore, founder, pricing, FAQ.
 * Poor Man Protection leads; beta apps live on the cube.
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

      <div className="px-4 pt-4 pb-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Story &amp; plans
        </h2>
      </div>

      <HomepageAboutSection />
      <HomepageHowToSection />
      <HomepageExploreLinks />
      <HomepageFounderSonSection />
      <HomepagePricingSection />
      <HomepageFaqSection />

      {interactive ? (
        <div className="relative z-20 flex flex-col items-center gap-4 px-4 py-8">
          <Link
            href={PRODUCT_PROTECTION_PATH}
            className="rounded-full border border-[#5B8DA8]/50 bg-[#5B8DA8] px-6 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-transform active:scale-95"
            data-testid="button-open-poor-man-protection"
          >
            {HOMEPAGE_SCROLL_TO_PROTECTION}
          </Link>
          <button
            type="button"
            onClick={() => void flipToHomepagePanel("home-game", { direction: "forward" })}
            className="text-xs font-medium tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-[#5B8DA8] hover:underline"
            data-testid="button-continue-to-game"
          >
            {HOMEPAGE_SCROLL_TO_GAME}
          </button>
        </div>
      ) : null}
    </div>
  );
}
