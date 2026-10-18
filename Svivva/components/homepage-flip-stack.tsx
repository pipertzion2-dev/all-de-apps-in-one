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
const NUDGE_DEBOUNCE_MS = 420;
const SWIPE_THRESHOLD_PX = 48;
const MAX_PANEL_INDEX = 1;
const SCROLL_EDGE_THRESHOLD = 12;
/** Platform content fades in only as the game → home flip finishes (avoids clipping mid-rotation). */
const OVERLAY_FADE_START = 0.88;
const OVERLAY_FADE_END = 1;
/** Absorb flip-wheel momentum so the platform overlay does not shoot to the footer. */
const PLATFORM_WHEEL_LOCK_MS = 520;
/** Intentional overscroll distance (wheel px / touch px) before leaving The Moves Like. */
const OVERSCROLL_FLIP_PX = 72;

function overlayOpacityForIndex(index: number): number {
  return Math.min(
    1,
    Math.max(0, (index - OVERLAY_FADE_START) / (OVERLAY_FADE_END - OVERLAY_FADE_START)),
  );
}

function overlayScrollEnabled(index: number): boolean {
  return index >= OVERLAY_FADE_END - FLIP_SETTLE_EPSILON;
}

/** Two full-viewport faces — game above, The Moves Like homepage below (land on homepage). */
export function HomepageFlipStack({
  begin,
  game,
  initialPanel = "nav-cube",
  interactive = true,
}: HomepageFlipStackProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const halfHRef = useRef(400);
  const targetIndexRef = useRef(flipPanelIndex(initialPanel));
  const displayedIndexRef = useRef(flipPanelIndex(initialPanel));
  const activePanelRef = useRef<HomepageFlipPanelId>(initialPanel);
  const animRef = useRef(0);
  const lastNudgeAtRef = useRef(0);
  const overlayScrollWasEnabledRef = useRef(false);
  const platformWheelLockUntilRef = useRef(0);
  const overscrollAccumRef = useRef(0);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);

  const syncOverlayVisuals = useCallback(
    (index: number) => {
      const scroller = scrollRef.current;
      const shell = shellRef.current;
      const opacity = overlayOpacityForIndex(index);
      const scrollEnabled = overlayScrollEnabled(index);
      const shellHidden = scrollEnabled;

      if (scroller) {
        scroller.style.opacity = scrollEnabled ? "1" : String(opacity);
        scroller.style.visibility = index >= OVERLAY_FADE_START - 0.02 ? "visible" : "hidden";
        scroller.style.pointerEvents = scrollEnabled ? "auto" : "none";
        scroller.style.touchAction = scrollEnabled ? "pan-y" : "none";
        scroller.setAttribute("aria-hidden", scrollEnabled ? "false" : "true");

        if (!scrollEnabled) {
          if (scroller.scrollTop !== 0) scroller.scrollTop = 0;
        } else if (!overlayScrollWasEnabledRef.current) {
          scroller.scrollTop = 0;
          platformWheelLockUntilRef.current = performance.now() + PLATFORM_WHEEL_LOCK_MS;
          overscrollAccumRef.current = 0;
          document.body.style.overflow = "hidden";
        }
        overlayScrollWasEnabledRef.current = scrollEnabled;
      }

      if (shell) {
        shell.style.opacity = shellHidden ? "0" : "1";
        shell.style.pointerEvents = interactive && !shellHidden ? "auto" : "none";
      }
    },
    [interactive],
  );

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
    syncOverlayVisuals(displayedIndexRef.current);
  }, [paintFaces, paintRotor, syncOverlayVisuals]);

  const isAnimating = useCallback(
    () => Math.abs(displayedIndexRef.current - targetIndexRef.current) > FLIP_SETTLE_EPSILON,
    [],
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
          syncOverlayVisuals(target);
        } else {
          syncOverlayVisuals(target);
        }
        lastNudgeAtRef.current = performance.now();
        return;
      }

      // Slightly softer settle than scrub-era easing — fewer mid-flip opacity pops.
      const smoothing = 1 - Math.exp(-14 * dt);
      current += delta * smoothing;
      if ((delta > 0 && current > target) || (delta < 0 && current < target)) {
        current = target;
      }
      displayedIndexRef.current = current;
      paintRotor(current);
      syncOverlayVisuals(current);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor, syncOverlayVisuals]);

  const resetPlatformScroll = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const commitPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      activePanelRef.current = panel;
      setActivePanel(panel);
      window.history.replaceState(null, "", `/#${hashForFlipPanel(panel)}`);
      if (panel === "nav-cube") {
        resetPlatformScroll();
        platformWheelLockUntilRef.current = performance.now() + PLATFORM_WHEEL_LOCK_MS;
        overscrollAccumRef.current = 0;
      } else {
        resetPlatformScroll();
        document.body.style.overflow = "";
        overscrollAccumRef.current = 0;
      }
    },
    [resetPlatformScroll],
  );

  const goToPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      const next = flipPanelIndex(panel);
      const settled =
        Math.abs(displayedIndexRef.current - next) <= FLIP_SETTLE_EPSILON &&
        Math.abs(targetIndexRef.current - next) <= FLIP_SETTLE_EPSILON;
      if (settled) return;

      lastNudgeAtRef.current = performance.now();
      overscrollAccumRef.current = 0;
      targetIndexRef.current = next;
      commitPanel(panel);
      ensureTick();
    },
    [commitPanel, ensureTick],
  );

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
    targetIndexRef.current = index;
    displayedIndexRef.current = index;
    activePanelRef.current = initialPanel;
    setActivePanel(initialPanel);
    syncDepth();
  }, [initialPanel, syncDepth]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      document.body.style.overflow = "";
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

    const settledPanelIndex = () =>
      Math.min(MAX_PANEL_INDEX, Math.max(0, Math.round(targetIndexRef.current)));

    /** Settled on platform face — use native overlay scroll, not flip scrubbing. */
    const platformScrollMode = () =>
      activePanelRef.current === "nav-cube" && overlayScrollEnabled(displayedIndexRef.current);

    const faceScrollState = (face: HTMLDivElement | null) => {
      if (!face) {
        return {
          scrollable: false,
          atTop: true,
          atBottom: true,
        };
      }
      const threshold = SCROLL_EDGE_THRESHOLD;
      const scrollable = face.scrollHeight > face.clientHeight + threshold;
      const atTop = face.scrollTop <= threshold;
      const atBottom = face.scrollTop + face.clientHeight >= face.scrollHeight - threshold;
      return { scrollable, atTop, atBottom };
    };

    const canFlipFromPanel = (direction: 1 | -1, panelId: HomepageFlipPanelId) => {
      // Rotor: home-game (0) above → nav-cube (1) below. Land on nav-cube.
      if (panelId === "home-game" && direction > 0) return true;
      if (panelId === "nav-cube") {
        if (direction > 0) return false;
        const face = scrollRef.current;
        const { scrollable, atTop } = faceScrollState(face);
        return scrollable ? atTop : true;
      }
      return false;
    };

    const nudge = (direction: 1 | -1) => {
      if (isAnimating()) return false;

      const now = performance.now();
      if (now - lastNudgeAtRef.current < NUDGE_DEBOUNCE_MS) return false;

      const current = settledPanelIndex();
      const panelId = flipPanelFromIndex(current);
      if (!canFlipFromPanel(direction, panelId)) return false;

      const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
      if (next === current) return false;

      lastNudgeAtRef.current = now;
      overscrollAccumRef.current = 0;
      goToPanel(flipPanelFromIndex(next));
      return true;
    };

    const normalizeWheelDelta = (e: WheelEvent) => {
      let delta = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight * 0.35;
      return delta;
    };

    const onWheel = (e: WheelEvent) => {
      if (platformScrollMode()) {
        const scroller = scrollRef.current;
        if (scroller && !scroller.contains(e.target as Node)) {
          e.preventDefault();
        }
        return;
      }

      if (isAnimating()) {
        e.preventDefault();
        return;
      }

      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 8) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      if (nudge(direction)) {
        e.preventDefault();
      }
    };

    const onPlatformWheel = (e: WheelEvent) => {
      if (!platformScrollMode()) return;
      if (performance.now() < platformWheelLockUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const delta = normalizeWheelDelta(e);
      const face = scrollRef.current;
      const { atTop } = faceScrollState(face);

      // Native scroll down / mid-page — do not interfere.
      if (delta >= 0 || !atTop) {
        overscrollAccumRef.current = 0;
        return;
      }

      // At top: accumulate intentional upward overscroll before flipping to Klean Sneaks.
      overscrollAccumRef.current += -delta;
      if (overscrollAccumRef.current < OVERSCROLL_FLIP_PX) {
        e.preventDefault();
        return;
      }

      overscrollAccumRef.current = 0;
      e.preventDefault();
      nudge(-1);
    };

    let touchStartY = 0;
    let touchMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchMoved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      if (isAnimating()) {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY ?? touchStartY;
      if (Math.abs(touchStartY - y) > 10) touchMoved = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      if (isAnimating()) return;

      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (!touchMoved && Math.abs(delta) < SWIPE_THRESHOLD_PX * 1.5) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      nudge(direction);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    const scroller = scrollRef.current;
    let platformTouchStartY = 0;
    let platformPullTracking = false;

    const onPlatformTouchStart = (e: TouchEvent) => {
      if (!platformScrollMode()) {
        platformPullTracking = false;
        return;
      }
      platformTouchStartY = e.touches[0]?.clientY ?? 0;
      platformPullTracking = true;
      overscrollAccumRef.current = 0;
    };

    const onPlatformTouchMove = (e: TouchEvent) => {
      if (!platformPullTracking || !platformScrollMode()) return;
      if (isAnimating()) {
        e.preventDefault();
        return;
      }
      const face = scrollRef.current;
      if (!face || face.scrollTop > SCROLL_EDGE_THRESHOLD) {
        overscrollAccumRef.current = 0;
        return;
      }
      const y = e.touches[0]?.clientY ?? platformTouchStartY;
      const dy = y - platformTouchStartY;
      // At the top of The Moves Like face, overscroll pull-down opens Klean Sneaks.
      if (dy > OVERSCROLL_FLIP_PX) {
        platformPullTracking = false;
        overscrollAccumRef.current = 0;
        e.preventDefault();
        nudge(-1);
      }
    };

    const onPlatformTouchEnd = () => {
      platformPullTracking = false;
      overscrollAccumRef.current = 0;
    };

    const onScrollerWheelCapture = (e: WheelEvent) => {
      if (performance.now() >= platformWheelLockUntilRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    scroller?.addEventListener("wheel", onScrollerWheelCapture, { passive: false, capture: true });
    scroller?.addEventListener("wheel", onPlatformWheel, { passive: false });
    scroller?.addEventListener("touchstart", onPlatformTouchStart, { passive: true });
    scroller?.addEventListener("touchmove", onPlatformTouchMove, { passive: false });
    scroller?.addEventListener("touchend", onPlatformTouchEnd, { passive: true });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      scroller?.removeEventListener("wheel", onScrollerWheelCapture, true);
      scroller?.removeEventListener("wheel", onPlatformWheel);
      scroller?.removeEventListener("touchstart", onPlatformTouchStart);
      scroller?.removeEventListener("touchmove", onPlatformTouchMove);
      scroller?.removeEventListener("touchend", onPlatformTouchEnd);
    };
  }, [interactive, goToPanel, isAnimating]);

  return (
    <>
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
          <div
            id="home-game"
            ref={(el) => {
              faceRefs.current[0] = el;
            }}
            data-homepage-flip-face=""
            data-flip-index={0}
            className="bg-background"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              willChange: "transform",
            }}
          >
            {game}
          </div>
          <div
            id="nav-cube"
            ref={(el) => {
              faceRefs.current[1] = el;
            }}
            data-homepage-flip-face=""
            data-flip-index={1}
            className="bg-background"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              willChange: "transform",
            }}
          >
            <div className="h-full w-full bg-background" aria-hidden />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        data-homepage-flip-scroll=""
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[15] overflow-x-hidden overflow-y-auto scroll-auto bg-background sm:top-[calc(4rem+env(safe-area-inset-top,0px))]"
        style={{
          scrollPaddingTop: "0.75rem",
          opacity: overlayOpacityForIndex(flipPanelIndex(initialPanel)),
          visibility:
            flipPanelIndex(initialPanel) >= OVERLAY_FADE_START - 0.02 ? "visible" : "hidden",
          pointerEvents: overlayScrollEnabled(flipPanelIndex(initialPanel)) ? "auto" : "none",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
          transform: "translateZ(0)",
        }}
      >
        {begin}
      </div>
    </>
  );
}
