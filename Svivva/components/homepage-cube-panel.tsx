"use client";

import dynamic from "next/dynamic";
import { HomepageAboutSection } from "@/components/homepage-about-section";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepagePricingSection } from "@/components/homepage-pricing-section";
import { HomepageCubeFaceHint } from "@/components/homepage-cube-face-hint";

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
        Loading mixing console…
      </section>
    ),
  },
);

type HomepageCubePanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/** Product-cube homepage: nav cube, about, OaaS mixing console, and pricing. */
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
        <div className="relative z-20 flex justify-center px-4 pb-4">
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="rounded-full border border-[#5B8DA8]/40 bg-background/90 px-5 py-2 text-xs font-medium tracking-wide text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95"
          >
            Scroll ↓
          </button>
        </div>
      ) : null}

      <HomepageAboutSection />

      {/* OaaS lives on the scrollSnap face so /#oaas works with the flip stack. */}
      <div className="relative z-10 border-t border-border/40">
        <PlatformFeatureHub hideBackground hideChannelStrips />
      </div>

      <HomepagePricingSection />
    </div>
  );
}
