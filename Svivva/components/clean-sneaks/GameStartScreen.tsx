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
      className={`fixed inset-0 z-[300] cursor-pointer overflow-hidden bg-black ${className ?? ""}`}
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
      <Image
        src={MAIN_GAME_COVER_URL}
        alt="iPbw — Karen the Muscle"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
        data-testid="img-main-game-cover"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.75rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-2 px-4">
        <p
          className="seeds-holo-text text-5xl font-bold uppercase tracking-[0.35em] sm:text-6xl"
          data-testid="text-game-start"
        >
          Start
        </p>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60 animate-pulse sm:text-sm">
          Tap to play
        </p>
      </div>
    </div>
  );
}
