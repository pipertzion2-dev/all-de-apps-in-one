"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { KAREN_THE_MUSCLE_LOGO_URL, LOADING_WHEEL_URLS } from "@/lib/clean-sneaks/assets";

const WHEEL_SPINS = [
  "animate-[spin_1.8s_linear_infinite]",
  "animate-[spin_2.4s_linear_infinite_reverse]",
  "animate-[spin_2s_linear_infinite]",
] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type GameLoadingWheelsProps = {
  className?: string;
  style?: CSSProperties;
};

export function GameLoadingWheels({ className, style }: GameLoadingWheelsProps) {
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
      className={`relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-white ${className ?? ""}`}
      style={style}
      role="status"
      aria-label="Loading game"
      aria-live="polite"
    >
      <div className="relative min-h-0 w-full flex-[5] px-[6vw] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Image
          src={KAREN_THE_MUSCLE_LOGO_URL}
          alt="Karen the Muscle"
          fill
          priority
          className="object-contain object-center"
          sizes="100vw"
          data-testid="img-karen-the-muscle-logo"
        />
      </div>

      <div className="relative flex min-h-0 w-full flex-[6] items-center justify-center px-[4vw] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex w-full max-w-5xl items-center justify-center gap-[min(3vw,1rem)]">
          {LOADING_WHEEL_URLS.map((src, index) => (
            <div
              key={src}
              className="relative aspect-square h-[min(38vh,42vw)] w-auto flex-1"
              data-testid={`loading-wheel-${index}`}
            >
              <Image
                src={src}
                alt=""
                aria-hidden
                fill
                priority
                className={`object-contain ${reducedMotion ? "" : WHEEL_SPINS[index]}`}
                sizes="(max-width: 640px) 30vw, 240px"
              />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only">Loading</p>
    </div>
  );
}
