"use client";

import PlayPsychoacousticGenome from "@/components/play-psychoacoustic-genome";

export default function PlayCreativeTools() {
  return (
    <section
      id="play-creative-tools"
      className="rounded-xl border border-white/10 bg-[#0e0c16] overflow-hidden"
      data-testid="play-creative-tools"
    >
      <div className="border-b border-white/8 bg-gradient-to-r from-white/4 to-transparent px-4 sm:px-5 py-4">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#A05068]">
          Creative engines
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white/90 mt-0.5">Psychoacoustic Genome</h2>
        <p className="text-xs sm:text-sm text-white/45 mt-1 max-w-xl">
          Hybridize two track descriptors into a production blueprint.
        </p>
      </div>

      <div className="p-0">
        <PlayPsychoacousticGenome embedded />
      </div>
    </section>
  );
}
