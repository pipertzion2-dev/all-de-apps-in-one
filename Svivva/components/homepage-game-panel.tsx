"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { SceneErrorBoundary } from "@/components/clean-sneaks/SceneErrorBoundary";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import type { GamePhase } from "@/lib/clean-sneaks/types";
import { HomepageScrollHint } from "@/components/homepage-scroll-hint";

const CleanSneaksGame3D = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksGame3D").then((m) => m.CleanSneaksGame3D),
  { ssr: false },
);
const GameStartScreen = dynamic(
  () => import("@/components/clean-sneaks/GameStartScreen").then((m) => m.GameStartScreen),
  { ssr: false },
);
const GameLoadingWheels = dynamic(
  () => import("@/components/clean-sneaks/GameLoadingWheels").then((m) => m.GameLoadingWheels),
  { ssr: false },
);
export function HomepageGamePanel() {
  const sectionRef = useRef<HTMLElement>(null);
  const beginRef = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("loading");
  const [sceneAttempt, setSceneAttempt] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setMounted(true);
        setActive(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.45));
      },
      { threshold: [0, 0.45, 0.75] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToCube = useCallback(() => {
    document.getElementById("nav-cube")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleStart = useCallback(() => {
    beginRef.current?.();
  }, []);

  const registerBegin = useCallback((begin: () => void) => {
    beginRef.current = begin;
  }, []);

  const preGame = gamePhase === "loading" || gamePhase === "start";

  return (
    <section
      ref={sectionRef}
      id="home-game"
      data-homepage-scroll-panel=""
      className="homepage-scroll-panel relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0c10]"
    >
      <HomepageScrollHint label="Scroll up · cube" direction="up" />

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-20 sm:px-6 sm:pt-24">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">ZZAI Play</p>
          <h2 className="seeds-holo-text text-lg font-bold sm:text-xl">{KLEAN_SNEAKS.display}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 border-white/20 text-xs" asChild>
            <Link href="/clean-sneaks">Full screen</Link>
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-white/70" onClick={scrollToCube}>
            Back to cube
          </Button>
        </div>
      </div>

      {(gamePhase === "loading" || gamePhase === "start") && (
        <GameStartScreen preload={gamePhase === "loading"} onStart={gamePhase === "start" ? handleStart : undefined} />
      )}

      {gamePhase === "loading" && <GameLoadingWheels fullscreen />}

      <div className={`relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-16 pt-1 sm:px-6 ${preGame ? "opacity-0 pointer-events-none" : ""}`}>
        <ClientErrorBoundary
          fallback={
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white/70">
              <p>{KLEAN_SNEAKS.title} couldn&apos;t load here.</p>
              <Button asChild className="bg-[#5B8DA8]">
                <Link href="/clean-sneaks">Open full-screen game</Link>
              </Button>
            </div>
          }
        >
          {mounted ? (
            <SceneErrorBoundary
              key={sceneAttempt}
              fallback={
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-white/70">
                  <p>Game engine failed — tap retry or open full screen.</p>
                  <div className="flex gap-2">
                    <Button type="button" className="bg-[#5B8DA8]" onClick={() => setSceneAttempt((n) => n + 1)}>
                      Retry
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/clean-sneaks">Full screen</Link>
                    </Button>
                  </div>
                </div>
              }
            >
              <CleanSneaksGame3D
                key={sceneAttempt}
                active={active}
                fullscreen
                onPhaseChange={setGamePhase}
                onRegisterBegin={registerBegin}
                onExit={scrollToCube}
                className="min-h-0 flex-1"
              />
            </SceneErrorBoundary>
          ) : (
            <div className="flex flex-1 items-center justify-center text-xs uppercase tracking-[0.3em] text-white/35">
              Scroll to load game
            </div>
          )}
        </ClientErrorBoundary>
      </div>

      <HomepageScrollHint label="Scroll · explore" direction="down" />
    </section>
  );
}
