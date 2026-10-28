"use client";

import { useEffect, useRef } from "react";
import type { HomepageFlipPanelId } from "@/lib/homepage-flip-stack";
import { HOMEPAGE_FLIP_PANELS } from "@/lib/homepage-flip-stack";
import { flipToHomepagePanel } from "@/lib/homepage-scroll";
import {
  HOMEPAGE_CUBE_LOOP_COOLDOWN_MS,
  HOMEPAGE_CUBE_LOOP_EDGE_PX,
  cubeLoopWrapTarget,
  isNearDocumentBottom,
  isNearDocumentTop,
  isNearPanelBottom,
  isNearPanelTop,
  nearestHomepagePanel,
} from "@/lib/homepage-cube-loop";

type HomepageCubeLoopProps = {
  enabled?: boolean;
};

function isLoopPanel(id: HomepageFlipPanelId): id is (typeof HOMEPAGE_FLIP_PANELS)[number] {
  return (HOMEPAGE_FLIP_PANELS as readonly string[]).includes(id);
}

/**
 * Continuous cube wrap with a fine flip:
 * story (2nd page) → white game (1st page) → beta → story …
 */
export function HomepageCubeLoop({ enabled = true }: HomepageCubeLoopProps) {
  const lockedUntilRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const wrappingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const wrapTo = async (panel: HomepageFlipPanelId, deltaY: number) => {
      if (!isLoopPanel(panel)) return;
      const now = Date.now();
      if (now < lockedUntilRef.current || wrappingRef.current) return;
      lockedUntilRef.current = now + HOMEPAGE_CUBE_LOOP_COOLDOWN_MS;
      wrappingRef.current = true;
      try {
        await flipToHomepagePanel(panel, {
          direction: deltaY > 0 ? "forward" : "back",
        });
      } finally {
        wrappingRef.current = false;
      }
    };

    const tryWrap = (deltaY: number) => {
      const active = nearestHomepagePanel();
      const nearPanelBottom = active
        ? isNearPanelBottom(active, HOMEPAGE_CUBE_LOOP_EDGE_PX)
        : false;
      const nearPanelTop = active ? isNearPanelTop(active, HOMEPAGE_CUBE_LOOP_EDGE_PX) : false;
      const target = cubeLoopWrapTarget(deltaY, {
        activePanel: active,
        nearPanelBottom,
        nearPanelTop,
        nearBottom: isNearDocumentBottom(HOMEPAGE_CUBE_LOOP_EDGE_PX),
        nearTop: isNearDocumentTop(HOMEPAGE_CUBE_LOOP_EDGE_PX),
      });
      if (!target || !isLoopPanel(target) || target === active) return false;
      void wrapTo(target, deltaY);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || wrappingRef.current) return;
      if (!tryWrap(event.deltaY)) return;
      event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (wrappingRef.current) return;
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

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  return null;
}
