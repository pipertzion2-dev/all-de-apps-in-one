"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readBestScore } from "@/lib/clean-sneaks/storage";

const CleanSneaksLogoCube = dynamic(
  () => import("./CleanSneaksLogoCube").then((m) => m.CleanSneaksLogoCube),
  { ssr: false },
);

export function CleanSneaksSection() {
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(readBestScore());
  }, []);

  return (
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
            radial-gradient(ellipse 70% 55% at 28% 40%, rgba(74,47,92,0.42), transparent 58%),
            radial-gradient(ellipse 55% 45% at 78% 65%, rgba(168,186,72,0.10), transparent 52%),
            linear-gradient(180deg, transparent, rgba(10,12,16,0.9))
          `,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <Link
            href="/clean-sneaks"
            className="group relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[#A8BA48]/60 sm:min-h-[340px]"
            style={{
              background: `
                radial-gradient(ellipse 60% 55% at 50% 48%, rgba(58,32,72,0.55), rgba(8,6,12,0.92) 70%),
                linear-gradient(160deg, #1a1022 0%, #0a080e 100%)
              `,
              boxShadow: "0 0 60px rgba(74,47,92,0.22)",
            }}
            data-testid="clean-sneaks-home-hero"
            aria-label="Enter Clean Sneaks — goal: steal the old man's bundle"
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-soft-light"
              aria-hidden
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
              }}
            />
            <CleanSneaksLogoCube className="relative z-[1] h-[240px] w-full sm:h-[300px]" />
            <span className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-[0.35em] text-white/45 transition-colors group-hover:text-white/70 sm:bottom-5">
              Tap cube to enter
            </span>
          </Link>

          <div className="flex flex-col justify-center text-center lg:text-left">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-[#A8BA48]/90">
              ZZAI Play Presents
            </p>
            <h2
              id="clean-sneaks-heading"
              className="seeds-holo-text text-4xl font-bold tracking-[0.08em] sm:text-5xl md:text-6xl"
            >
              CLEAN SNEAKS
            </h2>
            <p
              className="mt-4 text-xl font-semibold leading-snug tracking-[0.04em] text-[#E8D9A8] sm:text-2xl"
              data-testid="text-clean-sneaks-goal"
            >
              Goal: Steal the old man&apos;s bundle
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/45">
              stiehl den alten Manns Bündel
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base lg:max-w-none">
              Keep the Baloon8 clean while you chase the bundle — mud, puddles, crowds, and weather
              land dirt on exact balloon zones. Pick your finish, protect the fit, steal the bag.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <Button
                size="lg"
                className="min-w-[220px] bg-[#5B8DA8] text-base text-white shadow-[0_0_28px_rgba(91,141,168,0.35)]"
                asChild
                data-testid="button-play-clean-sneaks"
              >
                <Link href="/clean-sneaks">Play Clean Sneaks</Link>
              </Button>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                Steal the bundle · Full screen · Mobile &amp; desktop
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
  );
}
