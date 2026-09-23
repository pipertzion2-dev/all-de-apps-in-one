"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { isPortraitViewport } from "@/lib/clean-sneaks/run-quality";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GameLoadingWheels } from "@/components/clean-sneaks/GameLoadingWheels";
import { GameStartScreen, preloadMainGameCover } from "@/components/clean-sneaks/GameStartScreen";
import { SceneErrorBoundary } from "@/components/clean-sneaks/SceneErrorBoundary";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import { isBundleCardUnlocked } from "@/lib/clean-sneaks/bundle-unlock";
import type { GamePhase } from "@/lib/clean-sneaks/types";

type PlayMode = "runner" | "bundle-card";

const shellStyle = {
  paddingTop: "env(safe-area-inset-top)",
  paddingRight: "env(safe-area-inset-right)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
} as const;

/** Heavy game / shop / ads stay out of the first paint so the Karen loading screen can animate. */
const CleanSneaksGame3D = dynamic(
  () =>
    import("@/components/clean-sneaks/CleanSneaksGame3D").then((m) => ({
      default: m.CleanSneaksGame3D,
    })),
  { ssr: false, loading: () => null },
);

const StealTheBundleCardGame = dynamic(
  () =>
    import("@/components/clean-sneaks/StealTheBundleCardGame").then((m) => ({
      default: m.StealTheBundleCardGame,
    })),
  { ssr: false, loading: () => null },
);

const KleanShop = dynamic(
  () => import("@/components/clean-sneaks/monetization").then((m) => ({ default: m.KleanShop })),
  { ssr: false, loading: () => null },
);

const OfflineEarningsHost = dynamic(
  () =>
    import("@/components/clean-sneaks/monetization").then((m) => ({
      default: m.OfflineEarningsHost,
    })),
  { ssr: false, loading: () => null },
);

const GameAdBanner = dynamic(
  () => import("@/components/clean-sneaks/ads").then((m) => ({ default: m.GameAdBanner })),
  { ssr: false, loading: () => null },
);

const GameAdsEarningsChip = dynamic(
  () => import("@/components/clean-sneaks/ads").then((m) => ({ default: m.GameAdsEarningsChip })),
  { ssr: false, loading: () => null },
);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CleanSneaksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const beginGameRef = useRef<(() => void) | null>(null);
  /** Start tapped before the game chunk finished loading — flush when begin registers. */
  const pendingStartRef = useRef(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("loading");
  const [portrait, setPortrait] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("runner");
  const [bundleUnlocked, setBundleUnlocked] = useState(false);
  /** Cover "Start" was tapped — do not show the start splash again this visit. */
  const [introComplete, setIntroComplete] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  const preGame =
    playMode === "runner" && !introComplete && (gamePhase === "loading" || gamePhase === "start");
  const immersiveRun =
    playMode === "runner" &&
    (gamePhase === "running" ||
      gamePhase === "paused" ||
      gamePhase === "countdown" ||
      gamePhase === "colorPick" ||
      gamePhase === "walkComplete" ||
      gamePhase === "casino");
  const showGameShell = playMode === "bundle-card" || !preGame;

  const registerBegin = useCallback((begin: () => void) => {
    beginGameRef.current = begin;
    if (pendingStartRef.current) {
      pendingStartRef.current = false;
      begin();
    }
  }, []);

  const handlePhaseChange = useCallback((next: GamePhase) => {
    setGamePhase((prev) => {
      // Game3D mounts after the page splash — never regress back to Karen loading.
      if (next === "loading" && prev !== "loading") return prev;
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    setIntroComplete(true);
    if (beginGameRef.current) {
      beginGameRef.current();
    } else {
      pendingStartRef.current = true;
    }
  }, []);

  const advancePastLoading = useCallback(() => {
    setGamePhase((p) => (p === "loading" ? "start" : p));
  }, []);

  useEffect(() => {
    const syncViewport = () => setPortrait(isPortraitViewport());
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
    };
  }, []);

  useEffect(() => {
    const unlocked = isBundleCardUnlocked();
    setBundleUnlocked(unlocked);
    if (unlocked && searchParams.get("mode") === "bundle") {
      setPlayMode("bundle-card");
    }
  }, [gamePhase, playMode, searchParams]);

  /**
   * Page-owned loading → start. Do not wait on the heavy Game3D / RunScene chunks —
   * those were freezing mobile Safari on the Karen splash while the main thread parsed JS.
   */
  useEffect(() => {
    if (playMode !== "runner" || introComplete || gamePhase !== "loading") return;

    let cancelled = false;
    let delayId = 0;
    const reduced = prefersReducedMotion();
    const minMs = reduced ? 1200 : 2400;
    const started = performance.now();
    const maxId = window.setTimeout(advancePastLoading, minMs + 4000);

    const finishWhenReady = () => {
      if (cancelled) return;
      const wait = Math.max(0, minMs - (performance.now() - started));
      delayId = window.setTimeout(advancePastLoading, wait);
    };

    void preloadMainGameCover().then(finishWhenReady);

    return () => {
      cancelled = true;
      window.clearTimeout(maxId);
      window.clearTimeout(delayId);
    };
  }, [playMode, introComplete, gamePhase, advancePastLoading]);

  const openBundleCard = useCallback(() => {
    if (!isBundleCardUnlocked()) return;
    setPlayMode("bundle-card");
  }, []);

  return (
    <div
      data-svivva-app-shell=""
      data-clean-sneaks-fullscreen=""
      className={`fixed inset-0 z-[200] flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden ${
        gamePhase === "loading" ? "bg-white" : preGame ? "bg-black" : "bg-[#0a0c10]"
      }`}
      style={preGame ? undefined : shellStyle}
    >
      {!introComplete &&
        playMode === "runner" &&
        (gamePhase === "loading" || gamePhase === "start") && (
          <GameStartScreen
            preload={gamePhase === "loading"}
            onStart={gamePhase === "start" ? handleStart : undefined}
          />
        )}

      {gamePhase === "loading" && !introComplete && playMode === "runner" && (
        <GameLoadingWheels fullscreen onSkip={advancePastLoading} />
      )}

      {!preGame && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 20% 20%, rgba(91,141,168,0.25), transparent 55%),
              radial-gradient(ellipse 60% 45% at 85% 75%, rgba(217,79,156,0.18), transparent 50%),
              linear-gradient(180deg, #0a0c10, #06080c)
            `,
          }}
        />
      )}

      <div
        className={`relative flex min-h-0 flex-1 flex-col ${
          preGame && playMode === "runner" ? "hidden" : "z-30"
        }`}
      >
        {showGameShell && !immersiveRun && (
          <div
            className={`flex shrink-0 items-center justify-between gap-2 sm:gap-3 sm:px-6 ${
              portrait ? "px-2 py-1.5" : "px-4 py-3"
            }`}
          >
            <div>
              {!portrait && (
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">
                  ZZAI Play Presents
                </p>
              )}
              <h1
                className={`seeds-holo-text font-bold ${portrait ? "text-base" : "text-xl sm:text-2xl"}`}
              >
                {KLEAN_SNEAKS.display}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={
                  portrait
                    ? "h-8 px-2.5 text-xs border-[#f7e7b0]/35 text-[#f7e7b0]"
                    : "border-[#f7e7b0]/35 text-[#f7e7b0]"
                }
                onClick={() => setShopOpen(true)}
                data-testid="button-header-klean-shop"
              >
                Shop
              </Button>
              {bundleUnlocked && playMode === "runner" && (
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    portrait
                      ? "h-8 px-2.5 text-xs border-[#d4af37]/40 text-[#ffd76a]"
                      : "border-[#d4af37]/40 text-[#ffd76a]"
                  }
                  onClick={openBundleCard}
                  data-testid="button-header-steal-bundle"
                >
                  Casino
                </Button>
              )}
              <Button
                variant="outline"
                size={portrait ? "sm" : "sm"}
                className={portrait ? "h-8 px-2.5 text-xs" : undefined}
                asChild
                data-testid="button-clean-sneaks-back"
              >
                <Link href="/#clean-sneaks">Exit</Link>
              </Button>
            </div>
          </div>
        )}

        {showGameShell && !immersiveRun && (
          <div className={`shrink-0 ${portrait ? "px-1.5 pb-1" : "px-3 pb-2 sm:px-6"}`}>
            <GameAdBanner compact={portrait} />
            <GameAdsEarningsChip className="mt-1 text-right" />
          </div>
        )}

        <div
          className={`flex min-h-0 flex-1 flex-col ${
            preGame && playMode === "runner"
              ? ""
              : portrait
                ? "px-1.5 pb-1.5"
                : "px-3 pb-3 sm:px-6 sm:pb-6"
          }`}
        >
          <SceneErrorBoundary
            key={sceneAttempt}
            fallback={
              <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white px-6 text-center">
                <div className="max-w-md space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">
                    {KLEAN_SNEAKS.title}
                  </p>
                  <h1 className="text-xl font-bold text-[#1a3040]">Game couldn&apos;t load</h1>
                  <p className="text-sm leading-relaxed text-[#1a3040]/70">
                    Tap retry to reload the game engine.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      className="bg-[#5B8DA8] text-white"
                      onClick={() => setSceneAttempt((n) => n + 1)}
                    >
                      Try again
                    </Button>
                    <Button type="button" variant="ghost" className="text-[#1a3040]/80" asChild>
                      <Link href="/#clean-sneaks">Back to homepage</Link>
                    </Button>
                  </div>
                </div>
              </div>
            }
          >
            {playMode === "bundle-card" && bundleUnlocked ? (
              <StealTheBundleCardGame
                onBack={() => setPlayMode("runner")}
                onNewWalk={() => {
                  setPlayMode("runner");
                  setSceneAttempt((n) => n + 1);
                }}
              />
            ) : gamePhase === "loading" && !introComplete ? null : (
              <CleanSneaksGame3D
                key={sceneAttempt}
                active
                fullscreen
                style={shellStyle}
                skipIntroLoading
                onPhaseChange={handlePhaseChange}
                onRegisterBegin={registerBegin}
                onPlayBundleCard={openBundleCard}
                onExit={() => router.push("/#clean-sneaks")}
              />
            )}
          </SceneErrorBoundary>
        </div>
      </div>

      {introComplete && <OfflineEarningsHost />}
      <KleanShop open={shopOpen} onClose={() => setShopOpen(false)} />
    </div>
  );
}

export default function CleanSneaksPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[200] flex h-[100dvh] items-center justify-center bg-white">
          <GameLoadingWheels fullscreen />
        </div>
      }
    >
      <CleanSneaksPageContent />
    </Suspense>
  );
}
