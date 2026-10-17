"use client";

import dynamic from "next/dynamic";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
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

export function DiscoverScreen() {
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const toggleMove = useMovesLikeStore((s) => s.toggleMove);

  return (
    <div>
      {/* One composition: brand + line + CTA over full-bleed 3D — no cards in hero */}
      <section className="relative isolate min-h-[100dvh] overflow-hidden">
        <div className="absolute inset-0">
          <MovementStage
            moveIds={selectedMoveIds.length ? selectedMoveIds : ["body-roll", "afro-bounce"]}
            mode="freestyle"
            interactive
            className="h-full min-h-[100dvh]"
            showCaption={false}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#071014]/95 via-[#071014]/55 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#071014] to-transparent"
          />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-16 pt-28 sm:px-10 sm:pb-20">
          <BrandMark
            size="hero"
            priority
            className="mb-5 drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          />
          <p className="max-w-md text-base leading-relaxed text-[#D5E4EA] sm:text-lg">
            {MOVES_LIKE.tagline}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setScreen("studio")}
              className="bg-[#5B8DA8] px-6 py-3 text-sm font-semibold text-[#071014] transition hover:bg-[#90C4D8]"
            >
              Open Studio
            </button>
            <button
              type="button"
              onClick={() => setScreen("learn")}
              className="border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-[#C44A9A] hover:text-[#E8A0D0]"
            >
              Practice in Ghost Mode
            </button>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-[#7A949C]">
            Illustrative Motion DNA on stage · not measured tracking
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-12 sm:px-10">
        <h2 className="text-xl font-semibold tracking-tight text-white">Pick a move</h2>
        <p className="mt-2 max-w-xl text-sm text-[#9BB0B8]">
          Tap to load it into the stage and your Studio collection. Then Learn it, or drop it on the
          Reactor timeline.
        </p>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOVES_LIBRARY.map((move) => {
            const on = selectedMoveIds.includes(move.id);
            return (
              <li key={move.id}>
                <button
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={`group w-full border-b pb-4 text-left transition ${
                    on ? "border-[#5B8DA8]" : "border-white/15 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className={`text-lg font-semibold ${on ? "text-[#90C4D8]" : "text-white"}`}>
                      {move.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#C44A9A]">
                      {move.style}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9BB0B8]">
                    {move.level} · {move.energy} · {move.beats} beats
                  </p>
                  <p className="mt-2 text-sm text-[#C8D8DE]/90">{move.tutorialSteps[0]}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
