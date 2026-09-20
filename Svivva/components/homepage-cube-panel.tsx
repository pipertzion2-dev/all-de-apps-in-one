"use client";

import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";

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
      {interactive ? <HomepageCubeFaceHint /> : null}

      <HomepageHeroBlock
        mountCanvas={mountCanvas}
        interactive={interactive}
        showFlipHint={false}
        layout="stacked"
      />

      {interactive ? (
        <div className="relative z-20 flex justify-center px-4 pb-6">
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="border-b border-[#5B8DA8]/50 bg-transparent px-1 pb-1 text-[11px] font-medium tracking-[0.18em] uppercase text-foreground/80 transition-colors hover:text-foreground active:scale-[0.98]"
          >
            App info & pricing
          </button>
        </div>
      ) : null}

      <HomepageAboutSection />
      <HomepagePricingSection />
    </div>
  );
}
