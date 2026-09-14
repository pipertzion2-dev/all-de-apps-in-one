"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { readBestScore } from "@/lib/clean-sneaks/storage";

const CleanSneaksGame = dynamic(
  () => import("@/components/clean-sneaks/CleanSneaksGame").then((m) => m.CleanSneaksGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-white/10 bg-[#0a0c10] text-sm text-muted-foreground">
        Loading Clean Sneaks…
      </div>
    ),
  },
);

export function CleanSneaksSection() {
  const [playing, setPlaying] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(readBestScore());
  }, [playing]);

  const start = useCallback(() => {
    setPlaying(true);
  }, []);

  const exit = useCallback(() => {
    setPlaying(false);
    setBest(readBestScore());
  }, []);

  return (
    <section
      id="clean-sneaks"
      className="relative overflow-hidden border-t border-white/10 py-20 sm:py-28"
      aria-labelledby="clean-sneaks-heading"
    >
      {/* Atmosphere — ZZAI cyan/magenta signal field */}
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

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {!playing ? (
          <div className="relative">
            {/* Full-bleed teaser visual plane */}
            <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[480px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(8,10,14,0.88), rgba(8,10,14,0.55)), url(/assets/clean-sneaks/blueprint-source.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div
                className="absolute inset-0 opacity-30 mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(91,141,168,0.25) 50%, transparent 60%)",
                }}
              />

              <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[480px]">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-[#5B8DA8]">
                  ZZAI Play Presents
                </p>
                <h2
                  id="clean-sneaks-heading"
                  className="seeds-holo-text text-5xl font-bold tracking-[0.08em] sm:text-6xl md:text-7xl"
                >
                  CLEAN SNEAKS
                </h2>
                <p className="mt-4 text-lg font-semibold tracking-[0.2em] text-[#D94F9C] sm:text-xl">
                  KEEP &apos;EM FRESH.
                </p>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                  Your kicks are clean. The city isn&apos;t.
                  <br />
                  Run the streets, dodge the mess, and protect your sneakers for as long as you can.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3">
                  <Button
                    size="lg"
                    className="min-w-[220px] bg-[#5B8DA8] text-base text-white shadow-[0_0_28px_rgba(91,141,168,0.35)]"
                    onClick={start}
                    data-testid="button-play-clean-sneaks"
                  >
                    Play Clean Sneaks
                  </Button>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                    100% Clean. For now.
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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#5B8DA8]">
                  ZZAI Play Presents
                </p>
                <h2
                  id="clean-sneaks-heading"
                  className="seeds-holo-text text-3xl font-bold sm:text-4xl"
                >
                  CLEAN SNEAKS
                </h2>
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
            <CleanSneaksGame active={playing} onExit={exit} />
          </div>
        )}
      </div>
    </section>
  );
}
