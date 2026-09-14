"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { readBestScore } from "@/lib/clean-sneaks/storage";
import { CleanSneaksCubeBackdrop } from "./CleanSneaksCubeBackdrop";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

const CleanSneaksGame = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksGame").then((m) => m.CleanSneaksGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-[#0a0c10] text-sm text-muted-foreground">
        Loading Clean Sneaks…
      </div>
    ),
  },
);

const Baloon8ShoeScene = dynamic(
  () => import("@/components/clean-sneaks/Baloon8ShoeScene").then((m) => m.Baloon8ShoeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center bg-[#06080c] text-sm text-muted-foreground">
        Building Baloon8 3D…
      </div>
    ),
  },
);

export function CleanSneaksSection() {
  const [playing, setPlaying] = useState(false);
  const [best, setBest] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBest(readBestScore());
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [playing]);

  const start = useCallback(() => {
    setPlaying(true);
  }, []);

  const exit = useCallback(() => {
    setPlaying(false);
    setBest(readBestScore());
  }, []);

  const fullscreenPlay =
    playing && mounted ? (
      <div
        data-svivva-app-shell=""
        data-clean-sneaks-fullscreen=""
        className="fixed inset-0 z-[200] flex flex-col bg-[#0a0c10]"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
        data-testid="clean-sneaks-fullscreen"
      >
        <SceneErrorBoundary fallback={null}>
          <CleanSneaksCubeBackdrop className="absolute inset-0 opacity-70" />
        </SceneErrorBoundary>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">
                ZZAI Play Presents
              </p>
              <h2 className="seeds-holo-text text-xl font-bold sm:text-2xl">CLEAN SNEAKS</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exit}
              data-testid="button-clean-sneaks-back"
            >
              Exit game
            </Button>
          </div>

          <div
            className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-6 sm:pb-6"
            style={{ minHeight: "min(70vh, 720px)" }}
          >
            <SceneErrorBoundary
              fallback={
                <div className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-[#0a0c10] p-6 text-center text-sm text-muted-foreground">
                  Game failed to load. Close and try again.
                </div>
              }
            >
              <CleanSneaksGame active={playing} onExit={exit} fullscreen />
            </SceneErrorBoundary>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      {fullscreenPlay}

      <section
        id="clean-sneaks"
        className="relative overflow-hidden border-t border-white/10 py-20 sm:py-28"
        aria-labelledby="clean-sneaks-heading"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(91,141,168,0.14), transparent 55%),
            radial-gradient(ellipse 70% 45% at 85% 70%, rgba(217,79,156,0.10), transparent 50%),
            linear-gradient(180deg, transparent, rgba(10,12,16,0.85))
          `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px zzai-glitch-bars opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(91,141,168,0.35) 12px, rgba(91,141,168,0.35) 14px, transparent 14px, transparent 28px, rgba(217,79,156,0.25) 28px, rgba(217,79,156,0.25) 30px)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#06080c] shadow-[0_0_60px_rgba(91,141,168,0.12)]">
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]/90">
                  Baloon8 · 3D Rebuild
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Drag to orbit
                </p>
              </div>
              <div className="h-[360px] sm:h-[440px] lg:h-[520px]">
                <SceneErrorBoundary>
                  <Baloon8ShoeScene className="h-full" />
                </SceneErrorBoundary>
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06080c] to-transparent"
                aria-hidden
              />
            </div>

            <div className="flex flex-col justify-center text-center lg:text-left">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-[#5B8DA8]">
                ZZAI Play Presents
              </p>
              <h2
                id="clean-sneaks-heading"
                className="seeds-holo-text text-4xl font-bold tracking-[0.08em] sm:text-5xl md:text-6xl"
              >
                CLEAN SNEAKS
              </h2>
              <p className="mt-3 text-lg font-semibold tracking-[0.2em] text-[#D94F9C] sm:text-xl">
                KEEP &apos;EM FRESH.
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base lg:max-w-none">
                The Baloon8 car-shoe — iridescent bubble coat, glowing grille, transparent wheels,
                and a footwell lined with the crest mandala. Built in advanced Three.js from your
                four-side mockup. Now run the streets and keep them clean.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
                <Button
                  size="lg"
                  className="min-w-[220px] bg-[#5B8DA8] text-base text-white shadow-[0_0_28px_rgba(91,141,168,0.35)]"
                  onClick={start}
                  data-testid="button-play-clean-sneaks"
                >
                  Play Clean Sneaks
                </Button>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                  Full screen · Mobile &amp; desktop
                </p>
                {best > 0 && (
                  <p className="text-xs text-[#7EC8D9]/90" data-testid="text-clean-sneaks-best">
                    Best score: {best.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
