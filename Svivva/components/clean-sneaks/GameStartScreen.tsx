"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { MAIN_GAME_COVER_URL } from "@/lib/clean-sneaks/assets";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
};

export function GameStartScreen({ className, style, onStart }: GameStartScreenProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-black ${className ?? ""}`}
      style={style}
      role="button"
      aria-label="Start game"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(e) => {
        if (!onStart) return;
        if (e.key === "Enter" || e.key === " " || e.code === "Space") {
          e.preventDefault();
          onStart();
        }
      }}
    >
      <div className="relative h-full w-full max-w-2xl px-4 py-6 sm:max-w-3xl sm:px-8 sm:py-10">
        <Image
          src={MAIN_GAME_COVER_URL}
          alt="iPbw — Karen the Muscle"
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 92vw, 720px"
          data-testid="img-main-game-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2 px-4">
        <p
          className="seeds-holo-text text-4xl font-bold uppercase tracking-[0.35em] sm:text-5xl"
          data-testid="text-game-start"
        >
          Start
        </p>
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/50 animate-pulse">
          Tap to play
        </p>
      </div>
    </div>
  );
}
