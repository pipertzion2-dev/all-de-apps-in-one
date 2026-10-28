"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { LOADING_WHEEL_URLS } from "@/lib/clean-sneaks/assets";
import { KLEAN_RUNNER_INTRO_LINE } from "@/lib/clean-sneaks/game-copy";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
  /** When true, wheels sit under the load overlay and ignore taps. */
  preload?: boolean;
};

/** Square hubcaps large enough that a vmax grid always covers the viewport. */
const WHEEL_COLS = 7;
const WHEEL_ROWS = 7;
const WHEEL_COUNT = WHEEL_COLS * WHEEL_ROWS;
/** Slightly over 100/7 vmax so the field bleeds past every edge. */
const CELL_VMAX = 16;

const WHEEL_SPINS = [
  "animate-[spin_4.2s_linear_infinite]",
  "animate-[spin_5.4s_linear_infinite_reverse]",
  "animate-[spin_3.8s_linear_infinite]",
  "animate-[spin_6s_linear_infinite_reverse]",
  "animate-[spin_4.8s_linear_infinite]",
] as const;

let wheelsReadyPromise: Promise<void> | null = null;

/** Warm the hubcap JPEGs once per session (start + load screens share them). */
export function preloadMainGameCover(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (wheelsReadyPromise) return wheelsReadyPromise;
  wheelsReadyPromise = Promise.all(
    LOADING_WHEEL_URLS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
  return wheelsReadyPromise;
}

/**
 * Game entry — full-bleed field of spinning iPbw hubcaps.
 * Tap starts the runner (not the /play Moves hub).
 */
export function GameStartScreen({
  className,
  style,
  onStart,
  preload = false,
}: GameStartScreenProps) {
  const interactive = Boolean(onStart) && !preload;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const wheels = useMemo(
    () =>
      Array.from({ length: WHEEL_COUNT }, (_, index) => ({
        src: LOADING_WHEEL_URLS[index % LOADING_WHEEL_URLS.length]!,
        spin: WHEEL_SPINS[index % WHEEL_SPINS.length]!,
      })),
    [],
  );

  const fieldPx = `${WHEEL_COLS * CELL_VMAX}vmax`;

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-black ${
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
      data-testid="game-start-wheels-screen"
    >
      {/* Centered square vmax grid — always larger than the viewport on every axis. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2"
        style={{
          width: fieldPx,
          height: fieldPx,
          gridTemplateColumns: `repeat(${WHEEL_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${WHEEL_ROWS}, minmax(0, 1fr))`,
        }}
        aria-hidden
      >
        {wheels.map((wheel, index) => (
          <div
            key={`${wheel.src}-${index}`}
            className="relative min-h-0 min-w-0 overflow-hidden rounded-full"
            style={{ transform: "scale(1.12)" }}
            data-testid={index < 3 ? `start-wheel-${index}` : undefined}
          >
            <div className={`h-full w-full ${reducedMotion ? "" : wheel.spin}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wheel.src}
                alt=""
                draggable={false}
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {!preload && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-4"
          style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div
            className="absolute inset-x-0 bottom-0 -z-10 h-[min(42vh,22rem)]"
            aria-hidden
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.88) 100%)",
            }}
          />
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
          <p className="animate-pulse text-xs uppercase tracking-[0.35em] text-white/80 sm:text-sm">
            Tap to play
          </p>
        </div>
      )}
    </div>
  );
}
