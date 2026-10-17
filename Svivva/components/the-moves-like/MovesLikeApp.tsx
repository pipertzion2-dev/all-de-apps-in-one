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
      className="relative min-h-[100dvh] bg-[#08090B] text-white"
      style={{ fontFamily: '"Zc", Inter, system-ui, sans-serif' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(198,255,0,0.08), transparent 55%), radial-gradient(ellipse 50% 35% at 90% 10%, rgba(61,139,255,0.1), transparent 50%)",
        }}
      />

      <header className="relative z-30 flex items-center justify-between gap-3 border-b border-[#2A2E38] px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-md border border-[#2A2E38] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#8B919A] hover:border-[#C6FF00]/40 hover:text-[#C6FF00]"
          >
            ZZAI
          </Link>
          <button type="button" onClick={() => setScreen("train")} className="min-w-0 text-left">
            <BrandMark size="header" />
          </button>
        </div>
        <p className="hidden max-w-xs truncate text-[10px] uppercase tracking-[0.14em] text-[#8B919A] md:block">
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
