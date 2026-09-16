"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readBestScore } from "@/lib/clean-sneaks/storage";
import { Baloon8HomeSneaker } from "./Baloon8HomeSneaker";

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
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(91,141,168,0.14), transparent 55%),
            radial-gradient(ellipse 70% 45% at 85% 70%, rgba(217,79,156,0.10), transparent 50%),
            linear-gradient(180deg, transparent, rgba(10,12,16,0.85))
          `,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_0_60px_rgba(91,141,168,0.12)]">
            <div className="flex items-center bg-black/90 px-5 py-2.5 sm:px-7">
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/55">
                Karen The Muscle
              </p>
            </div>

            <Baloon8HomeSneaker />
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
              HOW CLEAN CAN YOU KEEP THE BALOON8?
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base lg:max-w-none">
              One chassis. Eight colorways. Mud, puddles, crowds, weather — every step lands dirt on
              exact balloon zones. Pick your finish, then protect the fit.
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
                Karen The Muscle · Full screen · Mobile &amp; desktop
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
