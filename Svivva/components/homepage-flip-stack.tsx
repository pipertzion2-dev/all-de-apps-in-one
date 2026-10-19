"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
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
const MAX_PANEL_INDEX = 1;
/** Timed 3D cube rotation — exponential settle looked like an instant cut on mobile. */
const FLIP_DURATION_MS = 720;
const FLIP_DURATION_MOBILE_MS = 820;

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
 * Panel changes are button/event only — never wheel or scroll hijacking.
 * Wheel/trackpad scroll is native inside the Moves Like overlay so the site
 * stays usable for browsing and interacting with the game canvas.
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
  const touchPrimaryRef = useRef(false);
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
        return;
      }

      syncShellAndOverlay(to);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [paintRotor, syncShellAndOverlay, updateContentHost]);

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
        updateContentHost("face");
        resetPlatformScroll();
        document.body.style.overflow = "";
      } else {
        resetPlatformScroll();
      }
    },
    [resetPlatformScroll, updateContentHost],
  );

  const goToPanel = useCallback(
    (panel: HomepageFlipPanelId) => {
      const next = flipPanelIndex(panel);
      const settled =
        Math.abs(displayedIndexRef.current - next) <= FLIP_SETTLE_EPSILON &&
        Math.abs(targetIndexRef.current - next) <= FLIP_SETTLE_EPSILON;
      if (settled) return;
      if (contentHostRef.current === "handoff") return;

      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }

      if (panel === "home-game") {
        updateContentHost("face");
      }

      animFromRef.current = displayedIndexRef.current;
      animToRef.current = next;
      animStartRef.current = performance.now();
      animDurationRef.current = touchPrimaryRef.current
        ? FLIP_DURATION_MOBILE_MS
        : FLIP_DURATION_MS;
      targetIndexRef.current = next;
      commitPanel(panel);
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
    [commitPanel, ensureTick, interactive, updateContentHost],
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

  // Promote handoff → overlay only after the overlay tree is in the DOM.
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
    if (!interactive) return;
    const onFlip = (event: Event) => {
      const panel = (event as CustomEvent<{ panel?: HomepageFlipPanelId }>).detail?.panel;
      if (panel) goToPanel(panel);
    };
    window.addEventListener(HOMEPAGE_FLIP_EVENT, onFlip);
    return () => window.removeEventListener(HOMEPAGE_FLIP_EVENT, onFlip);
  }, [goToPanel, interactive]);

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
        data-flip-input="buttons-only"
        className="relative w-full"
        style={{
          height: "100svh",
          perspective: "2400px",
          perspectiveOrigin: "50% 50%",
          overflow: "hidden",
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
          overscrollBehaviorY: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {showOverlayContent ? begin : null}
      </div>
    </>
  );
}
