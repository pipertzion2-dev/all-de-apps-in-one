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

/**
 * Game entry — interlocking CD-jewel puzzle on a dark stage.
 * Tap starts the runner (not the /play Moves hub).
 */
export function GameStartScreen({
  className,
  style,
  onStart,
  preload = false,
}: GameStartScreenProps) {
  const interactive = Boolean(onStart) && !preload;

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-[#0a080e] ${
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
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 40%, rgba(168,146,193,0.22), transparent 55%),
            radial-gradient(ellipse 45% 40% at 80% 80%, rgba(91,141,168,0.16), transparent 50%),
            linear-gradient(180deg, #120e18, #0a080e 55%, #050407)
          `,
        }}
      />

      <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center px-3 pb-28 pt-10 sm:px-6 sm:pb-32 sm:pt-14">
        <HomepageBundlePuzzle
          className={`pointer-events-none h-auto max-h-[min(58svh,480px)] w-full max-w-3xl ${
            interactive ? "cursor-pointer" : ""
          }`}
        />
      </div>

      {!preload && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-4"
          style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <p
            className="max-w-[min(92vw,28rem)] text-center text-sm font-semibold uppercase leading-snug tracking-[0.2em] text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-base"
            data-testid="text-game-runner-intro"
          >
            {KLEAN_RUNNER_INTRO_LINE}
          </p>
          <p
            className="text-5xl font-bold uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-6xl"
            data-testid="text-game-start"
          >
            Start
          </p>
          <p className="text-xs uppercase tracking-[0.35em] text-white/80 animate-pulse sm:text-sm">
            Tap puzzle to play
          </p>
        </div>
      )}
    </div>
  );
}
