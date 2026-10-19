"use client";

import dynamic from "next/dynamic";
import { HomepageHeroBlock } from "@/components/homepage-hero-block";
import { HomepageMainGoal } from "@/components/homepage-main-goal";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_COMBINED, HOMEPAGE_SCROLL_TO_MOVES } from "@/lib/product-positioning";

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

/** Third cube face — beta desk apps (nav cube + mixing console). */
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
      {interactive ? (
        <HomepageScrollHint
          label={HOMEPAGE_SCROLL_TO_MOVES}
          direction="up"
          onActivate={() => scrollToHomepagePanel("home-moves")}
        />
      ) : null}

      <div className="relative z-20 px-4 pt-16 sm:hidden">
        <HomepageMainGoal variant="light" density="compact" surface="platform" />
      </div>

      <div className="px-4 pt-14 pb-2 text-center sm:pt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Beta apps
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Spin the desk cube — Seeds, Orbit, Protect, and the rest of the beta channels.
        </p>
      </div>

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
