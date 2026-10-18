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
const NUDGE_DEBOUNCE_MS = 720;
const SWIPE_THRESHOLD_PX = 52;
const SWIPE_THRESHOLD_MOBILE_PX = 64;
const MAX_PANEL_INDEX = 1;
const SCROLL_EDGE_THRESHOLD = 8;
/** Timed 3D cube rotation — exponential settle looked like an instant cut on mobile. */
const FLIP_DURATION_MS = 720;
const FLIP_DURATION_MOBILE_MS = 820;
/** Absorb leftover wheel momentum after landing on The Moves Like. */
const PLATFORM_WHEEL_LOCK_MS = 700;
const WHEEL_OVERSCROLL_FLIP_PX = 420;
const WHEEL_OVERSCROLL_MIN_EVENTS = 4;
const AT_TOP_DWELL_MS = 420;
const AT_TOP_INERTIA_LOCK_MS = 380;
/** Mobile pull-down at scroll top → Klean Sneaks (touchend only; never touchmove preventDefault). */
const TOUCH_LEAVE_PX = 80;

type ContentHost = "face" | "overlay";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function isTouchPrimaryDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
}

function settledOnPlatform(index: number, target: number, panel: HomepageFlipPanelId): boolean {
  return (
    panel === "nav-cube" &&
    Math.abs(index - MAX_PANEL_INDEX) <= FLIP_SETTLE_EPSILON &&
    Math.abs(target - MAX_PANEL_INDEX) <= FLIP_SETTLE_EPSILON
  );
}

/**
 * Two full-viewport Dune-style rotateX faces:
 * Klean Sneaks (0) → The Moves Like (1).
 *
 * Product content lives on the 3D face during the flip (so the cube is visible),
 * then hands off to a fixed overlay for native iOS scrolling when settled.
 */
export function HomepageFlipStack({
  begin,
  game,
  initialPanel = "home-game",
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
  const animFromRef = useRef(flipPanelIndex(initialPanel));
  const animToRef = useRef(flipPanelIndex(initialPanel));
  const animStartRef = useRef(0);
  const animDurationRef = useRef(FLIP_DURATION_MS);
  const lastNudgeAtRef = useRef(0);
  const platformWheelLockUntilRef = useRef(0);
  const overscrollAccumRef = useRef(0);
  const overscrollEventsRef = useRef(0);
  const atTopSinceRef = useRef(0);
  const wasAtTopRef = useRef(false);
  const touchPrimaryRef = useRef(false);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);
  const [contentHost, setContentHost] = useState<ContentHost>(
    initialPanel === "nav-cube" ? "overlay" : "face",
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

  const syncShellAndOverlay = useCallback(
    (index: number) => {
      const scroller = scrollRef.current;
      const shell = shellRef.current;
      const onPlatform = settledOnPlatform(index, targetIndexRef.current, activePanelRef.current);

      if (shell) {
        // Keep the 3D cube visible for the entire rotation — never hide mid-flip.
        shell.style.opacity = onPlatform ? "0" : "1";
        shell.style.pointerEvents = interactive && !onPlatform ? "auto" : "none";
      }

      if (scroller) {
        scroller.style.opacity = onPlatform ? "1" : "0";
        scroller.style.visibility = onPlatform ? "visible" : "hidden";
        scroller.style.pointerEvents = onPlatform ? "auto" : "none";
        scroller.style.touchAction = onPlatform ? "pan-y" : "none";
        scroller.setAttribute("aria-hidden", onPlatform ? "false" : "true");
        if (!onPlatform && scroller.scrollTop !== 0) scroller.scrollTop = 0;
      }
    },
    [interactive],
  );

  const syncDepth = useCallback(() => {
    halfHRef.current = (shellRef.current?.clientHeight ?? window.innerHeight) / 2;
    paintFaces();
    paintRotor(displayedIndexRef.current);
    syncShellAndOverlay(displayedIndexRef.current);
  }, [paintFaces, paintRotor, syncShellAndOverlay]);

  const isAnimating = useCallback(
    () => Math.abs(displayedIndexRef.current - targetIndexRef.current) > FLIP_SETTLE_EPSILON,
    [],
  );

  const ensureTick = useCallback(() => {
    if (animRef.current) return;

    const tick = (now: number) => {
      animRef.current = 0;
      const duration = Math.max(1, animDurationRef.current);
      const u = Math.min(1, (now - animStartRef.current) / duration);
      const eased = easeInOutCubic(u);
      const from = animFromRef.current;
      const to = animToRef.current;
      const current = from + (to - from) * eased;

      displayedIndexRef.current = current;
      paintRotor(current);
      syncShellAndOverlay(current);

      if (u < 1) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      displayedIndexRef.current = to;
      targetIndexRef.current = to;
      paintRotor(to);
      syncShellAndOverlay(to);
      lastNudgeAtRef.current = performance.now();

      // Hand product content to the scroll overlay only after the cube lands.
      if (to >= MAX_PANEL_INDEX - FLIP_SETTLE_EPSILON && activePanelRef.current === "nav-cube") {
        setContentHost("overlay");
        platformWheelLockUntilRef.current = performance.now() + PLATFORM_WHEEL_LOCK_MS;
        wasAtTopRef.current = true;
        atTopSinceRef.current = performance.now();
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        if (!touchPrimaryRef.current) {
          document.body.style.overflow = "hidden";
        }
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor, syncShellAndOverlay]);

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
      if (panel === "home-game") {
        // Content must be on the cube face before the reverse flip starts.
        setContentHost("face");
        resetPlatformScroll();
        document.body.style.overflow = "";
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        wasAtTopRef.current = false;
        atTopSinceRef.current = 0;
      } else {
        resetPlatformScroll();
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

      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }

      // Leaving the platform: put content back on the face, show the cube, then rotate.
      if (panel === "home-game") {
        setContentHost("face");
      }

      lastNudgeAtRef.current = performance.now();
      overscrollAccumRef.current = 0;
      overscrollEventsRef.current = 0;
      animFromRef.current = displayedIndexRef.current;
      animToRef.current = next;
      animStartRef.current = performance.now();
      animDurationRef.current = touchPrimaryRef.current
        ? FLIP_DURATION_MOBILE_MS
        : FLIP_DURATION_MS;
      targetIndexRef.current = next;
      commitPanel(panel);
      // Force shell visible for the whole rotation.
      if (shellRef.current) {
        shellRef.current.style.opacity = "1";
        shellRef.current.style.pointerEvents = interactive ? "auto" : "none";
      }
      if (scrollRef.current) {
        scrollRef.current.style.opacity = "0";
        scrollRef.current.style.visibility = "hidden";
        scrollRef.current.style.pointerEvents = "none";
      }
      ensureTick();
    },
    [commitPanel, ensureTick, interactive],
  );

  useLayoutEffect(() => {
    touchPrimaryRef.current = isTouchPrimaryDevice();
    syncDepth();
    const onResize = () => {
      touchPrimaryRef.current = isTouchPrimaryDevice();
      syncDepth();
    };
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
    animFromRef.current = index;
    animToRef.current = index;
    activePanelRef.current = initialPanel;
    setActivePanel(initialPanel);
    setContentHost(initialPanel === "nav-cube" ? "overlay" : "face");
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

    touchPrimaryRef.current = isTouchPrimaryDevice();
    const touchPrimary = touchPrimaryRef.current;

    const settledPanelIndex = () =>
      Math.min(MAX_PANEL_INDEX, Math.max(0, Math.round(targetIndexRef.current)));

    const platformScrollMode = () =>
      settledOnPlatform(
        displayedIndexRef.current,
        targetIndexRef.current,
        activePanelRef.current,
      ) && contentHost === "overlay";

    const faceScrollState = (face: HTMLDivElement | null) => {
      if (!face) {
        return { scrollable: false, atTop: true, atBottom: true };
      }
      const threshold = SCROLL_EDGE_THRESHOLD;
      const scrollable = face.scrollHeight > face.clientHeight + threshold;
      const atTop = face.scrollTop <= threshold;
      const atBottom = face.scrollTop + face.clientHeight >= face.scrollHeight - threshold;
      return { scrollable, atTop, atBottom };
    };

    const canFlipFromPanel = (direction: 1 | -1, panelId: HomepageFlipPanelId) => {
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
        if (scroller && !scroller.contains(e.target as Node)) e.preventDefault();
        return;
      }
      if (isAnimating()) {
        e.preventDefault();
        return;
      }
      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 8) return;
      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      if (nudge(direction)) e.preventDefault();
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
      const now = performance.now();

      if (!atTop) {
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        wasAtTopRef.current = false;
        atTopSinceRef.current = 0;
        return;
      }

      if (!wasAtTopRef.current) {
        wasAtTopRef.current = true;
        atTopSinceRef.current = now;
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        platformWheelLockUntilRef.current = Math.max(
          platformWheelLockUntilRef.current,
          now + AT_TOP_INERTIA_LOCK_MS,
        );
        e.preventDefault();
        return;
      }

      if (delta >= 0) {
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        return;
      }

      if (now - atTopSinceRef.current < AT_TOP_DWELL_MS) {
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        return;
      }

      overscrollAccumRef.current += -delta;
      overscrollEventsRef.current += 1;
      if (
        overscrollAccumRef.current < WHEEL_OVERSCROLL_FLIP_PX ||
        overscrollEventsRef.current < WHEEL_OVERSCROLL_MIN_EVENTS
      ) {
        e.preventDefault();
        return;
      }

      overscrollAccumRef.current = 0;
      overscrollEventsRef.current = 0;
      e.preventDefault();
      nudge(-1);
    };

    let gameTouchStartY = 0;

    const onGameTouchStart = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      gameTouchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onGameTouchEnd = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      if (isAnimating()) return;
      const endY = e.changedTouches[0]?.clientY ?? gameTouchStartY;
      const delta = gameTouchStartY - endY;
      const threshold = touchPrimary ? SWIPE_THRESHOLD_MOBILE_PX : SWIPE_THRESHOLD_PX;
      if (Math.abs(delta) < threshold) return;
      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      nudge(direction);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onGameTouchStart, { passive: true });
    window.addEventListener("touchend", onGameTouchEnd, { passive: true });

    const scroller = scrollRef.current;
    let platformTouchStartY = 0;
    let platformTouchStartScrollTop = 0;
    let platformPullTracking = false;

    const onPlatformTouchStart = (e: TouchEvent) => {
      if (!platformScrollMode()) {
        platformPullTracking = false;
        return;
      }
      platformTouchStartY = e.touches[0]?.clientY ?? 0;
      platformTouchStartScrollTop = scrollRef.current?.scrollTop ?? 0;
      platformPullTracking = true;
    };

    const onPlatformTouchMove = () => {
      if (!platformPullTracking || !platformScrollMode()) return;
      const face = scrollRef.current;
      if (face && face.scrollTop > SCROLL_EDGE_THRESHOLD) {
        wasAtTopRef.current = false;
      }
    };

    const onPlatformTouchEnd = (e: TouchEvent) => {
      if (!platformPullTracking) return;
      platformPullTracking = false;
      if (!platformScrollMode() || isAnimating()) return;
      const face = scrollRef.current;
      if (!face) return;
      if (platformTouchStartScrollTop > SCROLL_EDGE_THRESHOLD) return;
      if (face.scrollTop > SCROLL_EDGE_THRESHOLD) return;
      const endY = e.changedTouches[0]?.clientY ?? platformTouchStartY;
      const dy = endY - platformTouchStartY;
      if (dy > TOUCH_LEAVE_PX) nudge(-1);
    };

    const onScrollerWheelCapture = (e: WheelEvent) => {
      if (performance.now() >= platformWheelLockUntilRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    scroller?.addEventListener("wheel", onScrollerWheelCapture, { passive: false, capture: true });
    scroller?.addEventListener("wheel", onPlatformWheel, { passive: false });
    scroller?.addEventListener("touchstart", onPlatformTouchStart, { passive: true });
    scroller?.addEventListener("touchmove", onPlatformTouchMove, { passive: true });
    scroller?.addEventListener("touchend", onPlatformTouchEnd, { passive: true });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onGameTouchStart);
      window.removeEventListener("touchend", onGameTouchEnd);
      scroller?.removeEventListener("wheel", onScrollerWheelCapture, true);
      scroller?.removeEventListener("wheel", onPlatformWheel);
      scroller?.removeEventListener("touchstart", onPlatformTouchStart);
      scroller?.removeEventListener("touchmove", onPlatformTouchMove);
      scroller?.removeEventListener("touchend", onPlatformTouchEnd);
    };
  }, [interactive, goToPanel, isAnimating, contentHost]);

  const onPlatform = initialPanel === "nav-cube";

  return (
    <>
      <div
        ref={shellRef}
        data-homepage-flip-stack=""
        data-active-panel={activePanel}
        data-content-host={contentHost}
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
            {/* Product content on the cube face during the 3D flip */}
            {contentHost === "face" ? (
              begin
            ) : (
              <div className="h-full w-full bg-background" aria-hidden />
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        data-homepage-flip-scroll=""
        aria-hidden={contentHost === "overlay" ? "false" : "true"}
        className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[15] overflow-x-hidden overflow-y-auto scroll-auto bg-background sm:top-[calc(4rem+env(safe-area-inset-top,0px))]"
        style={{
          scrollPaddingTop: "0.75rem",
          opacity: onPlatform && contentHost === "overlay" ? 1 : 0,
          visibility: onPlatform && contentHost === "overlay" ? "visible" : "hidden",
          pointerEvents: onPlatform && contentHost === "overlay" ? "auto" : "none",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {contentHost === "overlay" ? begin : null}
      </div>
    </>
  );
}
