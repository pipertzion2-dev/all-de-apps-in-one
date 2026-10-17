"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { MOVES_LIBRARY } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-[#071014] text-sm text-[#90C4D8]">
        Loading stage…
      </div>
    ),
  },
);

const FEATURED = [
  {
    title: "Motion DNA",
    blurb: "Explore illustrative fingerprints of each move — combine, compare, collect.",
    screen: "studio" as const,
  },
  {
    title: "Ghost Mode",
    blurb: "Practice beside a reference with sync, opacity, and optional pose overlays.",
    screen: "learn" as const,
  },
  {
    title: "Style Clash",
    blurb: "Async challenges — same prompt, your interpretation, community votes.",
    screen: "play" as const,
  },
];

export function DiscoverScreen() {
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const toggleMove = useMovesLikeStore((s) => s.toggleMove);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-none border-b border-white/10">
        <div className="absolute inset-0">
          <MovementStage
            moveIds={selectedMoveIds}
            mode="freestyle"
            interactive
            className="h-[min(72vh,640px)]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071014] via-[#071014]/35 to-transparent" />
        </div>
        <div className="relative z-10 flex min-h-[min(72vh,640px)] flex-col justify-end px-4 pb-10 pt-24 sm:px-8">
          <Image
            src={MOVES_LIKE.logoPath}
            alt="THE MOVES LIKE"
            width={520}
            height={260}
            priority
            className="mb-4 w-[min(92vw,420px)] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
          />
          <h1 className="max-w-xl font-[family-name:var(--font-tml-display)] text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {MOVES_LIKE.name}
          </h1>
          <p className="mt-3 max-w-md text-sm text-[#C8D8DE] sm:text-base">{MOVES_LIKE.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setScreen("studio")}
              className="rounded-md bg-[#5B8DA8] px-5 py-2.5 text-sm font-semibold text-[#071014] transition hover:bg-[#90C4D8]"
            >
              Open Studio
            </button>
            <button
              type="button"
              onClick={() => setScreen("learn")}
              className="rounded-md border border-white/25 bg-black/40 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:border-[#C44A9A]/60"
            >
              Start learning
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8">
        <h2 className="text-lg font-semibold text-white">Featured pathways</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">One job each — jump straight into the loop.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {FEATURED.map((f) => (
            <li key={f.title}>
              <button
                type="button"
                onClick={() => setScreen(f.screen)}
                className="h-full w-full border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#5B8DA8]/50 hover:bg-white/[0.06]"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[#C8D8DE]">{f.blurb}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-10 sm:px-8">
        <h2 className="text-lg font-semibold text-white">Movement feed</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">
          Select moves to load them into the stage and your Studio collection.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOVES_LIBRARY.map((move) => {
            const on = selectedMoveIds.includes(move.id);
            return (
              <li key={move.id}>
                <button
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={`w-full border p-4 text-left transition ${
                    on
                      ? "border-[#5B8DA8] bg-[#5B8DA8]/15"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-white">{move.name}</h3>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#C44A9A]">
                      {move.style}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9BB0B8]">
                    {move.level} · {move.energy} · {move.beats} beats
                  </p>
                  <p className="mt-2 text-xs text-[#C8D8DE]">{move.tutorialSteps[0]}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
