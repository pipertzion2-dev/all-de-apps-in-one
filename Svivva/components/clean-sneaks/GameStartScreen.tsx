"use client";

import { useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { MAIN_GAME_COVER_URL } from "@/lib/clean-sneaks/assets";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
  /** When true, cover sits behind loading wheels and ignores taps. */
  preload?: boolean;
  onCoverReady?: () => void;
};

let coverReadyPromise: Promise<void> | null = null;

/** Warm the start cover JPEG once per session (shared by loading + start screen). */
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
  onCoverReady,
}: GameStartScreenProps) {
  const coverReadyRef = useRef(false);

  const notifyCoverReady = useCallback(() => {
    if (coverReadyRef.current) return;
    coverReadyRef.current = true;
    onCoverReady?.();
  }, [onCoverReady]);

  if (typeof document === "undefined") return null;

  const interactive = Boolean(onStart) && !preload;

  return createPortal(
    <div
      className={`fixed inset-0 overflow-hidden bg-black ${
        preload ? "z-[290] pointer-events-none" : "z-[400] cursor-pointer"
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
        data-testid="img-main-game-cover"
        onLoad={notifyCoverReady}
        onError={notifyCoverReady}
      />

      {!preload && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-4"
          style={{ bottom: "max(1.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
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
      )}
    </div>,
    document.body,
  );
}
