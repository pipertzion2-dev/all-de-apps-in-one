"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Orbit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MIXING_BUSES,
  OAAS_NAME,
  OAAS_TAGLINE,
  PLATFORM_FEATURES,
  type PlatformFeature,
} from "@/lib/platform/feature-graph";
import { MixingBoardScene } from "@/components/homepage-world/mixing-board-scene";

type HomepageWorldProps = {
  onExit: () => void;
};

export function HomepageWorld({ onExit }: HomepageWorldProps) {
  const [selected, setSelected] = useState<PlatformFeature | null>(null);
  const [entered, setEntered] = useState(false);

  const places = useMemo(
    () =>
      MIXING_BUSES.map((bus) => ({
        bus,
        channels: PLATFORM_FEATURES.filter((f) => !f.adminOnly && f.bus === bus.id).sort(
          (a, b) => a.channel - b.channel,
        ),
      })).filter((g) => g.channels.length > 0),
    [],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);

  return (
    <div
      className="fixed inset-0 z-[90] bg-[#0c0e12] text-white"
      role="dialog"
      aria-label="ZZAI World — OaaS mixing board"
      data-testid="homepage-world"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${entered ? "opacity-100" : "opacity-0"}`}
      >
        <MixingBoardScene selectedId={selected?.id ?? null} onSelect={setSelected} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%), linear-gradient(to top, rgba(12,14,18,0.85) 0%, transparent 28%), linear-gradient(to bottom, rgba(12,14,18,0.7) 0%, transparent 22%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col">
        <header className="pointer-events-auto flex items-start justify-between gap-3 p-4 sm:p-6">
          <div className="max-w-md space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display, ui-sans-serif)", color: "#E8EEF2" }}
              >
                ZZAI
              </span>
              <Badge className="bg-[#5B8DA8]/20 text-[#9BC4D8] border-[#5B8DA8]/40 text-[10px]">
                World
              </Badge>
              <Badge variant="outline" className="border-white/15 text-white/70 text-[10px]">
                {OAAS_NAME}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-white/55 max-w-sm">{OAAS_TAGLINE}</p>
            <p className="text-[10px] sm:text-xs text-white/40">
              Drag to orbit · click a channel · Esc returns to the site
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-white/20 bg-black/40 text-white hover:bg-white/10 hover:text-white backdrop-blur-md"
              onClick={onExit}
              data-testid="button-exit-world"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Back to site
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={onExit}
              aria-label="Close world"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="pointer-events-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin max-w-full">
            {places.flatMap(({ channels }) =>
              channels.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f)}
                  className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-mono tracking-wide transition-colors ${
                    selected?.id === f.id
                      ? "border-[#5B8DA8] bg-[#5B8DA8]/25 text-white"
                      : "border-white/15 bg-black/45 text-white/70 hover:border-white/35 hover:text-white"
                  }`}
                  data-testid={`world-place-${f.id}`}
                >
                  {f.channelLabel} · {f.shortTitle}
                </button>
              )),
            )}
          </div>
        </div>

        <div className="flex-1" />

        <footer className="pointer-events-auto p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div
            className={`max-w-md rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-4 transition-all duration-500 ${
              selected ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"
            }`}
          >
            {selected ? (
              <>
                <p className="text-[10px] font-mono tracking-[0.2em] text-[#5B8DA8] uppercase">
                  {selected.channelLabel} · place
                </p>
                <h2 className="text-lg font-semibold mt-1">{selected.title}</h2>
                <p className="text-sm text-white/60 mt-1">{selected.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={selected.href}>
                    <Button size="sm" className="gap-1.5 bg-[#5B8DA8] hover:bg-[#4A7D98]">
                      Open channel <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                    onClick={() => setSelected(null)}
                  >
                    Deselect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[#5B8DA8]">
                  <Orbit className="w-4 h-4" />
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase">Pick a place</p>
                </div>
                <p className="text-sm text-white/65 mt-1">
                  Every feature is a channel strip on the giant OaaS desk. Select one above or on
                  the board — or head back to the business site anytime.
                </p>
              </>
            )}
          </div>

          <Link href="/signup" className="sm:mb-1">
            <Button
              size="sm"
              variant="outline"
              className="border-[#5B8DA8]/50 bg-[#5B8DA8]/10 text-[#9BC4D8] hover:bg-[#5B8DA8]/20"
            >
              Start Free
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
