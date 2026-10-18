"use client";

import dynamic from "next/dynamic";
import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageMovesLikeHero } from "@/components/homepage-moves-like-hero";
import { HomepageExploreLinks } from "@/components/homepage-explore-links";
import { HomepageFaqSection } from "@/components/homepage-faq-section";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepageHowToSection } from "@/components/homepage-howto-section";
import { HomepageFounderSonSection } from "@/components/homepage-founder-son-section";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";
import { HomepageMainGoal } from "@/components/homepage-main-goal";
import { scrollPlatformSection } from "@/lib/homepage-scroll";

const PlatformFeatureHub = dynamic(
  () => import("@/components/platform-feature-hub").then((m) => m.PlatformFeatureHub),
  {
    ssr: false,
    loading: () => (
      <section
        id="oaas"
        className="py-14 sm:py-20 px-4 text-center text-sm text-muted-foreground"
        aria-busy
      >
        Loading ZZAI platform…
      </section>
    ),
  },
);

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/** Product homepage: The Moves Like center + flowers, cube desk, pricing. */
export function HomepageCubePanel({
  mountCanvas = true,
  interactive = true,
}: HomepageCubePanelProps) {
  return (
    <div className="relative bg-background pb-8">
      {interactive ? <HomepageCubeFaceHint /> : null}

      {/* Center of the app — The Moves Like over Three.js flowers */}
      {interactive ? <HomepageMovesLikeHero /> : null}

      <div className="relative z-20 px-4 pt-4 sm:hidden">
        <HomepageMainGoal variant="light" density="compact" surface="platform" />
      </div>

      {/* Keep flower-backed cube for desk navigation */}
      <HomepageHeroBlock
        mountCanvas={mountCanvas}
        interactive={interactive}
        showFlipHint={false}
        layout="stacked"
      />

      {interactive ? (
        <div className="relative z-20 flex justify-center px-4 pb-4">
          <button
            type="button"
            onClick={() => scrollPlatformSection("about")}
            className="rounded-full border border-[#6D91B3]/40 bg-background/90 px-5 py-2 text-xs font-medium tracking-wide text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95"
          >
            Scroll ↓
          </button>
        </div>
      ) : null}

      <HomepageAboutSection />
      <HomepageHowToSection />
      <HomepageExploreLinks />

      <div className="relative z-10 border-t border-border/40">
        <PlatformFeatureHub hideBackground hideChannelStrips />
      </div>

      <HomepageFounderSonSection />
      <HomepagePricingSection />
      <HomepageFaqSection />
    </div>
  );
}
