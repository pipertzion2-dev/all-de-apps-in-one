"use client";

import dynamic from "next/dynamic";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { MOVES_LIBRARY } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import { useEffect, useState } from "react";
import { preferMobileCameraUi } from "@/lib/the-moves-like/use-front-camera";

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
  const [mobileCam, setMobileCam] = useState(false);

  useEffect(() => {
    setMobileCam(preferMobileCameraUi());
  }, []);

  return (
    <div className="pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0">
      <section className="relative isolate min-h-[100dvh] overflow-hidden">
        <div className="absolute inset-0">
          <MovementStage
            moveIds={selectedMoveIds.length ? selectedMoveIds : ["body-roll", "afro-bounce"]}
            mode="freestyle"
            interactive={!mobileCam}
            className="h-full min-h-[100dvh]"
            showCaption={false}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071014] via-[#071014]/50 to-black/40 sm:bg-gradient-to-r sm:from-[#071014]/95 sm:via-[#071014]/55 sm:to-transparent"
          />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-24 pt-28 sm:px-10 sm:pb-20">
          <BrandMark
            size="hero"
            priority
            className="mb-4 max-w-[min(92vw,420px)] drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)] sm:mb-5 sm:max-w-none"
          />
          <p className="max-w-md text-base leading-relaxed text-[#D5E4EA] sm:text-lg">
            {mobileCam
              ? "Built for your front camera — practice, record, and clash from your phone."
              : MOVES_LIKE.tagline}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setScreen("learn")}
              className="min-h-[52px] bg-[#C44A9A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#E8A0D0] hover:text-[#071014]"
            >
              Open front camera · Practice
            </button>
            <button
              type="button"
              onClick={() => setScreen("create")}
              className="min-h-[52px] border border-white/30 bg-black/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-[#5B8DA8]"
            >
              Record a take
            </button>
            <button
              type="button"
              onClick={() => setScreen("studio")}
              className="min-h-[48px] text-sm font-semibold text-[#90C4D8] underline-offset-4 hover:underline sm:min-h-[52px] sm:border sm:border-white/20 sm:px-6 sm:no-underline"
            >
              Studio
            </button>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-[#7A949C] sm:mt-8 sm:tracking-[0.22em]">
            iPhone & Android · selfie camera first · hold phone upright
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-10 sm:px-10 sm:py-12">
        <h2 className="text-xl font-semibold tracking-tight text-white">Pick a move</h2>
        <p className="mt-2 max-w-xl text-sm text-[#9BB0B8]">
          Tap a move, then Practice with your front camera — or drop it into Studio.
        </p>
        <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:grid-cols-3">
          {MOVES_LIBRARY.map((move) => {
            const on = selectedMoveIds.includes(move.id);
            return (
              <li key={move.id} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={`min-h-[56px] flex-1 border-b pb-3 text-left transition ${
                    on ? "border-[#5B8DA8]" : "border-white/15"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className={`text-base font-semibold ${on ? "text-[#90C4D8]" : "text-white"}`}
                    >
                      {move.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#C44A9A]">
                      {move.style}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9BB0B8]">
                    {move.level} · {move.beats} beats
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMoveIds.includes(move.id)) toggleMove(move.id);
                    setScreen("learn");
                  }}
                  className="min-h-[56px] shrink-0 self-stretch border border-[#C44A9A]/40 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E8A0D0]"
                >
                  Cam
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
