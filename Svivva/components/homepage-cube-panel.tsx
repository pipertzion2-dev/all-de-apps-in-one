"use client";

import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageExploreLinks } from "@/components/homepage-explore-links";
import { HomepageFaqSection } from "@/components/homepage-faq-section";
import { HomepageHowToSection } from "@/components/homepage-howto-section";
import { HomepageFounderSonSection } from "@/components/homepage-founder-son-section";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/**
 * Fourth cube face — combined story section (about, how-to, explore, founder, pricing, FAQ).
 * The Moves Like and beta apps live on their own faces above this panel.
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
          How zzai zzai fits together — then pricing and FAQ.
        </p>
      </div>

      <HomepageAboutSection />
      <HomepageHowToSection />
      <HomepageExploreLinks />
      <HomepageFounderSonSection />
      <HomepagePricingSection />
      <HomepageFaqSection />
    </div>
  );
}
