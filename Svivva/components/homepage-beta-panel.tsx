"use client";

import dynamic from "next/dynamic";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepageProtectionHero } from "@/components/homepage-protection-hero";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_COMBINED } from "@/lib/product-positioning";

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

type HomepageBetaPanelProps = {
  mountCanvas?: boolean;
  interactive?: boolean;
};

/**
 * First main-app face after intro — Poor Man Protection leads;
 * the desk cube below is beta apps.
 */
export function HomepageBetaPanel({
  mountCanvas = true,
  interactive = true,
}: HomepageBetaPanelProps) {
  return (
    <section
      id="home-beta"
      data-homepage-cube-face="beta"
      className="relative isolate min-h-[100svh] bg-background scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:scroll-mt-[calc(4rem+env(safe-area-inset-top,0px))]"
      style={{ scrollSnapAlign: "start" }}
    >
      <HomepageProtectionHero />

      <HomepageHeroBlock
        mountCanvas={mountCanvas}
        interactive={interactive}
        showFlipHint={false}
        layout="stacked"
      />

      <div className="relative z-10 border-t border-border/40">
        <PlatformFeatureHub hideBackground hideChannelStrips />
      </div>

      {interactive ? (
        <div className="relative z-20 flex justify-center px-4 py-6">
          <button
            type="button"
            onClick={() => scrollToHomepagePanel("nav-cube")}
            className="rounded-full border border-[#6D91B3]/40 bg-background/90 px-5 py-2 text-xs font-medium tracking-wide text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-95"
          >
            {HOMEPAGE_SCROLL_TO_COMBINED}
          </button>
        </div>
      ) : null}
    </section>
  );
}
