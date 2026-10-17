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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-[#071014] px-6 text-center">
      <BrandMark size="inline" />
      <p className="tml-glass max-w-md p-4 text-sm text-[#C8D8DE]">
        WebGL is unavailable. Front-camera Learn and Create still work — 3D stages are skipped.
      </p>
    </div>
  );
}

const CAMERA_SCREENS: MovesLikeScreen[] = ["learn", "create"];

export function MovesLikeApp() {
  const screen = useMovesLikeStore((s) => s.screen);
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const [webgl, setWebgl] = useState(true);

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
      className="relative min-h-[100dvh] bg-[#071014] text-foreground"
      style={{ fontFamily: '"Zc", sans-serif' }}
    >
      {/* Soft site-like atmosphere wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 15% 0%, hsl(197 45% 50% / 0.22), transparent 55%), radial-gradient(ellipse 55% 40% at 90% 8%, hsl(315 60% 45% / 0.16), transparent 50%)",
        }}
      />

      <header
        className={cn(
          "z-30 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3",
          hideChromeOnDiscover || cameraMode
            ? "absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent pt-[max(0.5rem,env(safe-area-inset-top))]"
            : "relative border-b border-border/30 bg-card/25 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-xl",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-border/40 bg-card/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md hover:border-primary/40 hover:text-foreground"
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
            <span className="tml-glass-teal px-3 py-1 text-xs font-semibold tracking-wide text-[#d8eef6]">
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
              onClick={() => setScreen("learn")}
            >
              Front cam
            </GlassMagentaButton>
          ) : null}
          <Link
            href="/play"
            className="shrink-0 rounded-full border border-border/40 bg-card/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md hover:border-primary/40 hover:text-[#90C4D8]"
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
