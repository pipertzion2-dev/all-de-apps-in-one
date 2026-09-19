"use client";

import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/** Product-cube homepage: nav cube, about copy, and pricing — one scrollable face. */
export function HomepageCubePanel({
  mountCanvas = true,
  interactive = true,
}: HomepageCubePanelProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative bg-background pb-8">
      {interactive ? (
        <HomepageScrollHint
          label="Flip down · game"
          direction="down"
          onActivate={() => scrollToHomepagePanel("home-game")}
        />
      ) : null}

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
            onClick={() => scrollToSection("about")}
            className="rounded-full border border-[#5B8DA8]/40 bg-background/90 px-5 py-2 text-xs font-medium tracking-wide text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95"
          >
            Scroll for app info & pricing ↓
          </button>
        </div>
      ) : null}

      <HomepageAboutSection />
      <HomepagePricingSection />
    </div>
  );
}
