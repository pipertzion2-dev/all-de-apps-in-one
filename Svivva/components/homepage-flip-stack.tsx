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
const NUDGE_DEBOUNCE_MS = 1400;
const SWIPE_THRESHOLD_PX = 72;
const SWIPE_THRESHOLD_MOBILE_PX = 88;
const MAX_PANEL_INDEX = 1;
const SCROLL_EDGE_THRESHOLD = 8;
/** Timed 3D cube rotation — exponential settle looked like an instant cut on mobile. */
const FLIP_DURATION_MS = 720;
const FLIP_DURATION_MOBILE_MS = 820;
/** Absorb leftover wheel momentum after landing on The Moves Like. */
const PLATFORM_WHEEL_LOCK_MS = 1200;
const WHEEL_OVERSCROLL_FLIP_PX = 900;
const WHEEL_OVERSCROLL_MIN_EVENTS = 10;
const AT_TOP_DWELL_MS = 900;
const AT_TOP_INERTIA_LOCK_MS = 700;
/** Mobile pull-down at scroll top → Klean Sneaks (touchend only; never touchmove preventDefault). */
const TOUCH_LEAVE_PX = 120;
/** Intentional downward scroll on Klean Sneaks before flipping to The Moves Like. */
const GAME_WHEEL_FLIP_PX = 320;
const GAME_WHEEL_MIN_EVENTS = 4;
const GAME_WHEEL_IDLE_RESET_MS = 280;

/**
 * face — product content on the rotating cube face
 * handoff — mount overlay copy while face stays visible (avoids blank frame)
 * overlay — fixed scroll layer owns content; cube shell hidden
 */
type ContentHost = "face" | "handoff" | "overlay";

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
 * Handoff mounts the overlay copy before hiding the cube so we never flash black.
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
  const gameWheelAccumRef = useRef(0);
  const gameWheelEventsRef = useRef(0);
  const gameWheelLastAtRef = useRef(0);
  const contentHostRef = useRef<ContentHost>(initialPanel === "nav-cube" ? "overlay" : "face");
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);
  const [contentHost, setContentHost] = useState<ContentHost>(
    initialPanel === "nav-cube" ? "overlay" : "face",
  );

  const updateContentHost = useCallback((next: ContentHost) => {
    contentHostRef.current = next;
    setContentHost(next);
  }, []);

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
      // Only hide the cube once the overlay owns content — never during handoff.
      const onPlatform =
        settledOnPlatform(index, targetIndexRef.current, activePanelRef.current) &&
        contentHostRef.current === "overlay";

      if (shell) {
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

  const resetGameWheelAccum = useCallback(() => {
    gameWheelAccumRef.current = 0;
    gameWheelEventsRef.current = 0;
    gameWheelLastAtRef.current = 0;
  }, []);

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
      lastNudgeAtRef.current = performance.now();
      resetGameWheelAccum();

      // Land on The Moves Like: mount overlay while cube face stays visible,
      // then promote in useLayoutEffect so we never flash an empty scroller.
      if (to >= MAX_PANEL_INDEX - FLIP_SETTLE_EPSILON && activePanelRef.current === "nav-cube") {
        if (shellRef.current) {
          shellRef.current.style.opacity = "1";
          shellRef.current.style.pointerEvents = "none";
        }
        if (scrollRef.current) {
          scrollRef.current.style.opacity = "0";
          scrollRef.current.style.visibility = "hidden";
          scrollRef.current.style.pointerEvents = "none";
        }
        updateContentHost("handoff");
        platformWheelLockUntilRef.current = performance.now() + PLATFORM_WHEEL_LOCK_MS;
        wasAtTopRef.current = true;
        atTopSinceRef.current = performance.now();
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        return;
      }

      syncShellAndOverlay(to);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor, resetGameWheelAccum, syncShellAndOverlay, updateContentHost]);

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
        updateContentHost("face");
        resetPlatformScroll();
        document.body.style.overflow = "";
        overscrollAccumRef.current = 0;
        overscrollEventsRef.current = 0;
        wasAtTopRef.current = false;
        atTopSinceRef.current = 0;
        resetGameWheelAccum();
      } else {
        resetPlatformScroll();
      }
    },
    [resetGameWheelAccum, resetPlatformScroll, updateContentHost],
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
        updateContentHost("face");
      }

      lastNudgeAtRef.current = performance.now();
      overscrollAccumRef.current = 0;
      overscrollEventsRef.current = 0;
      resetGameWheelAccum();
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
    [commitPanel, ensureTick, interactive, resetGameWheelAccum, updateContentHost],
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

  // Promote handoff → overlay only after the overlay tree is in the DOM (same frame paint).
  useLayoutEffect(() => {
    if (contentHost !== "handoff") {
      if (contentHost === "overlay") {
        syncShellAndOverlay(displayedIndexRef.current);
        if (!touchPrimaryRef.current) {
          document.body.style.overflow = "hidden";
        }
      }
      return;
    }

    let cancelled = false;
    let raf2 = 0;
    // Double rAF: first commit paints overlay children, second reveals them.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        updateContentHost("overlay");
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [contentHost, syncShellAndOverlay, updateContentHost]);

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
    updateContentHost(initialPanel === "nav-cube" ? "overlay" : "face");
    syncDepth();
  }, [initialPanel, syncDepth, updateContentHost]);

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
      ) && contentHostRef.current === "overlay";

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
      if (contentHostRef.current === "handoff") return false;

      const now = performance.now();
      if (now - lastNudgeAtRef.current < NUDGE_DEBOUNCE_MS) return false;

      const current = settledPanelIndex();
      const panelId = flipPanelFromIndex(current);
      if (!canFlipFromPanel(direction, panelId)) return false;

      const next = Math.min(MAX_PANEL_INDEX, Math.max(0, current + direction));
      if (next === current) return false;

      lastNudgeAtRef.current = now;
      resetGameWheelAccum();
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
      if (isAnimating() || contentHostRef.current === "handoff") {
        e.preventDefault();
        return;
      }
      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 24) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      const current = settledPanelIndex();

      // Klean Sneaks → Moves Like: require sustained intentional scroll, not one tick.
      if (current === 0 && direction > 0) {
        const now = performance.now();
        if (
          gameWheelLastAtRef.current &&
          now - gameWheelLastAtRef.current > GAME_WHEEL_IDLE_RESET_MS
        ) {
          resetGameWheelAccum();
        }
        gameWheelLastAtRef.current = now;
        gameWheelAccumRef.current += delta;
        gameWheelEventsRef.current += 1;
        e.preventDefault();
        if (
          gameWheelAccumRef.current >= GAME_WHEEL_FLIP_PX &&
          gameWheelEventsRef.current >= GAME_WHEEL_MIN_EVENTS
        ) {
          resetGameWheelAccum();
          nudge(1);
        }
        return;
      }

      resetGameWheelAccum();
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

      if (delta > 24) {
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
      overscrollAccumRef.current = Math.min(
        overscrollAccumRef.current,
        WHEEL_OVERSCROLL_FLIP_PX * 2,
      );
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
      if (isAnimating() || contentHostRef.current === "handoff") return;
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
  }, [interactive, goToPanel, isAnimating, resetGameWheelAccum]);

  // Live state — not initialPanel. Handoff keeps face content until overlay is ready.
  const showFaceContent = contentHost === "face" || contentHost === "handoff";
  const showOverlayContent = contentHost === "handoff" || contentHost === "overlay";
  const showOverlay = contentHost === "overlay" && activePanel === "nav-cube";

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
          // When the overlay owns scroll, keep the cube shell out of the hit path
          // so React re-renders do not revive pointer-events on a faded shell.
          opacity: showOverlay ? 0 : undefined,
          pointerEvents: interactive && !showOverlay ? "auto" : "none",
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
            {/* Product content on the cube face during the 3D flip + handoff */}
            {showFaceContent ? begin : <div className="h-full w-full bg-background" aria-hidden />}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        data-homepage-flip-scroll=""
        aria-hidden={showOverlay ? "false" : "true"}
        className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[15] overflow-x-hidden overflow-y-auto scroll-auto bg-background sm:top-[calc(4rem+env(safe-area-inset-top,0px))]"
        style={{
          scrollPaddingTop: "0.75rem",
          opacity: showOverlay ? 1 : 0,
          visibility: showOverlay ? "visible" : "hidden",
          pointerEvents: showOverlay ? "auto" : "none",
          touchAction: showOverlay ? "pan-y" : "none",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Mount during handoff so the tree is warm before we hide the cube */}
        {showOverlayContent ? begin : null}
      </div>
    </>
  );
}
