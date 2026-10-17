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
        WebGL is unavailable in this browser. Navigation, Learn tutorials, Create recording, and
        Studio timeline still work — 3D stages are skipped.
      </p>
    </div>
  );
}

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
    // Touch reduced-motion path so quality helpers stay warm
    void prefersReducedMotion();
  }, []);

  const hideChromeOnDiscover = screen === "discover";

  return (
    <div
      data-the-moves-like
      data-page-shell
      className="relative min-h-[100dvh] bg-[#071014] text-white"
      style={{ fontFamily: '"Zc", "Segoe UI", sans-serif' }}
    >
      <header
        className={`relative z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${
          hideChromeOnDiscover
            ? "absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent"
            : "border-b border-white/10 bg-black/60 backdrop-blur-md"
        }`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#9BB0B8] hover:text-white"
          >
            ZZAI
          </Link>
          <button
            type="button"
            onClick={() => setScreen("discover")}
            className="min-w-0"
            aria-label={MOVES_LIKE.name}
          >
            <BrandMark size="header" priority={screen === "discover"} />
          </button>
        </div>
        <Link
          href="/play"
          className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#9BB0B8] hover:text-[#90C4D8]"
        >
          ZZAI Play
        </Link>
      </header>

      <div
        className={`relative z-30 ${
          hideChromeOnDiscover ? "absolute inset-x-0 top-14" : "sticky top-0"
        }`}
      >
        <MovesLikeNav screen={screen} onChange={setScreen} overlay={hideChromeOnDiscover} />
      </div>

      <main className="relative z-10">
        {!webgl && (screen === "discover" || screen === "studio" || screen === "play") ? (
          <WebGLFallback />
        ) : null}
        <ScreenBody screen={screen} />
      </main>
    </div>
  );
}
