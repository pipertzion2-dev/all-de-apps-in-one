"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import { MovesLikeNav } from "@/components/the-moves-like/MovesLikeNav";
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
      <p className="max-w-md text-sm text-[#C8D8DE]">
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
      className="relative min-h-[100dvh] bg-[#071014] text-white"
      style={{ fontFamily: '"Zc", "Segoe UI", sans-serif' }}
    >
      {/* Compact header — stays out of the way in camera modes */}
      <header
        className={`z-30 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3 ${
          hideChromeOnDiscover || cameraMode
            ? "absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent pt-[max(0.5rem,env(safe-area-inset-top))]"
            : "relative border-b border-white/10 bg-black/60 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-md"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#9BB0B8] hover:text-white"
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
            <p className="truncate text-xs font-semibold tracking-wide text-white/90">
              {screen === "learn" ? "Practice" : "Record"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!cameraMode ? (
            <button
              type="button"
              onClick={() => setScreen("learn")}
              className="hidden min-h-[40px] rounded-full bg-[#C44A9A] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:inline-flex sm:items-center"
            >
              Front cam
            </button>
          ) : null}
          <Link
            href="/play"
            className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#9BB0B8] hover:text-[#90C4D8]"
          >
            Play desk
          </Link>
        </div>
      </header>

      {/* Top nav desktop only; mobile uses fixed bottom tabs inside MovesLikeNav */}
      <div
        className={`z-30 hidden sm:block ${
          hideChromeOnDiscover ? "absolute inset-x-0 top-14" : "sticky top-0"
        }`}
      >
        <MovesLikeNav screen={screen} onChange={setScreen} overlay={hideChromeOnDiscover} />
      </div>
      {/* Mobile bottom nav always mounted */}
      <div className="sm:hidden">
        <MovesLikeNav screen={screen} onChange={setScreen} />
      </div>

      <main
        className={`relative z-10 ${
          cameraMode || hideChromeOnDiscover
            ? ""
            : "pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-8"
        }`}
      >
        {!webgl && (screen === "discover" || screen === "studio" || screen === "play") ? (
          <WebGLFallback />
        ) : null}
        <ScreenBody screen={screen} />
      </main>
    </div>
  );
}
