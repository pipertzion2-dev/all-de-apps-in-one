"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  flipPanelFromIndex,
  flipPanelIndex,
  hashForFlipPanel,
  HOMEPAGE_FLIP_EVENT,
  type HomepageFlipPanelId,
} from "@/lib/homepage-flip-stack";

type HomepageFlipStackProps = {
  begin: ReactNode;
  game: ReactNode;
  initialPanel?: HomepageFlipPanelId;
  interactive?: boolean;
};

const FLIP_SETTLE_EPSILON = 0.02;
const WHEEL_SNAP_MS = 280;
const SWIPE_THRESHOLD_PX = 36;
const MAX_PANEL_INDEX = 1;
const SCROLL_EDGE_THRESHOLD = 8;

/** Two full-viewport faces — game, then homepage (cube + pricing). */
export function HomepageFlipStack({
  begin,
  game,
  initialPanel = "home-game",
  interactive = true,
}: HomepageFlipStackProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const halfHRef = useRef(400);
  const virtualIndexRef = useRef(flipPanelIndex(initialPanel));
  const targetIndexRef = useRef(flipPanelIndex(initialPanel));
  const displayedIndexRef = useRef(flipPanelIndex(initialPanel));
  const scrubbingRef = useRef(false);
  const animRef = useRef(0);
  const wheelSnapTimerRef = useRef(0);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);

  const panels = [
    { id: "home-game" as const, node: game },
    { id: "nav-cube" as const, node: begin },
  ];

  const paintFaces = useCallback(() => {
    const halfH = halfHRef.current;
    faceRefs.current.forEach((face, i) => {
      if (!face) return;
      face.style.transformOrigin = "center center";
      face.style.transform = `rotateX(${-i * 90}deg) translate3d(0, 0, ${halfH}px)`;
    });
  }, []);

  const paintRotor = useCallback((index: number) => {
    const halfH = halfHRef.current;
    if (rotorRef.current) {
      rotorRef.current.style.transform = `translate3d(0, 0, ${-halfH}px) rotateX(${index * 90}deg)`;
    }
  }, []);

  const syncDepth = useCallback(() => {
    halfHRef.current = (shellRef.current?.clientHeight ?? window.innerHeight) / 2;
    paintFaces();
    paintRotor(displayedIndexRef.current);
  }, [paintFaces, paintRotor]);

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    }
  }, []);

  const paintDirect = useCallback(
    (index: number) => {
      stopAnim();
      displayedIndexRef.current = index;
      paintRotor(index);
    },
    [paintRotor, stopAnim],
  );

  const ensureTick = useCallback(() => {
    if (animRef.current) return;

    let last = performance.now();
    const tick = (now: number) => {
      animRef.current = 0;
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;

      const target = targetIndexRef.current;
      let current = displayedIndexRef.current;
      const delta = target - current;

      if (Math.abs(delta) <= FLIP_SETTLE_EPSILON) {
        if (current !== target) {
          displayedIndexRef.current = target;
          paintRotor(target);
        }
        return;
      }

      const smoothing = 1 - Math.exp(-18 * dt);
      current += delta * smoothing;
      if ((delta > 0 && current > target) || (delta < 0 && current < target)) {
        current = target;
      }
      displayedIndexRef.current = current;
      paintRotor(current);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor]);

  const commitPanel = useCallback((panel: HomepageFlipPanelId) => {
    setActivePanel(panel);
    window.history.replaceState(null, "", `/#${hashForFlipPanel(panel)}`);
  }, []);

  const clearSnapTimer = useCallback(() => {
    if (wheelSnapTimerRef.current) {
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = 0;
    }
  }, []);

  const goToPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      const next = flipPanelIndex(panel);
      const settled =
        Math.abs(displayedIndexRef.current - next) <= FLIP_SETTLE_EPSILON &&
        Math.abs(targetIndexRef.current - next) <= FLIP_SETTLE_EPSILON;
      if (settled) return;

      scrubbingRef.current = false;
      clearSnapTimer();
      virtualIndexRef.current = next;
      targetIndexRef.current = next;
      commitPanel(panel);
      ensureTick();
    },
    [clearSnapTimer, commitPanel, ensureTick],
  );

  const snapToNearestPanel = useCallback(() => {
    scrubbingRef.current = false;
    const snapped = Math.min(MAX_PANEL_INDEX, Math.max(0, Math.round(virtualIndexRef.current)));
    if (
      snapped === Math.round(targetIndexRef.current) &&
      Math.abs(displayedIndexRef.current - snapped) <= FLIP_SETTLE_EPSILON
    ) {
      virtualIndexRef.current = snapped;
      targetIndexRef.current = snapped;
      return;
    }
    virtualIndexRef.current = snapped;
    targetIndexRef.current = snapped;
    commitPanel(flipPanelFromIndex(snapped));
    ensureTick();
  }, [commitPanel, ensureTick]);

  const scheduleSnap = useCallback(() => {
    if (wheelSnapTimerRef.current) {
      window.clearTimeout(wheelSnapTimerRef.current);
    }
    wheelSnapTimerRef.current = window.setTimeout(() => {
      wheelSnapTimerRef.current = 0;
      snapToNearestPanel();
    }, WHEEL_SNAP_MS);
  }, [snapToNearestPanel]);

  useLayoutEffect(() => {
    syncDepth();
    const onResize = () => syncDepth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncDepth]);

  useEffect(() => {
    const index = flipPanelIndex(initialPanel);
    if (
      index === targetIndexRef.current &&
      Math.abs(displayedIndexRef.current - index) <= FLIP_SETTLE_EPSILON
    ) {
      return;
    }
    virtualIndexRef.current = index;
    targetIndexRef.current = index;
    displayedIndexRef.current = index;
    setActivePanel(initialPanel);
    syncDepth();
  }, [initialPanel, syncDepth]);

  useEffect(() => {
    return () => {
      stopAnim();
      if (wheelSnapTimerRef.current) window.clearTimeout(wheelSnapTimerRef.current);
    };
  }, [stopAnim]);

  useEffect(() => {
    const onFlip = (event: Event) => {
      const panel = (event as CustomEvent<{ panel?: HomepageFlipPanelId }>).detail?.panel;
      if (panel) goToPanel(panel);
    };
    window.addEventListener(HOMEPAGE_FLIP_EVENT, onFlip);
    return () => window.removeEventListener(HOMEPAGE_FLIP_EVENT, onFlip);
  }, [goToPanel]);

  useEffect(() => {
    if (!interactive) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const scrollGain = mobile ? 0.0028 : 0.0022;

    const settledPanelIndex = () =>
      Math.min(MAX_PANEL_INDEX, Math.max(0, Math.round(targetIndexRef.current)));

    const faceScrollState = (face: HTMLDivElement | null) => {
      if (!face) {
        return {
          scrollable: false,
          atTop: true,
          atBottom: true,
          canScrollDown: false,
          canScrollUp: false,
        };
      }
      const threshold = SCROLL_EDGE_THRESHOLD;
      const scrollable = face.scrollHeight > face.clientHeight + threshold;
      const atTop = face.scrollTop <= threshold;
      const atBottom = face.scrollTop + face.clientHeight >= face.scrollHeight - threshold;
      return {
        scrollable,
        atTop,
        atBottom,
        canScrollDown: scrollable && !atBottom,
        canScrollUp: scrollable && !atTop,
      };
    };

    const canFlipFromFace = (
      face: HTMLDivElement | null,
      direction: 1 | -1,
      panelId: HomepageFlipPanelId,
    ) => {
      if (panelId === "home-game" && direction > 0) return true;
      const { scrollable, atTop, atBottom } = faceScrollState(face);
      if (!scrollable) return true;
      if (direction > 0) return atTop || atBottom;
      return atTop || atBottom;
    };

    /** Let the browser scroll nav-cube natively when content extends beyond the viewport. */
    const shouldDeferToNativeScroll = (
      panelId: HomepageFlipPanelId,
      face: HTMLDivElement | null,
      deltaY: number,
    ) => {
      if (panelId !== "nav-cube") return false;
      const { canScrollDown, canScrollUp } = faceScrollState(face);
      if (deltaY > 0 && canScrollDown) return true;
      if (deltaY < 0 && canScrollUp) return true;
      return false;
    };

    const applyDelta = (deltaY: number) => {
      if (Math.abs(deltaY) < 0.5) return false;

      const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
      const current = settledPanelIndex();
      const panelId = panels[current]?.id ?? "home-game";
      const face = faceRefs.current[current];
      if (!canFlipFromFace(face, direction, panelId)) return false;

      const atMin = virtualIndexRef.current <= FLIP_SETTLE_EPSILON && direction < 0;
      const atMax =
        virtualIndexRef.current >= MAX_PANEL_INDEX - FLIP_SETTLE_EPSILON && direction > 0;
      if (atMin || atMax) return false;

      if (reducedMotion) {
        const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
        if (next === current) return false;
        goToPanel(flipPanelFromIndex(next));
        return true;
      }

      scrubbingRef.current = true;
      virtualIndexRef.current = Math.min(
        MAX_PANEL_INDEX,
        Math.max(0, virtualIndexRef.current + deltaY * scrollGain),
      );
      targetIndexRef.current = virtualIndexRef.current;
      paintDirect(virtualIndexRef.current);
      scheduleSnap();
      return true;
    };

    const normalizeWheelDelta = (e: WheelEvent) => {
      let delta = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight * 0.35;
      return delta;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 4) return;

      const current = settledPanelIndex();
      const panelId = panels[current]?.id ?? "home-game";
      const face = faceRefs.current[current];

      if (shouldDeferToNativeScroll(panelId, face, delta)) {
        return;
      }

      if (applyDelta(delta)) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    let touchScrubbing = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchScrubbing = false;
      if (wheelSnapTimerRef.current) {
        window.clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const current = settledPanelIndex();
      const panelId = panels[current]?.id ?? "home-game";

      if (panelId === "nav-cube") {
        return;
      }

      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      if (Math.abs(delta) < 6) return;

      touchScrubbing = true;
      touchStartY = y;
      if (applyDelta(delta)) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchScrubbing) {
        snapToNearestPanel();
        return;
      }

      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      const current = settledPanelIndex();
      const panelId = panels[current]?.id ?? "home-game";
      const face = faceRefs.current[current];
      if (!canFlipFromFace(face, direction, panelId)) return;

      if (reducedMotion) {
        const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
        if (next !== current) goToPanel(flipPanelFromIndex(next));
        return;
      }

      const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
      if (next === current) return;
      scrubbingRef.current = false;
      virtualIndexRef.current = next;
      targetIndexRef.current = next;
      commitPanel(flipPanelFromIndex(next));
      ensureTick();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [
    interactive,
    commitPanel,
    ensureTick,
    goToPanel,
    paintDirect,
    panels,
    scheduleSnap,
    snapToNearestPanel,
  ]);

  return (
    <div
      ref={shellRef}
      data-homepage-flip-stack=""
      data-active-panel={activePanel}
      className="relative w-full"
      style={{
        height: "100svh",
        perspective: "2400px",
        perspectiveOrigin: "50% 50%",
        overflow: "hidden",
        pointerEvents: interactive ? "auto" : "none",
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
      }}
    >
      <div
        ref={rotorRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {panels.map((panel, i) => (
          <div
            key={panel.id}
            id={panel.id}
            ref={(el) => {
              faceRefs.current[i] = el;
            }}
            data-homepage-flip-face=""
            data-flip-index={i}
            className="bg-background"
            style={{
              position: "absolute",
              inset: 0,
              overflowY: panel.id === "nav-cube" ? "auto" : "hidden",
              overflowX: "hidden",
              overscrollBehavior: panel.id === "nav-cube" ? "contain" : undefined,
              WebkitOverflowScrolling: panel.id === "nav-cube" ? "touch" : undefined,
              touchAction: panel.id === "nav-cube" ? "pan-y" : "none",
              scrollBehavior: panel.id === "nav-cube" ? "smooth" : undefined,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              willChange: "transform",
            }}
          >
            {panel.node}
          </div>
        ))}
      </div>
    </div>
  );
}
