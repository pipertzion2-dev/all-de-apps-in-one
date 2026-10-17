"use client";

import Link from "next/link";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import { MovesLikeNav } from "@/components/the-moves-like/MovesLikeNav";
import { TrainScreen } from "@/components/the-moves-like/screens/TrainScreen";
import { MovesScreen } from "@/components/the-moves-like/screens/MovesScreen";
import { StudioScreen } from "@/components/the-moves-like/screens/StudioScreen";
import { CypherScreen } from "@/components/the-moves-like/screens/CypherScreen";
import { ProfileScreen } from "@/components/the-moves-like/screens/ProfileScreen";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import type { MovesLikeScreen } from "@/lib/the-moves-like/types";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";

function ScreenBody({ screen }: { screen: MovesLikeScreen }) {
  switch (screen) {
    case "train":
      return <TrainScreen />;
    case "moves":
      return <MovesScreen />;
    case "studio":
      return <StudioScreen />;
    case "cypher":
      return <CypherScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <TrainScreen />;
  }
}

export function MovesLikeApp() {
  const screen = useMovesLikeStore((s) => s.screen);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  return (
    <div
      data-the-moves-like
      data-page-shell
      className="relative min-h-[100dvh] bg-[#F7FBFC] text-foreground"
      style={{ fontFamily: '"Zc", sans-serif' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 50% at 12% 0%, rgba(109,145,179,0.22), transparent 55%), radial-gradient(ellipse 55% 42% at 92% 6%, rgba(172,129,175,0.2), transparent 52%), linear-gradient(180deg, #ffffff 0%, #F7FBFC 40%, #eef2f6 100%)",
        }}
      />

      <header className="relative z-30 flex items-center justify-between gap-3 border-b border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_100%)] px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl backdrop-saturate-150 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-border/50 bg-white/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md hover:border-primary/40 hover:text-foreground"
          >
            ZZAI
          </Link>
          <button
            type="button"
            onClick={() => setScreen("train")}
            className="min-w-0 text-left"
            aria-label={MOVES_LIKE.name}
          >
            <BrandMark size="header" />
          </button>
        </div>
        <p className="hidden max-w-xs truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:block">
          {MOVES_LIKE.tagline}
        </p>
      </header>

      <div className="relative z-30">
        <MovesLikeNav screen={screen} onChange={setScreen} />
      </div>

      <main className="relative z-10 pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-10">
        <ScreenBody screen={screen} />
      </main>
    </div>
  );
}
