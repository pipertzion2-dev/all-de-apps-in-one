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
  home: ReactNode;
  initialPanel?: HomepageFlipPanelId;
  interactive?: boolean;
};

const FLIP_SETTLE_EPSILON = 0.02;
const WHEEL_SNAP_MS = 140;
const SWIPE_THRESHOLD_PX = 36;
const MAX_PANEL_INDEX = 2;

/** Three full-viewport faces — same Dune-style rotateX cube as the intro reveal. */
export function HomepageFlipStack({
  begin,
  game,
  home,
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
  const animRef = useRef(0);
  const wheelSnapTimerRef = useRef(0);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);

  const panels = [
    { id: "home-game" as const, node: game },
    { id: "home-explore" as const, node: home },
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
      // Positive rotateX matches the intro reveal (page rising into view).
      rotorRef.current.style.transform = `translate3d(0, 0, ${-halfH}px) rotateX(${index * 90}deg)`;
    }
  }, []);

  const isAnimating = useCallback(() => {
    return Math.abs(displayedIndexRef.current - targetIndexRef.current) > FLIP_SETTLE_EPSILON;
  }, []);

  const syncDepth = useCallback(() => {
    halfHRef.current = (shellRef.current?.clientHeight ?? window.innerHeight) / 2;
    paintFaces();
    paintRotor(displayedIndexRef.current);
  }, [paintFaces, paintRotor]);

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

      const smoothing = 1 - Math.exp(-14 * dt);
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
    const index = flipPanelIndex(panel);
    setActivePanel(panel);
    window.history.replaceState(null, "", `/#${hashForFlipPanel(panel)}`);
    return index;
  }, []);

  const goToPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      const next = flipPanelIndex(panel);
      if (next === targetIndexRef.current && !isAnimating()) return;
      virtualIndexRef.current = next;
      targetIndexRef.current = next;
      commitPanel(panel);
      ensureTick();
    },
    [commitPanel, ensureTick, isAnimating],
  );

  const snapToNearestPanel = useCallback(() => {
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
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (wheelSnapTimerRef.current) window.clearTimeout(wheelSnapTimerRef.current);
    };
  }, []);

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

    const canFlipFromFace = (face: HTMLDivElement, direction: 1 | -1) => {
      const threshold = 8;
      const notScrollable = face.scrollHeight <= face.clientHeight + threshold;
      if (notScrollable) return true;
      if (direction > 0) {
        return face.scrollTop + face.clientHeight >= face.scrollHeight - threshold;
      }
      return face.scrollTop <= threshold;
    };

    const applyDelta = (deltaY: number) => {
      if (Math.abs(deltaY) < 0.5) return false;

      const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
      const current = settledPanelIndex();
      const face = faceRefs.current[current];
      if (face && !canFlipFromFace(face, direction)) return false;

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

      const gain = scrollGain;
      virtualIndexRef.current = Math.min(
        MAX_PANEL_INDEX,
        Math.max(0, virtualIndexRef.current + deltaY * gain),
      );
      targetIndexRef.current = virtualIndexRef.current;
      ensureTick();
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
      if (applyDelta(delta)) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    let touchStartScrollTop = 0;
    let touchScrubbing = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchScrubbing = false;
      const face = faceRefs.current[settledPanelIndex()];
      touchStartScrollTop = face?.scrollTop ?? 0;
      if (wheelSnapTimerRef.current) {
        window.clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      if (Math.abs(delta) < 6) return;

      const face = faceRefs.current[settledPanelIndex()];
      if (face && face.scrollTop !== touchStartScrollTop) {
        touchScrubbing = false;
        return;
      }

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
      const face = faceRefs.current[current];
      if (face && !canFlipFromFace(face, direction)) return;

      if (reducedMotion) {
        const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
        if (next !== current) goToPanel(flipPanelFromIndex(next));
        return;
      }

      const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
      if (next === current) return;
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
  }, [interactive, commitPanel, ensureTick, goToPanel, scheduleSnap, snapToNearestPanel]);

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
              overflowY: "auto",
              overflowX: "hidden",
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
