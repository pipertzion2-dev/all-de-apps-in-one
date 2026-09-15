"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { LOADING_WHEEL_URLS } from "@/lib/clean-sneaks/assets";

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
      className={`relative flex flex-col items-center justify-center bg-white ${className ?? ""}`}
      style={style}
      role="status"
      aria-label="Loading game"
      aria-live="polite"
    >
      <div className="flex w-full max-w-3xl items-center justify-center gap-3 px-4 sm:gap-6 sm:px-8">
        {LOADING_WHEEL_URLS.map((src, index) => (
          <div
            key={src}
            className="relative aspect-square min-w-0 flex-1"
            data-testid={`loading-wheel-${index}`}
          >
            <Image
              src={src}
              alt=""
              aria-hidden
              fill
              priority
              className={`object-contain ${reducedMotion ? "" : WHEEL_SPINS[index]}`}
              sizes="(max-width: 640px) 28vw, 220px"
            />
          </div>
        ))}
      </div>
      <p className="sr-only">Loading</p>
    </div>
  );
}
