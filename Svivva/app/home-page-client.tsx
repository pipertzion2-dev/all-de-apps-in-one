"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { runBodyLayerHygiene } from "@/lib/body-layer-cleanup";
import { showHomepageSection } from "@/lib/homepage-layout";
import { flipPanelFromHash } from "@/lib/homepage-scroll";
import { HomepageFlipStack } from "@/components/homepage-flip-stack";
import { HomepageCubePanel } from "@/components/homepage-cube-panel";
import { HomepageGamePanel } from "@/components/homepage-game-panel";
import { HomepageSiteFooter } from "@/components/homepage-site-footer";
import type { HomepageFlipPanelId } from "@/lib/homepage-flip-stack";
import { ZzaiModeToggle } from "@/components/zzai-mode-toggle";
import Link from "next/link";
import Image from "next/image";
import introImage from "@/attached_assets/IMG_1493_1770509047497.png";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const introCaptureRef = useRef<HTMLDivElement>(null);
  const flipRotorRef = useRef<HTMLDivElement>(null);
  const flipFrontRef = useRef<HTMLDivElement>(null);
  /** The page itself is the flip's second face, so it rotates in as a real surface. */
  const pageFaceRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const scrollHintBounceRef = useRef<HTMLDivElement>(null);
  const halfHRef = useRef(400);
  const [flipComplete, setFlipComplete] = useState(false);
  const virtualScrollRef = useRef(0);
  const targetProgressRef = useRef(0);
  const displayedProgressRef = useRef(0);
  const flipAnimRef = useRef(0);
  const scrollHintHiddenRef = useRef(false);
  const finishingIntroRef = useRef(false);
  const [canMountHeavy3d, setCanMountHeavy3d] = useState(false);
  const [flipInitialPanel, setFlipInitialPanel] = useState<HomepageFlipPanelId>("home-game");
  const skipIntroRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!flipComplete) return;
    // Defer WebGL until the intro overlay is gone — mounting during the flip freezes scroll.
    const mountTimer = window.setTimeout(() => setCanMountHeavy3d(true), 200);
    return () => window.clearTimeout(mountTimer);
  }, [flipComplete]);

  useEffect(() => {
    runBodyLayerHygiene();
  }, []);

  useEffect(() => {
    if (!flipComplete) return;
    runBodyLayerHygiene();
  }, [flipComplete]);

  useEffect(() => {
    if (!flipComplete || !showHomepageSection("scrollSnap")) return;

    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const hash = window.location.hash.replace("#", "");
    const flipPanel = flipPanelFromHash(hash);

    const nextPanel = flipPanel ?? "home-game";
    setFlipInitialPanel((current) => (current === nextPanel ? current : nextPanel));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    return () => {
      history.scrollRestoration = previousScrollRestoration;
    };
  }, [flipComplete]);

  useEffect(() => {
    halfHRef.current = window.innerHeight / 2;
  }, []);

  useLayoutEffect(() => {
    if (flipComplete) return;

    const captureEl = introCaptureRef.current;
    if (!captureEl) return;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const stopFlipAnim = () => {
      if (flipAnimRef.current) {
        cancelAnimationFrame(flipAnimRef.current);
        flipAnimRef.current = 0;
      }
    };

    const finishIntro = () => {
      stopFlipAnim();
      // Imperatively-set transforms are invisible to React's style diff, so the
      // page face has to be released by hand or the finished page stays in 3D.
      if (pageFaceRef.current) {
        pageFaceRef.current.style.transform = "";
        pageFaceRef.current.style.transformOrigin = "";
        pageFaceRef.current.style.willChange = "";
      }
      setFlipComplete(true);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };

    skipIntroRef.current = finishIntro;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion skips the rotation entirely — finishIntro also releases the
    // page face, so the 3D transform is never applied for these users.
    if (reducedMotion) {
      finishIntro();
      return () => {
        skipIntroRef.current = null;
      };
    }

    const flipZone = Math.max(window.innerHeight * (mobile ? 0.72 : 0.85), mobile ? 340 : 420);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const progressToAngle = (progress: number) => {
      const clamped = Math.min(Math.max(progress, 0), 1);
      return easeOutCubic(clamped) * 90;
    };

    /**
     * The intro panel is the front face of a box whose depth matches the
     * viewport height; the page below is the adjacent face. Painting both from
     * one angle is what makes the reveal read as a solid rotating object
     * instead of a flat cross-fade.
     */
    const paintPageFace = (angle: number) => {
      if (!pageFaceRef.current) return;
      // Hinged on its bottom edge: edge-on at 0deg, exactly in place at 90deg,
      // so the handoff to the real page needs no correction.
      pageFaceRef.current.style.transform = `rotateX(${angle - 90}deg)`;
    };

    const syncFlipDepth = () => {
      const halfH = halfHRef.current;
      const angle = progressToAngle(displayedProgressRef.current);

      if (flipFrontRef.current) {
        flipFrontRef.current.style.transform = `translate3d(0, 0, ${halfH}px)`;
      }
      if (flipRotorRef.current) {
        flipRotorRef.current.style.transform = `translate3d(0, 0, ${-halfH}px) rotateX(${angle}deg)`;
      }
      paintPageFace(angle);
    };

    const paintFlip = (progress: number) => {
      const halfH = halfHRef.current;
      const clamped = Math.min(Math.max(progress, 0), 1);
      displayedProgressRef.current = clamped;
      const angle = progressToAngle(clamped);

      if (flipRotorRef.current) {
        flipRotorRef.current.style.transform = `translate3d(0, 0, ${-halfH}px) rotateX(${angle}deg)`;
      }
      paintPageFace(angle);

      if (!finishingIntroRef.current) {
        captureEl.style.opacity = "1";
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(Math.max(0, 1 - clamped * 8));
      }

      if (!scrollHintHiddenRef.current && clamped >= 0.02) {
        scrollHintHiddenRef.current = true;
        if (scrollHintBounceRef.current) {
          scrollHintBounceRef.current.style.animation = "none";
        }
      }
    };

    const scheduleFinish = () => {
      if (finishingIntroRef.current) return;
      finishingIntroRef.current = true;
      stopFlipAnim();
      targetProgressRef.current = 1;
      paintFlip(1);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      captureEl.style.pointerEvents = "none";
      captureEl.style.transition = "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)";
      captureEl.style.opacity = "0";
      window.setTimeout(finishIntro, 440);
    };

    let lastFrameMs = performance.now();
    const tickFlip = (now: number) => {
      flipAnimRef.current = 0;
      const dt = Math.min((now - lastFrameMs) / 1000, 0.032);
      lastFrameMs = now;

      const target = targetProgressRef.current;
      let current = displayedProgressRef.current;
      const delta = target - current;

      if (Math.abs(delta) > 0.0004) {
        const smoothing = 1 - Math.exp(-12 * dt);
        current += delta * smoothing;
        if ((delta > 0 && current > target) || (delta < 0 && current < target)) {
          current = target;
        }
        paintFlip(current);
        flipAnimRef.current = requestAnimationFrame(tickFlip);
        return;
      }

      if (current !== target) paintFlip(target);

      if (target >= 1 && displayedProgressRef.current >= 0.985) {
        scheduleFinish();
      }
    };

    const ensureTick = () => {
      if (!flipAnimRef.current) {
        lastFrameMs = performance.now();
        flipAnimRef.current = requestAnimationFrame(tickFlip);
      }
    };

    const snapToFinish = () => {
      if (finishingIntroRef.current) return;
      targetProgressRef.current = 1;
      virtualScrollRef.current = flipZone;
      ensureTick();
    };

    let idleCompleteTimer: number | undefined;
    const bumpIdleComplete = () => {
      if (idleCompleteTimer !== undefined) window.clearTimeout(idleCompleteTimer);
      idleCompleteTimer = window.setTimeout(() => {
        if (finishingIntroRef.current) return;
        if (displayedProgressRef.current >= 0.68) {
          snapToFinish();
        }
      }, 750);
    };

    const autoSkipMs = mobile ? 5500 : 8000;
    const autoSkipTimer = window.setTimeout(() => {
      if (finishingIntroRef.current) return;
      if (displayedProgressRef.current >= 0.12) {
        snapToFinish();
      } else {
        scheduleFinish();
      }
    }, autoSkipMs);

    const applyDelta = (delta: number) => {
      if (finishingIntroRef.current) return;
      const gain = mobile ? 1.05 : 0.9;
      const clampedDelta = Math.sign(delta) * Math.min(Math.abs(delta) * gain, 36);
      virtualScrollRef.current = Math.max(
        0,
        Math.min(flipZone, virtualScrollRef.current + clampedDelta),
      );
      targetProgressRef.current = virtualScrollRef.current / flipZone;
      bumpIdleComplete();
      ensureTick();
    };

    syncFlipDepth();
    paintFlip(0);

    const handleResize = () => {
      halfHRef.current = window.innerHeight / 2;
      syncFlipDepth();
      paintFlip(displayedProgressRef.current);
    };
    window.addEventListener("resize", handleResize);

    const handleWheel = (e: WheelEvent) => {
      if (finishingIntroRef.current) return;
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight * 0.35;
      applyDelta(delta);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (finishingIntroRef.current) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      touchStartY = y;
      applyDelta(delta);
    };

    const handleTouchEnd = () => {
      if (finishingIntroRef.current) return;
      if (displayedProgressRef.current >= 0.72) {
        snapToFinish();
      }
    };

    let wheelEndTimer: number | undefined;
    const handleWheelEnd = () => {
      if (wheelEndTimer !== undefined) window.clearTimeout(wheelEndTimer);
      wheelEndTimer = window.setTimeout(() => {
        if (finishingIntroRef.current) return;
        if (displayedProgressRef.current >= 0.72) {
          snapToFinish();
        }
      }, 120);
    };

    // Single window listeners only — capture + window previously doubled every delta.
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheelEnd, { passive: true });

    return () => {
      skipIntroRef.current = null;
      window.clearTimeout(autoSkipTimer);
      if (idleCompleteTimer !== undefined) window.clearTimeout(idleCompleteTimer);
      if (wheelEndTimer !== undefined) window.clearTimeout(wheelEndTimer);
      stopFlipAnim();
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("wheel", handleWheelEnd);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [flipComplete]);

  return (
    <div
      ref={containerRef}
      data-landing-page
      className="min-h-screen w-full bg-background overflow-x-hidden"
    >
      {!flipComplete && (
        <div
          ref={introCaptureRef}
          className="fixed inset-0"
          style={{
            zIndex: 70,
            touchAction: "none",
            overflow: "visible",
            // Transparent on purpose: the receding corners now expose the page
            // face rotating in behind, which is what reads as a solid box. An
            // opaque backdrop here would hide the second face entirely.
            backgroundColor: "transparent",
            opacity: 1,
            willChange: "opacity",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              perspective: "2400px",
              perspectiveOrigin: "50% 50%",
              overflow: "visible",
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            <div
              ref={flipRotorRef}
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transformStyle: "preserve-3d",
                willChange: "transform",
                transformOrigin: "center center",
                transform: "translate3d(0, 0, calc(-50vh)) rotateX(0deg)",
              }}
            >
              <div
                ref={flipFrontRef}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  willChange: "transform",
                  transform: "translate3d(0, 0, 50vh)",
                }}
              >
                {/* Overscan bleed. Under perspective the panel's top corners
                    pull inward as they recede, and neither face covers the gap
                    mid-rotation, which showed as black wedges. Extending the
                    white past the top and sides keeps it covered; the bottom
                    stays flush so it never hides the page face rising in. */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "-45%",
                    left: "-45%",
                    right: "-45%",
                    bottom: 0,
                    backgroundColor: "#ffffff",
                  }}
                />
                <div
                  className="w-full h-full overflow-hidden relative"
                  style={{
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src={introImage}
                    alt="ZZAI"
                    width={1024}
                    height={1024}
                    sizes="100vw"
                    style={{
                      // Fill the panel in both axes: `height: auto` left the square
                      // image only as tall as the viewport was wide, stranding the
                      // slack as blank space on portrait/mobile viewports.
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "center",
                      display: "block",
                    }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            ref={scrollHintRef}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              zIndex: 10,
              opacity: 1,
              willChange: "opacity",
            }}
          >
            <div
              ref={scrollHintBounceRef}
              className="flex flex-col items-center gap-1 rounded-full bg-white/85 px-5 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
              style={{ animation: "scrollBounce 1.5s ease-in-out 0s infinite" }}
            >
              <span
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: "'Zc', sans-serif" }}
              >
                Scroll to enter
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-700"
              >
                <path d="M10 4v12M5 11l5 5 5-5" />
              </svg>
            </div>
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 z-20 pointer-events-auto rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground backdrop-blur-sm"
            onClick={() => {
              skipIntroRef.current?.();
            }}
          >
            Skip intro
          </button>
        </div>
      )}

      {/* During the intro this is the flip's second face, so the reveal is a real
          rotation rather than a cross-fade. Rotating the actual page avoids a
          duplicate copy, and it is clipped to one screen so a 10,000px document
          is never promoted to a 3D layer. Heavy WebGL stays unmounted until the
          intro ends, so the face rotates in with the page chrome, not the camo. */}
      <div
        style={
          flipComplete
            ? undefined
            : { perspective: "2400px", perspectiveOrigin: "50% 50%", overflow: "hidden" }
        }
      >
        <div
          ref={pageFaceRef}
          className="bg-background"
          style={
            flipComplete
              ? { pointerEvents: "auto" }
              : {
                  pointerEvents: "none",
                  height: "100svh",
                  overflow: "hidden",
                  transformOrigin: "50% 100%",
                  willChange: "transform",
                }
          }
        >
          <nav
            className="fixed top-0 left-0 right-0 z-[60] h-14 sm:h-16 border-b border-border/30 backdrop-blur-xl bg-background/85"
            style={{ opacity: flipComplete ? 1 : 0, pointerEvents: flipComplete ? "auto" : "none" }}
          >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
                <ZzaiModeToggle size="sm" />
                <span className="text-[9px] font-bold leading-none tracking-[0.2em] text-foreground/90 sm:text-[10px]">
                  zzai zzai
                </span>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                <Link
                  href="/play"
                  className="hidden items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted/50 sm:flex"
                  data-testid="link-svivva-play-mobile"
                >
                  <span className="seeds-holo-text text-base leading-none">&#9835;</span>
                  <span className="seeds-holo-text text-xs font-bold tracking-wide">Play</span>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2.5 text-xs"
                    data-testid="button-nav-dashboard"
                  >
                    Dashboard
                  </Button>
                </Link>
                <a href="/login" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-xs"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </a>
                <a href="/signup">
                  <Button
                    size="sm"
                    className="whitespace-nowrap bg-[#5B8DA8] px-3 text-xs sm:px-3.5"
                    data-testid="button-start-free"
                  >
                    Start Free
                  </Button>
                </a>
              </div>
            </div>
          </nav>

          <HomepageFlipStack
            interactive={flipComplete}
            initialPanel={flipInitialPanel}
            begin={
              <ClientErrorBoundary
                fallback={
                  <p className="min-h-[100svh] px-4 py-12 text-center text-sm text-muted-foreground">
                    Cube navigation is temporarily unavailable.{" "}
                    <Link href="/dashboard" className="text-[#5B8DA8] underline">
                      Open the dashboard
                    </Link>
                    .
                  </p>
                }
              >
                <HomepageCubePanel mountCanvas={canMountHeavy3d} interactive={flipComplete} />
              </ClientErrorBoundary>
            }
            game={<HomepageGamePanel />}
          />

          {flipComplete ? <HomepageSiteFooter /> : null}
        </div>
      </div>
    </div>
  );
}
