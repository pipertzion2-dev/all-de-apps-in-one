"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { KAREN_THE_MUSCLE_LOGO_URL } from "@/lib/clean-sneaks/assets";

export type GameLogoSplashProps = {
  className?: string;
  style?: CSSProperties;
  /** When true, show a subtle tap-to-continue hint after a short delay. */
  showHint?: boolean;
  onContinue?: () => void;
};

export function GameLogoSplash({
  className,
  style,
  showHint = false,
  onContinue,
}: GameLogoSplashProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-white ${className ?? ""}`}
      style={style}
      role="img"
      aria-label="Karen the Muscle — main logo"
      onClick={onContinue}
      onKeyDown={(e) => {
        if (onContinue && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onContinue();
        }
      }}
      tabIndex={onContinue ? 0 : undefined}
    >
      <div className="relative h-full w-full max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
        <Image
          src={KAREN_THE_MUSCLE_LOGO_URL}
          alt="Karen the Muscle"
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 640px"
          data-testid="img-karen-the-muscle-logo"
        />
      </div>
      {showHint && onContinue && (
        <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-[11px] uppercase tracking-[0.35em] text-black/45 animate-pulse">
          Tap to play
        </p>
      )}
    </div>
  );
}
