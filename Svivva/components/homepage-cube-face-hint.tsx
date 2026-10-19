"use client";

import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_GAME } from "@/lib/product-positioning";

/** Compact in-flow control — stays in document flow so it cannot cover scrolled content. */
export function HomepageCubeFaceHint() {
  return (
    <div className="relative z-20 flex justify-center border-b border-border/30 bg-background px-3 py-2">
      <button
        type="button"
        onClick={() => scrollToHomepagePanel("home-game")}
        className="flex cursor-pointer flex-col items-center gap-1 transition-opacity duration-200 active:scale-95"
        aria-label={HOMEPAGE_SCROLL_TO_GAME}
        data-testid="homepage-cube-face-hint"
      >
        <span className="rounded-full bg-muted/80 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground shadow-sm ring-1 ring-border/40">
          {HOMEPAGE_SCROLL_TO_GAME}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground"
          style={{ animation: "scrollBounce 1.5s ease-in-out infinite reverse" }}
          aria-hidden
        >
          <path d="M10 16V4M5 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
