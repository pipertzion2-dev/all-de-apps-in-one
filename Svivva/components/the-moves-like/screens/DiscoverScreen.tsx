"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/the-moves-like/BrandMark";
import {
  GlassButton,
  GlassChip,
  GlassMagentaButton,
  GlassPanel,
} from "@/components/the-moves-like/ui/Glass";
import { MOVES_LIKE } from "@/lib/the-moves-like/brand";
import { MOVES_LIBRARY } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import { preferMobileCameraUi } from "@/lib/the-moves-like/use-front-camera";
import { cn } from "@/lib/utils";

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-[#071014] text-sm text-primary">
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071014] via-[#071014]/45 to-black/30 sm:bg-gradient-to-r sm:from-[#071014]/90 sm:via-[#071014]/50 sm:to-transparent"
          />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-4 pb-24 pt-28 sm:px-10 sm:pb-20">
          <GlassPanel
            tint="ink"
            className="max-w-xl border-white/10 bg-[hsl(180_20%_6%/0.42)] p-5 sm:p-7"
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              ZZAI · Front camera dance
            </p>
            <BrandMark
              size="hero"
              priority
              className="mb-4 max-w-[min(86vw,400px)] drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            />
            <p className="max-w-md text-sm leading-relaxed text-[#D5E4EA] sm:text-base">
              {mobileCam
                ? "Built for your front camera — practice, record, and clash from your phone."
                : MOVES_LIKE.tagline}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <GlassMagentaButton
                type="button"
                className="min-h-12"
                onClick={() => setScreen("learn")}
              >
                Open front camera · Practice
              </GlassMagentaButton>
              <GlassButton
                type="button"
                variant="outline"
                className="min-h-12"
                onClick={() => setScreen("create")}
              >
                Record a take
              </GlassButton>
              <GlassButton
                type="button"
                variant="ghost"
                className="min-h-11 text-primary"
                onClick={() => setScreen("studio")}
              >
                Studio
              </GlassButton>
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              iPhone & Android · selfie camera first · clear glass UI
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="relative border-t border-border/30 px-4 py-10 sm:px-10 sm:py-12">
        <GlassPanel tint="teal" className="mb-6 inline-block px-4 py-2">
          <h2 className="text-lg font-semibold tracking-tight text-[#e8f4f8]">Pick a move</h2>
        </GlassPanel>
        <p className="mb-6 max-w-xl text-sm text-muted-foreground">
          Tap a move, then Practice with your front camera — or open Studio.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOVES_LIBRARY.map((move) => {
            const on = selectedMoveIds.includes(move.id);
            return (
              <li key={move.id} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={cn(
                    "min-h-[64px] flex-1 rounded-2xl border p-3 text-left backdrop-blur-xl transition",
                    on
                      ? "border-primary/45 bg-primary/15"
                      : "border-border/40 bg-card/25 hover:border-primary/30 hover:bg-card/40",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className={cn("text-base font-semibold", on ? "text-primary" : "text-white")}
                    >
                      {move.name}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-accent-foreground">
                      {move.style}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {move.level} · {move.beats} beats
                  </p>
                </button>
                <GlassChip
                  className="self-stretch rounded-2xl px-3"
                  onClick={() => {
                    if (!selectedMoveIds.includes(move.id)) toggleMove(move.id);
                    setScreen("learn");
                  }}
                >
                  Cam
                </GlassChip>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
