"use client";

import { useEffect, useRef } from "react";
import { scrollToHomepagePanel } from "@/lib/homepage-scroll";
import {
  HOMEPAGE_CUBE_LOOP_COOLDOWN_MS,
  HOMEPAGE_CUBE_LOOP_EDGE_PX,
  cubeLoopWrapTarget,
  isNearDocumentBottom,
  isNearDocumentTop,
} from "@/lib/homepage-cube-loop";
import { HOMEPAGE_SCROLL_WRAP_TO_FIRST } from "@/lib/product-positioning";

type HomepageCubeLoopProps = {
  enabled?: boolean;
};

/**
 * Continuous cube wrap for the native-scroll homepage:
 * - At the bottom of the last face, scroll/wheel further → first face
 * - At the top of the first face, scroll/wheel up → last face
 * Also renders an in-flow “continue around the cube” control after story content.
 */
export function HomepageCubeLoop({ enabled = true }: HomepageCubeLoopProps) {
  const lockedUntilRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const sentinelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const wrapTo = (panel: "home-beta" | "nav-cube") => {
      const now = Date.now();
      if (now < lockedUntilRef.current) return;
      lockedUntilRef.current = now + HOMEPAGE_CUBE_LOOP_COOLDOWN_MS;
      scrollToHomepagePanel(panel);
    };

    const tryWrap = (deltaY: number) => {
      const target = cubeLoopWrapTarget(deltaY, {
        nearBottom: isNearDocumentBottom(HOMEPAGE_CUBE_LOOP_EDGE_PX),
        nearTop: isNearDocumentTop(HOMEPAGE_CUBE_LOOP_EDGE_PX),
      });
      if (!target) return false;
      wrapTo(target);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (!tryWrap(event.deltaY)) return;
      event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const y = event.touches[0]?.clientY;
      if (startY == null || y == null) return;
      const deltaY = startY - y;
      if (Math.abs(deltaY) < 12) return;
      if (!tryWrap(deltaY)) return;
      touchStartYRef.current = y;
      event.preventDefault();
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | null = null;
    if (sentinel && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.45);
          if (hit) wrapTo("home-beta");
        },
        { threshold: [0.45, 0.6, 0.8] },
      );
      observer.observe(sentinel);
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <section
      ref={sentinelRef}
      id="homepage-cube-loop"
      data-homepage-cube-loop=""
      data-testid="homepage-cube-loop"
      className="relative isolate flex min-h-[min(56svh,420px)] flex-col items-center justify-center gap-3 border-t border-border/40 bg-background px-4 py-16 text-center scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:scroll-mt-[calc(4rem+env(safe-area-inset-top,0px))]"
      style={{ scrollSnapAlign: "start" }}
      aria-label="Continue around the cube"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#5B8DA8]">
        Continuous cube
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Keep scrolling — the cube wraps to the first face.
      </p>
      <button
        type="button"
        onClick={() => scrollToHomepagePanel("home-beta")}
        className="rounded-full border border-[#5B8DA8]/45 bg-background px-6 py-2.5 text-xs font-semibold tracking-wide text-foreground shadow-sm transition-transform active:scale-95"
        data-testid="button-cube-loop-to-first"
      >
        {HOMEPAGE_SCROLL_WRAP_TO_FIRST}
      </button>
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground"
        style={{ animation: "scrollBounce 1.5s ease-in-out infinite" }}
        aria-hidden
      >
        <path d="M10 4v12M5 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </section>
  );
}
