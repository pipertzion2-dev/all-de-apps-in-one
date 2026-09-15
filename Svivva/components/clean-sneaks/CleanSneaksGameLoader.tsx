"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { GamePhase } from "@/lib/clean-sneaks/types";
import { GameLoadingWheels } from "./GameLoadingWheels";
import type { CleanSneaksGame3DProps } from "./CleanSneaksGame3D";

type LoaderProps = CleanSneaksGame3DProps;

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

/** Single owner of the loading wheels UI; defers the Three.js chunk until after it shows. */
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

    import("./CleanSneaksGame3D")
      .then((mod) => {
        if (!cancelled) setGame(() => mod.CleanSneaksGame3D);
      })
      .catch((err) => {
        console.error("[CleanSneaks] game chunk failed to load:", err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (failed) {
    return <GameLoadError onRetry={() => setAttempt((n) => n + 1)} />;
  }

  const showLoadingWheels = !Game || phase === "loading";

  return (
    <>
      {showLoadingWheels && <GameLoadingWheels fullscreen />}
      {Game ? (
        <Game {...gameProps} onPhaseChange={handlePhaseChange} hiddenDuringLoading={showLoadingWheels} />
      ) : null}
    </>
  );
}
