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
const WHEEL_DEBOUNCE_MS = 220;
const SWIPE_THRESHOLD_PX = 36;

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
  const targetIndexRef = useRef(flipPanelIndex(initialPanel));
  const displayedIndexRef = useRef(flipPanelIndex(initialPanel));
  const animRef = useRef(0);
  const lastWheelFlipAtRef = useRef(0);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);

  const panels = [
    { id: "home-game" as const, node: game },
    { id: "home-explore" as const, node: home },
    { id: "nav-cube" as const, node: begin },
  ];

  const paintRotor = useCallback((index: number) => {
    const halfH = halfHRef.current;
    if (rotorRef.current) {
      rotorRef.current.style.transform = `translate3d(0, 0, ${-halfH}px) rotateX(${-index * 90}deg)`;
    }
    faceRefs.current.forEach((face, i) => {
      if (!face) return;
      face.style.transformOrigin = "center center";
      face.style.transform = `rotateX(${i * 90}deg) translate3d(0, 0, ${halfH}px)`;
    });
  }, []);

  const isAnimating = useCallback(() => {
    return Math.abs(displayedIndexRef.current - targetIndexRef.current) > FLIP_SETTLE_EPSILON;
  }, []);

  const syncDepth = useCallback(() => {
    halfHRef.current = (shellRef.current?.clientHeight ?? window.innerHeight) / 2;
    paintRotor(displayedIndexRef.current);
  }, [paintRotor]);

  const goToPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      const next = flipPanelIndex(panel);
      if (next === targetIndexRef.current && !isAnimating()) return;
      targetIndexRef.current = next;
      setActivePanel(panel);
      window.history.replaceState(null, "", `/#${hashForFlipPanel(panel)}`);
    },
    [isAnimating],
  );

  useLayoutEffect(() => {
    syncDepth();
    const onResize = () => syncDepth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncDepth]);

  useEffect(() => {
    const index = flipPanelIndex(initialPanel);
    targetIndexRef.current = index;
    displayedIndexRef.current = index;
    setActivePanel(initialPanel);
    syncDepth();
  }, [initialPanel, syncDepth]);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      animRef.current = requestAnimationFrame(tick);
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

      const smoothing = 1 - Math.exp(-10 * dt);
      current += delta * smoothing;
      if ((delta > 0 && current > target) || (delta < 0 && current < target)) {
        current = target;
      }
      displayedIndexRef.current = current;
      paintRotor(current);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [paintRotor]);

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

    const canFlipFromFace = (face: HTMLDivElement, direction: 1 | -1) => {
      const threshold = 8;
      const notScrollable = face.scrollHeight <= face.clientHeight + threshold;
      if (notScrollable) return true;
      if (direction > 0) {
        return face.scrollTop + face.clientHeight >= face.scrollHeight - threshold;
      }
      return face.scrollTop <= threshold;
    };

    const nudge = (direction: 1 | -1) => {
      if (isAnimating()) return;
      const now = performance.now();
      if (now - lastWheelFlipAtRef.current < WHEEL_DEBOUNCE_MS) return;

      const current = targetIndexRef.current;
      const face = faceRefs.current[current];
      if (face && !canFlipFromFace(face, direction)) return;

      const next = Math.min(Math.max(current + direction, 0), panels.length - 1);
      if (next === current) return;

      lastWheelFlipAtRef.current = now;
      goToPanel(flipPanelFromIndex(next));
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return;
      const direction = e.deltaY > 0 ? 1 : -1;
      const current = targetIndexRef.current;
      const face = faceRefs.current[current];
      if (face && !canFlipFromFace(face, direction)) return;
      e.preventDefault();
      nudge(direction);
    };

    let touchStartY = 0;
    let touchStartScrollTop = 0;
    let touchMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchMoved = false;
      const face = faceRefs.current[targetIndexRef.current];
      touchStartScrollTop = face?.scrollTop ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      if (Math.abs(touchStartY - y) > 6) touchMoved = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchMoved) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      const current = targetIndexRef.current;
      const face = faceRefs.current[current];
      if (face && face.scrollTop !== touchStartScrollTop) {
        if (!canFlipFromFace(face, direction)) return;
      } else if (face && !canFlipFromFace(face, direction)) {
        return;
      }

      nudge(direction);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [interactive, goToPanel, isAnimating, panels.length]);

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
