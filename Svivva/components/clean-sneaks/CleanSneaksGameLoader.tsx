"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { GamePhase } from "@/lib/clean-sneaks/types";
import { GameLoadingWheels } from "./GameLoadingWheels";
import type { CleanSneaksGame3DProps } from "./CleanSneaksGame3D";

type LoaderProps = CleanSneaksGame3DProps;

async function importGameChunk(retries = 3): Promise<ComponentType<CleanSneaksGame3DProps>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const mod = await import("./CleanSneaksGame3D");
      return mod.CleanSneaksGame3D;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function GameLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">Clean Sneaks</p>
        <h1 className="text-xl font-bold text-[#1a3040]">Game couldn&apos;t load</h1>
        <p className="text-sm leading-relaxed text-[#1a3040]/70">
          Try again, or head back to the ZZAI homepage. If you&apos;re on mobile, closing other tabs
          can help free memory for the game.
        </p>
        <div className="flex flex-col gap-2">
          <Button type="button" className="bg-[#5B8DA8] text-white" onClick={onRetry}>
            Try again
          </Button>
          <Button type="button" variant="outline" className="border-[#1a3040]/20 text-[#1a3040]" asChild>
            <Link href="/clean-sneaks">Reload game</Link>
          </Button>
          <Button type="button" variant="ghost" className="text-[#1a3040]/80" asChild>
            <Link href="/#clean-sneaks">Back to homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Owns the loading wheels UI and defers the Three.js chunk until after first paint. */
export function CleanSneaksGameLoader(props: LoaderProps) {
  const { onPhaseChange, ...gameProps } = props;
  const [Game, setGame] = useState<ComponentType<CleanSneaksGame3DProps> | null>(null);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const handlePhaseChange = useCallback(
    (next: GamePhase) => {
      setPhase(next);
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setGame(null);
    setPhase("loading");

    // Paint the loading screen first, then fetch the heavy game chunk.
    const startTimer = window.setTimeout(() => {
      importGameChunk()
        .then((Component) => {
          if (!cancelled) setGame(() => Component);
        })
        .catch((err) => {
          console.error("[CleanSneaks] game chunk failed to load:", err);
          if (!cancelled) setFailed(true);
        });
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [attempt]);

  if (failed) {
    return <GameLoadError onRetry={() => setAttempt((n) => n + 1)} />;
  }

  const showLoadingWheels = !Game || phase === "loading";

  if (showLoadingWheels) {
    return (
      <>
        <GameLoadingWheels fullscreen />
        {Game ? <Game {...gameProps} onPhaseChange={handlePhaseChange} /> : null}
      </>
    );
  }

  return <Game {...gameProps} onPhaseChange={handlePhaseChange} />;
}
