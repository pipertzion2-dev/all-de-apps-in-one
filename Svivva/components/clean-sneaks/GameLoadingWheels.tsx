"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { KAREN_THE_MUSCLE_LOGO_URL, LOADING_WHEEL_URLS } from "@/lib/clean-sneaks/assets";

const WHEEL_SPINS = [
  "animate-[spin_1.8s_linear_infinite]",
  "animate-[spin_2.4s_linear_infinite_reverse]",
  "animate-[spin_2s_linear_infinite]",
] as const;

export type GameLoadingWheelsProps = {
  fullscreen?: boolean;
  /** Escape hatch when the main thread is busy — advances past the splash. */
  onSkip?: () => void;
};

export function GameLoadingWheels({ fullscreen = false, onSkip }: GameLoadingWheelsProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!onSkip) return;
    const id = window.setTimeout(() => setShowSkip(true), 3500);
    return () => window.clearTimeout(id);
  }, [onSkip]);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[40] flex flex-col items-center justify-center overflow-hidden bg-white"
          : "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white"
      }
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      role="status"
      aria-label="Loading game"
      aria-live="polite"
    >
      <div className="relative mb-6 h-[min(22vh,140px)] w-[min(72vw,300px)] shrink-0">
        <Image
          src={KAREN_THE_MUSCLE_LOGO_URL}
          alt="Karen the Muscle"
          fill
          priority
          className="object-contain object-center"
          sizes="(max-width: 768px) 72vw, 300px"
          data-testid="img-karen-the-muscle-logo"
        />
      </div>

      {/* Hubcaps spin inside circular clips so square JPEG bounds never overlap. */}
      <div className="flex items-center justify-center gap-[min(3.5vw,14px)] px-4">
        {LOADING_WHEEL_URLS.map((src, index) => (
          <div
            key={src}
            className="size-[min(22vw,88px)] shrink-0 overflow-hidden rounded-full sm:size-[min(20vw,104px)]"
            data-testid={`loading-wheel-${index}`}
          >
            <div className={`h-full w-full ${reducedMotion ? "" : WHEEL_SPINS[index]}`} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {showSkip && onSkip && (
        <button
          type="button"
          className="mt-8 text-[11px] uppercase tracking-[0.35em] text-black/45 underline-offset-4 hover:text-black/70 hover:underline"
          onClick={onSkip}
          data-testid="button-skip-loading"
        >
          Tap to continue
        </button>
      )}

      <p className="sr-only">Loading</p>
    </div>
  );
}
