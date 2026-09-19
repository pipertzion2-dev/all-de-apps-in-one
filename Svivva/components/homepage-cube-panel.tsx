"use client";

import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/** Product-cube homepage: nav cube hero plus pricing below. */
export function HomepageCubePanel({
  mountCanvas = true,
  interactive = true,
}: HomepageCubePanelProps) {
  return (
    <div className="relative bg-background">
      {interactive ? (
        <HomepageScrollHint
          label="Flip down · game"
          direction="down"
          onActivate={() => scrollToHomepagePanel("home-game")}
        />
      ) : null}
      <HomepageHeroBlock mountCanvas={mountCanvas} interactive={interactive} showFlipHint={false} />
      {interactive ? (
        <HomepageScrollHint
          label="Scroll · pricing"
          direction="down"
          onActivate={() => {
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : null}
      <HomepagePricingSection />
    </div>
  );
}
