"use client";

import type { CSSProperties } from "react";
import { MAIN_GAME_COVER_URL } from "@/lib/clean-sneaks/assets";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
  /** When true, cover sits behind loading wheels and ignores taps. */
  preload?: boolean;
  /** When true, fills the parent instead of the viewport (homepage intro flow). */
  contained?: boolean;
  /** Override the hint under the Start label. */
  actionHint?: string;
};

let coverReadyPromise: Promise<void> | null = null;

/** Warm the start cover JPEG once per session. */
export function preloadMainGameCover(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (coverReadyPromise) return coverReadyPromise;
  coverReadyPromise = new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = MAIN_GAME_COVER_URL;
  });
  return coverReadyPromise;
}

export function GameStartScreen({
  className,
  style,
  onStart,
  preload = false,
  contained = false,
  actionHint = "Tap to play",
}: GameStartScreenProps) {
  const interactive = Boolean(onStart) && !preload;
  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";

  return (
    <div
      className={`${positionClass} overflow-hidden bg-black ${
        preload ? "z-[1] pointer-events-none" : "z-[30] cursor-pointer"
      } ${className ?? ""}`}
      style={style}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? "Start game" : undefined}
      aria-hidden={preload ? true : undefined}
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? onStart : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space") {
                e.preventDefault();
                onStart?.();
              }
            }
          : undefined
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MAIN_GAME_COVER_URL}
        alt=""
        draggable={false}
        decoding="sync"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ minHeight: "100%", minWidth: "100%" }}
        data-testid="img-main-game-cover"
      />

      {!preload && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-4"
          style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <p
            className="text-5xl font-bold uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-6xl"
            data-testid="text-game-start"
          >
            Start
          </p>
          <p className="text-xs uppercase tracking-[0.35em] text-white/80 animate-pulse sm:text-sm">
            {actionHint}
          </p>
        </div>
      )}
    </div>
  );
}
