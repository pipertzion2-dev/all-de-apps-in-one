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
  /** When true, cover the viewport as the only loading layer (no extra padding wrappers). */
  fullscreen?: boolean;
};

export function GameLoadingWheels({ fullscreen = false }: GameLoadingWheelsProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[300] flex flex-col overflow-hidden bg-white"
          : "relative flex h-full w-full flex-col overflow-hidden bg-white"
      }
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      role="status"
      aria-label="Loading game"
      aria-live="polite"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="relative h-[min(34vh,200px)] w-full max-w-lg shrink-0">
          <Image
            src={KAREN_THE_MUSCLE_LOGO_URL}
            alt="Karen the Muscle"
            fill
            priority
            className="object-contain object-center"
            sizes="(max-width: 768px) 85vw, 480px"
            data-testid="img-karen-the-muscle-logo"
          />
        </div>

        <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3 sm:max-w-lg sm:gap-5">
          {LOADING_WHEEL_URLS.map((src, index) => (
            <div
              key={src}
              className="relative aspect-square w-full"
              data-testid={`loading-wheel-${index}`}
            >
              <Image
                src={src}
                alt=""
                aria-hidden
                fill
                priority
                className={`object-contain ${reducedMotion ? "" : WHEEL_SPINS[index]}`}
                sizes="(max-width: 640px) 28vw, 180px"
              />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only">Loading</p>
    </div>
  );
}
