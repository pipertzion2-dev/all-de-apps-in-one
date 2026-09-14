"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CleanSneaksGame3D } from "@/components/clean-sneaks/CleanSneaksGame3D";
import { SceneErrorBoundary } from "@/components/clean-sneaks/SceneErrorBoundary";

export default function CleanSneaksPage() {
  const router = useRouter();
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      data-svivva-app-shell=""
      data-clean-sneaks-fullscreen=""
      className="fixed inset-0 z-[200] flex h-[100dvh] min-h-[100dvh] w-full flex-col bg-[#0a0c10]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 20% 20%, rgba(91,141,168,0.25), transparent 55%),
            radial-gradient(ellipse 60% 45% at 85% 75%, rgba(217,79,156,0.18), transparent 50%),
            linear-gradient(180deg, #0a0c10, #06080c)
          `,
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">
              ZZAI Play Presents
            </p>
            <h1 className="seeds-holo-text text-xl font-bold sm:text-2xl">CLEAN SNEAKS</h1>
          </div>
          <Button variant="outline" size="sm" asChild data-testid="button-clean-sneaks-back">
            <Link href="/#clean-sneaks">Exit</Link>
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-6 sm:pb-6">
          {!ready ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading Clean Sneaks…
            </div>
          ) : (
            <SceneErrorBoundary
              key={sceneAttempt}
              fallback={
                <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-[#0a0c10]/90 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Clean Sneaks 3D couldn&apos;t start. Tap retry — the game stays fully 3D.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => setSceneAttempt((n) => n + 1)}>
                      Retry 3D
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href="/#clean-sneaks">Back to homepage</Link>
                    </Button>
                  </div>
                </div>
              }
            >
              <CleanSneaksGame3D
                key={sceneAttempt}
                active
                fullscreen
                onExit={() => router.push("/#clean-sneaks")}
              />
            </SceneErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
