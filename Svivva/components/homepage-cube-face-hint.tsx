"use client";

import { useEffect, useState } from "react";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import { HOMEPAGE_SCROLL_TO_GAME } from "@/lib/product-positioning";

const SCROLL_TOP_THRESHOLD = 48;

/** Shown only at the top of the nav-cube face — swipe up to return to the game panel. */
export function HomepageCubeFaceHint() {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-homepage-flip-scroll]");
    if (!scroller) return;

    const onScroll = () => {
      setAtTop(scroller.scrollTop <= SCROLL_TOP_THRESHOLD);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  if (!atTop) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToHomepagePanel("home-game")}
      className="pointer-events-auto fixed left-1/2 top-[calc(3.5rem+env(safe-area-inset-top,0px)+0.65rem)] z-[25] flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1.5 transition-opacity duration-200 active:scale-95 sm:top-[calc(4rem+env(safe-area-inset-top,0px)+0.65rem)]"
      aria-label={HOMEPAGE_SCROLL_TO_GAME}
    >
      <span className="rounded-full bg-background/85 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground shadow-md ring-1 ring-border/40 backdrop-blur-sm">
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
        <path d="M10 16V4M5 9l5-5 5 5" />
      </svg>
    </button>
  );
}
