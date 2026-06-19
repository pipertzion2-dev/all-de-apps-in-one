"use client";

import { useCallback, useEffect, useState } from "react";
import PlayMidiEvolution from "@/components/play-midi-evolution";
import PlayPsychoacousticGenome from "@/components/play-psychoacoustic-genome";

export type PlayCreativeToolId = "midi-evolution" | "psychoacoustic";

const TOOLS: { id: PlayCreativeToolId; label: string; short: string; description: string }[] = [
  {
    id: "midi-evolution",
    label: "MIDI Evolution Engine",
    short: "MIDI Evolution",
    description:
      "Upload MIDI → forensic analysis → generate sections B–J with preserved velocity & phrasing.",
  },
  {
    id: "psychoacoustic",
    label: "Psychoacoustic Genome",
    short: "Genome",
    description: "Hybridize two track descriptors into a production blueprint.",
  },
];

function toolFromHash(): PlayCreativeToolId {
  if (typeof window === "undefined") return "midi-evolution";
  const hash = window.location.hash.replace("#", "");
  if (hash === "psychoacoustic" || hash === "psychoacoustic-genome") return "psychoacoustic";
  return "midi-evolution";
}

export default function PlayCreativeTools() {
  const [active, setActive] = useState<PlayCreativeToolId>("midi-evolution");

  useEffect(() => {
    setActive(toolFromHash());
    const onHash = () => setActive(toolFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const selectTool = useCallback((id: PlayCreativeToolId) => {
    setActive(id);
    const hash = id === "midi-evolution" ? "midi-evolution" : "psychoacoustic";
    window.history.replaceState(null, "", `#${hash}`);
  }, []);

  const current = TOOLS.find((t) => t.id === active)!;

  return (
    <section
      id="play-creative-tools"
      className="rounded-xl border border-white/10 bg-[#0e0c16] overflow-hidden"
      data-testid="play-creative-tools"
    >
      <div className="border-b border-white/8 bg-gradient-to-r from-white/4 to-transparent px-4 sm:px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#A05068]">
              Creative engines
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white/90 mt-0.5">{current.label}</h2>
            <p className="text-xs sm:text-sm text-white/45 mt-1 max-w-xl">{current.description}</p>
          </div>
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 gap-1 self-start">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => selectTool(tool.id)}
                data-testid={`tab-${tool.id}`}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  active === tool.id
                    ? "bg-white/12 text-white shadow-none"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tool.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-0">
        {active === "midi-evolution" ? (
          <PlayMidiEvolution embedded />
        ) : (
          <PlayPsychoacousticGenome embedded />
        )}
      </div>
    </section>
  );
}

export function scrollToMidiEvolution() {
  window.location.hash = "midi-evolution";
  document
    .getElementById("play-creative-tools")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
