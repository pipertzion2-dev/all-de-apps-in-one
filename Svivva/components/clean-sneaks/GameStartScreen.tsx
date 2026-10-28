"use client";

import type { CSSProperties } from "react";
import { HomepageBundlePuzzle } from "@/components/homepage-bundle-puzzle";
import { BUNDLE_CUBE_FACE_URLS, MAIN_GAME_COVER_URL } from "@/lib/clean-sneaks/assets";
import { KLEAN_RUNNER_INTRO_LINE } from "@/lib/clean-sneaks/game-copy";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
  /** When true, cover sits behind loading wheels and ignores taps. */
  preload?: boolean;
};

/** Seed grid — fillScreen densifies from viewport size on mount. */
const START_PUZZLE_COLS = 8;
const START_PUZZLE_ROWS = 6;

let coverReadyPromise: Promise<void> | null = null;

/** Warm the start cover + puzzle face JPEGs once per session. */
export function preloadMainGameCover(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (coverReadyPromise) return coverReadyPromise;
  coverReadyPromise = Promise.all(
    [MAIN_GAME_COVER_URL, ...BUNDLE_CUBE_FACE_URLS].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
  return coverReadyPromise;
}

export function GameStartScreen({
  className,
  style,
  onStart,
  preload = false,
}: GameStartScreenProps) {
  const interactive = Boolean(onStart) && !preload;

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-white ${
        preload ? "z-[1] pointer-events-none" : "z-[30]"
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
      data-testid="game-start-puzzle-screen"
    >
      <div className="absolute inset-0 z-0">
        <HomepageBundlePuzzle
          fillScreen
          cols={START_PUZZLE_COLS}
          rows={START_PUZZLE_ROWS}
          className={`pointer-events-none h-full w-full max-w-none ${
            interactive ? "cursor-pointer" : ""
          }`}
        />
        {/* Lift dark collage voids so the start page never reads as a black field. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/20 to-white/40 mix-blend-soft-light"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/15" />
      </div>

      {!preload && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-4"
          style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <p
            className="max-w-[min(92vw,28rem)] rounded-full bg-white/85 px-4 py-1.5 text-center text-sm font-semibold uppercase leading-snug tracking-[0.2em] text-black shadow-sm sm:text-base"
            data-testid="text-game-runner-intro"
          >
            {KLEAN_RUNNER_INTRO_LINE}
          </p>
          <p
            className="rounded-md bg-white/90 px-5 py-1 text-5xl font-bold uppercase tracking-[0.35em] text-black shadow-md sm:text-6xl"
            data-testid="text-game-start"
          >
            Start
          </p>
          <p className="rounded-full bg-white/85 px-4 py-1 text-xs uppercase tracking-[0.35em] text-black/70 animate-pulse sm:text-sm">
            Tap puzzle to play
          </p>
        </div>
      )}
    </div>
  );
}
