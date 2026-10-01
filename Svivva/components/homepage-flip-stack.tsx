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
const WHEEL_SNAP_MS = 320;
const SWIPE_THRESHOLD_PX = 40;
const MAX_PANEL_INDEX = 1;
const SCROLL_EDGE_THRESHOLD = 8;
/** Platform content fades in only as the game → home flip finishes (avoids clipping mid-rotation). */
const OVERLAY_FADE_START = 0.88;
const OVERLAY_FADE_END = 1;

function overlayOpacityForIndex(index: number): number {
  return Math.min(
    1,
    Math.max(0, (index - OVERLAY_FADE_START) / (OVERLAY_FADE_END - OVERLAY_FADE_START)),
  );
}

/** Match visibility — if users can read the overlay, they must be able to scroll it (mobile). */
function overlayScrollEnabled(index: number, panel: HomepageFlipPanelId): boolean {
  return panel === "nav-cube" && index >= OVERLAY_FADE_START - FLIP_SETTLE_EPSILON;
}

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const halfHRef = useRef(400);
  const virtualIndexRef = useRef(flipPanelIndex(initialPanel));
  const targetIndexRef = useRef(flipPanelIndex(initialPanel));
  const displayedIndexRef = useRef(flipPanelIndex(initialPanel));
  const activePanelRef = useRef<HomepageFlipPanelId>(initialPanel);
  const scrubbingRef = useRef(false);
  const animRef = useRef(0);
  const wheelSnapTimerRef = useRef(0);
  const [activePanel, setActivePanel] = useState<HomepageFlipPanelId>(initialPanel);

  const panels = [
    { id: "home-game" as const, node: game },
    { id: "nav-cube" as const, node: begin },
  ];

  const syncOverlayVisuals = useCallback(
    (index: number, panel: HomepageFlipPanelId) => {
      const scroller = scrollRef.current;
      const shell = shellRef.current;
      const opacity = overlayOpacityForIndex(index);
      const scrollEnabled = overlayScrollEnabled(index, panel);
      const shellHidden = scrollEnabled;

      if (scroller) {
        scroller.style.opacity = scrollEnabled ? "1" : String(opacity);
        scroller.style.visibility = index >= OVERLAY_FADE_START - 0.02 ? "visible" : "hidden";
        scroller.style.pointerEvents = scrollEnabled ? "auto" : "none";
        scroller.style.touchAction = scrollEnabled ? "pan-y" : "none";
        scroller.setAttribute("aria-hidden", scrollEnabled ? "false" : "true");
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
    syncOverlayVisuals(displayedIndexRef.current, activePanelRef.current);
  }, [paintFaces, paintRotor, syncOverlayVisuals]);

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
      syncOverlayVisuals(index, activePanelRef.current);
    },
    [paintRotor, stopAnim, syncOverlayVisuals],
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
          syncOverlayVisuals(target, activePanelRef.current);
        }
        return;
      }

      const smoothing = 1 - Math.exp(-20 * dt);
      current += delta * smoothing;
      if ((delta > 0 && current > target) || (delta < 0 && current < target)) {
        current = target;
      }
      displayedIndexRef.current = current;
      paintRotor(current);
      syncOverlayVisuals(current, activePanelRef.current);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor, syncOverlayVisuals]);

  const resetPlatformScroll = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = 0;
  }, []);

  const commitPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      activePanelRef.current = panel;
      setActivePanel(panel);
      window.history.replaceState(null, "", `/#${hashForFlipPanel(panel)}`);
      if (panel === "nav-cube") {
        resetPlatformScroll();
      }
      syncOverlayVisuals(displayedIndexRef.current, panel);
    },
    [resetPlatformScroll, syncOverlayVisuals],
  );

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
  }, [commitPanel, ensureTick, resetPlatformScroll]);

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
    activePanelRef.current = initialPanel;
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

    const panelIdForInput = () =>
      scrubbingRef.current
        ? activePanelRef.current
        : (panels[settledPanelIndex()]?.id ?? "home-game");

    const scrollSurfaceFor = () => scrollRef.current;

    const isNavCubeScrollActive = () =>
      overlayScrollEnabled(displayedIndexRef.current, activePanelRef.current);

    /** Platform face visible — native overlay scroll, not flip scrubbing (see OVERLAY_FADE_START). */
    const platformScrollMode = () =>
      activePanelRef.current === "nav-cube" &&
      displayedIndexRef.current >= OVERLAY_FADE_START - FLIP_SETTLE_EPSILON;

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
      if (panelId === "nav-cube") {
        const { scrollable, atTop } = faceScrollState(face);
        if (direction > 0) return false;
        return scrollable ? atTop : true;
      }
      const { scrollable, atTop, atBottom } = faceScrollState(face);
      if (!scrollable) return true;
      if (direction > 0) return atTop || atBottom;
      return atTop || atBottom;
    };

    const applyDelta = (deltaY: number) => {
      if (Math.abs(deltaY) < 0.5) return false;

      const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
      const panelId = panelIdForInput();
      const face = isNavCubeScrollActive() ? scrollSurfaceFor() : null;
      if (!canFlipFromFace(face, direction, panelId)) return false;

      const atMin = virtualIndexRef.current <= FLIP_SETTLE_EPSILON && direction < 0;
      const atMax =
        virtualIndexRef.current >= MAX_PANEL_INDEX - FLIP_SETTLE_EPSILON && direction > 0;
      if (atMin || atMax) return false;

      if (reducedMotion) {
        const next = Math.min(MAX_PANEL_INDEX, Math.max(0, settledPanelIndex() + direction));
        if (next === settledPanelIndex()) return false;
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
      if (platformScrollMode()) return;

      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 4) return;

      if (applyDelta(delta)) {
        e.preventDefault();
      }
    };

    const onPlatformWheel = (e: WheelEvent) => {
      if (!platformScrollMode()) return;

      const delta = normalizeWheelDelta(e);
      if (Math.abs(delta) < 4 || delta >= 0) return;

      const face = scrollSurfaceFor();
      const { atTop } = faceScrollState(face);
      if (atTop && applyDelta(delta)) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    let touchScrubbing = false;

    const onTouchStart = (e: TouchEvent) => {
      if (platformScrollMode()) return;
      touchStartY = e.touches[0]?.clientY ?? 0;
      touchScrubbing = false;
      if (wheelSnapTimerRef.current) {
        window.clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (platformScrollMode()) return;

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
      if (platformScrollMode()) return;

      if (touchScrubbing) {
        snapToNearestPanel();
        return;
      }

      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      const current = settledPanelIndex();
      const panelId = activePanelRef.current;
      const face = isNavCubeScrollActive() ? scrollSurfaceFor() : null;
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
    };

    const onPlatformTouchMove = (e: TouchEvent) => {
      if (!platformPullTracking || !platformScrollMode()) return;
      const face = scrollSurfaceFor();
      if (!face || face.scrollTop > SCROLL_EDGE_THRESHOLD) return;
      const y = e.touches[0]?.clientY ?? platformTouchStartY;
      const pullDown = y - platformTouchStartY;
      if (pullDown > SWIPE_THRESHOLD_PX) {
        platformPullTracking = false;
        e.preventDefault();
        goToPanel("home-game");
      }
    };

    const onPlatformTouchEnd = () => {
      platformPullTracking = false;
    };

    scroller?.addEventListener("wheel", onPlatformWheel, { passive: false });
    scroller?.addEventListener("touchstart", onPlatformTouchStart, { passive: true });
    scroller?.addEventListener("touchmove", onPlatformTouchMove, { passive: false });
    scroller?.addEventListener("touchend", onPlatformTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      scroller?.removeEventListener("wheel", onPlatformWheel);
      scroller?.removeEventListener("touchstart", onPlatformTouchStart);
      scroller?.removeEventListener("touchmove", onPlatformTouchMove);
      scroller?.removeEventListener("touchend", onPlatformTouchEnd);
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
                overflow: "hidden",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform",
              }}
            >
              {panel.id === "nav-cube" ? (
                <div className="h-full w-full bg-background" aria-hidden />
              ) : (
                panel.node
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        data-homepage-flip-scroll=""
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[15] overflow-x-hidden overflow-y-auto overscroll-y-contain bg-background sm:top-[calc(4rem+env(safe-area-inset-top,0px))]"
        style={{
          scrollPaddingTop: "0.75rem",
          opacity: overlayOpacityForIndex(flipPanelIndex(initialPanel)),
          visibility:
            flipPanelIndex(initialPanel) >= OVERLAY_FADE_START - 0.02 ? "visible" : "hidden",
          pointerEvents: overlayScrollEnabled(flipPanelIndex(initialPanel), initialPanel)
            ? "auto"
            : "none",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          transform: "translateZ(0)",
        }}
      >
        {begin}
      </div>
    </>
  );
}
