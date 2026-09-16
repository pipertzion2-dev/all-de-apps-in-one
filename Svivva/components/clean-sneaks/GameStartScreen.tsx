"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { MAIN_GAME_COVER_URL } from "@/lib/clean-sneaks/assets";

export type GameStartScreenProps = {
  className?: string;
  style?: CSSProperties;
  onStart?: () => void;
  /** Preload cover behind loading wheels (no interaction). */
  preload?: boolean;
};

export function GameStartScreen({
  className,
  style,
  onStart,
  preload = false,
}: GameStartScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const interactive = Boolean(onStart) && !preload;

  return createPortal(
    <div
      className={`fixed inset-0 overflow-hidden bg-black ${
        preload ? "z-[290] pointer-events-none" : "z-[300] cursor-pointer"
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
      {!coverFailed ? (
        // Native img — avoids Next/Image fill issues on mobile Safari after loading.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={MAIN_GAME_COVER_URL}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
          data-testid="img-main-game-cover"
          onError={() => setCoverFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-[#1a1420] to-black"
          aria-hidden
        />
      )}

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
