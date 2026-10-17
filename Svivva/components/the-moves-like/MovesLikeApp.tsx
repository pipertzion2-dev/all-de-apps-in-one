"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
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
      <Image
        src={MOVES_LIKE.logoPath}
        alt="THE MOVES LIKE"
        width={280}
        height={140}
        className="opacity-90"
      />
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
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      setWebgl(ok);
    } catch {
      setWebgl(false);
    }
    setReduced(prefersReducedMotion());
  }, []);

  return (
    <div
      data-the-moves-like
      data-page-shell
      className="relative min-h-[100dvh] bg-[#071014] text-white"
      style={{
        fontFamily: '"Zc", "Segoe UI", sans-serif',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(91,141,168,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(196,74,154,0.22), transparent 50%), linear-gradient(180deg, #0a1518 0%, #071014 40%, #0c1214 100%)",
        }}
      />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[#9BB0B8] hover:text-white"
          >
            ZZAI
          </Link>
          <Image
            src={MOVES_LIKE.logoPath}
            alt=""
            width={120}
            height={60}
            className="h-8 w-auto object-contain sm:h-9"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-white sm:text-base">
              {MOVES_LIKE.name}
            </p>
            <p className="hidden truncate text-[10px] text-[#9BB0B8] sm:block">
              {MOVES_LIKE.tagline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reduced ? (
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-[#9BB0B8] sm:inline">
              Reduced motion
            </span>
          ) : null}
          <Link
            href="/play"
            className="rounded-md border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#C8D8DE] hover:border-[#5B8DA8]/50"
          >
            ZZAI Play
          </Link>
        </div>
      </header>

      <div className="relative z-20 sticky top-0">
        <MovesLikeNav screen={screen} onChange={setScreen} />
      </div>

      <main className="relative z-10 pb-16">
        {!webgl && (screen === "discover" || screen === "studio" || screen === "play") ? (
          <WebGLFallback />
        ) : null}
        <ScreenBody screen={screen} />
      </main>
    </div>
  );
}
