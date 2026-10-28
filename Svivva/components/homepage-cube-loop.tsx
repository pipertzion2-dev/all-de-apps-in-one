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
      className="relative isolate flex items-center justify-center border-t border-border/30 bg-background px-4 py-10"
      style={{ scrollSnapAlign: "start" }}
      aria-label="Continue around the cube"
    >
      <button
        type="button"
        onClick={() => scrollToHomepagePanel("home-beta")}
        className="text-xs font-medium tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-[#5B8DA8] hover:underline"
        data-testid="button-cube-loop-to-first"
      >
        {HOMEPAGE_SCROLL_WRAP_TO_FIRST}
      </button>
    </section>
  );
}
