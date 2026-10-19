"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import { MovesLikeNav } from "@/components/the-moves-like/MovesLikeNav";
import { GlassMagentaButton } from "@/components/the-moves-like/ui/Glass";
import { DiscoverScreen } from "@/components/the-moves-like/screens/DiscoverScreen";
import { LearnScreen } from "@/components/the-moves-like/screens/LearnScreen";
import { CreateScreen } from "@/components/the-moves-like/screens/CreateScreen";
import { StudioScreen } from "@/components/the-moves-like/screens/StudioScreen";
import { PlayScreen } from "@/components/the-moves-like/screens/PlayScreen";
import { CommunityScreen } from "@/components/the-moves-like/screens/CommunityScreen";
import { ProfileScreen } from "@/components/the-moves-like/screens/ProfileScreen";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import type { MovesLikeScreen } from "@/lib/the-moves-like/types";
import { GyroProvider, useMovesLikeGyro } from "@/components/the-moves-like/GyroProvider";
import { prefersReducedMotion } from "@/lib/the-moves-like/performance";
import { cn } from "@/lib/utils";

function ScreenBody({ screen }: { screen: MovesLikeScreen }) {
  switch (screen) {
    case "discover":
      return <DiscoverScreen />;
    case "learn":
      return <LearnScreen />;
    case "create":
      return <CreateScreen />;
    case "studio":
      return <StudioScreen />;
    case "play":
      return <PlayScreen />;
    case "community":
      return <CommunityScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <DiscoverScreen />;
  }
}

function WebGLFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-[#F7FBFC] px-6 text-center">
      <BrandMark size="inline" />
      <p className="tml-glass max-w-md p-4 text-sm text-muted-foreground">
        WebGL is unavailable. Front-camera Learn and Create still work — 3D stages are skipped.
      </p>
    </div>
  );
}

const CAMERA_SCREENS: MovesLikeScreen[] = ["learn", "create"];

function MovesLikeShell() {
  const screen = useMovesLikeStore((s) => s.screen);
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const [webgl, setWebgl] = useState(true);
  const gyro = useMovesLikeGyro();

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      setWebgl(ok);
    } catch {
      setWebgl(false);
    }
    void prefersReducedMotion();
  }, []);

  const cameraMode = CAMERA_SCREENS.includes(screen);
  const hideChromeOnDiscover = screen === "discover";

  return (
    <div
      data-the-moves-like
      data-page-shell
      data-gyro-status={gyro.status}
      className="relative min-h-[100dvh] bg-[#F7FBFC] text-foreground"
      style={{ fontFamily: '"Zc", sans-serif' }}
    >
      {/* Brighter liquid wash — more chroma under glass so panels feel wet */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 48% at 8% 0%, rgba(109,145,179,0.38), transparent 58%), radial-gradient(ellipse 55% 42% at 94% 4%, rgba(172,129,175,0.34), transparent 55%), radial-gradient(ellipse 40% 30% at 50% 100%, rgba(168,192,212,0.22), transparent 60%), linear-gradient(180deg, #ffffff 0%, #F7FBFC 35%, #e8f0f6 100%)",
        }}
      />

      <header
        className={cn(
          "z-30 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3",
          hideChromeOnDiscover || cameraMode
            ? "absolute inset-x-0 top-0 bg-gradient-to-b from-white/85 to-transparent pt-[max(0.5rem,env(safe-area-inset-top))]"
            : "relative border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.28)_100%)] pt-[max(0.25rem,env(safe-area-inset-top))] shadow-[inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-[18px] backdrop-saturate-[1.85]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.25)_100%)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md hover:border-[rgba(109,145,179,0.55)] hover:text-foreground"
          >
            ZZAI
          </Link>
          {!cameraMode ? (
            <button
              type="button"
              onClick={() => setScreen("discover")}
              className="min-w-0"
              aria-label={MOVES_LIKE.name}
            >
              <BrandMark size="header" priority={screen === "discover"} />
            </button>
          ) : (
            <span className="tml-glass-teal px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              {screen === "learn" ? "Practice" : "Record"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!cameraMode ? (
            <GlassMagentaButton
              type="button"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                void gyro.ensurePermission();
                setScreen("learn");
              }}
            >
              Front cam
            </GlassMagentaButton>
          ) : null}
          <Link
            href="/play"
            className="shrink-0 rounded-full border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(172,129,175,0.18)_100%)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md hover:border-[rgba(172,129,175,0.55)] hover:text-primary"
          >
            Play desk
          </Link>
        </div>
      </header>

      <div
        className={cn(
          "z-30 hidden sm:block",
          hideChromeOnDiscover ? "absolute inset-x-0 top-14" : "sticky top-0",
        )}
      >
        <MovesLikeNav screen={screen} onChange={setScreen} overlay={hideChromeOnDiscover} />
      </div>
      <div className="sm:hidden">
        <MovesLikeNav screen={screen} onChange={setScreen} />
      </div>

      <main
        className={cn(
          "relative z-10",
          cameraMode || hideChromeOnDiscover
            ? ""
            : "pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-8",
        )}
      >
        {!webgl && (screen === "discover" || screen === "studio" || screen === "play") ? (
          <WebGLFallback />
        ) : null}
        <ScreenBody screen={screen} />
      </main>
    </div>
  );
}

export function MovesLikeApp() {
  return (
    <GyroProvider>
      <MovesLikeShell />
    </GyroProvider>
  );
}
