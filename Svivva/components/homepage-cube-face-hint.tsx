"use client";

import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_BETA_UP } from "@/lib/product-positioning";

/** Compact in-flow control — stays in document flow so it cannot cover scrolled content. */
export function HomepageCubeFaceHint() {
  return (
    <div className="relative z-20 flex justify-center px-3 py-3">
      <button
        type="button"
        onClick={() => scrollToHomepagePanel("home-beta")}
        className="text-xs font-medium tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-[#5B8DA8] hover:underline"
        aria-label={HOMEPAGE_SCROLL_TO_BETA_UP}
        data-testid="homepage-cube-face-hint"
      >
        {HOMEPAGE_SCROLL_TO_BETA_UP}
      </button>
    </div>
  );
}
