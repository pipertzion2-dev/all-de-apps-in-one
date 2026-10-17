"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ENERGY_OPTIONS,
  LEVEL_OPTIONS,
  MOVES_LIBRARY,
  STYLE_OPTIONS,
  getMove,
} from "@/lib/the-moves-like/moves-library";
import { assembleFromLibrary, aiChoreographyStatus } from "@/lib/the-moves-like/choreo-assemble";
import { exportRoutineShareText, useMovesLikeStore } from "@/lib/the-moves-like/store";
import type { DanceStyle, EnergyLevel, MusicalMood, SkillLevel } from "@/lib/the-moves-like/types";

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  { ssr: false },
);

const MOODS: MusicalMood[] = ["groovy", "energetic", "smooth", "aggressive", "playful"];

export function StudioScreen() {
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const toggleMove = useMovesLikeStore((s) => s.toggleMove);
  const compareMoveIds = useMovesLikeStore((s) => s.compareMoveIds);
  const setCompareSlot = useMovesLikeStore((s) => s.setCompareSlot);
  const activeRoutine = useMovesLikeStore((s) => s.activeRoutine);
  const routines = useMovesLikeStore((s) => s.routines);
  const addClip = useMovesLikeStore((s) => s.addClip);
  const removeClip = useMovesLikeStore((s) => s.removeClip);
  const reorderClips = useMovesLikeStore((s) => s.reorderClips);
  const updateClipDuration = useMovesLikeStore((s) => s.updateClipDuration);
  const saveRoutine = useMovesLikeStore((s) => s.saveRoutine);
  const setActiveRoutine = useMovesLikeStore((s) => s.setActiveRoutine);
  const newBlankRoutine = useMovesLikeStore((s) => s.newBlankRoutine);
  const saveFavorite = useMovesLikeStore((s) => s.saveFavorite);
  const favorites = useMovesLikeStore((s) => s.favorites);

  const [style, setStyle] = useState<DanceStyle>("hip-hop");
  const [level, setLevel] = useState<SkillLevel>("beginner");
  const [mood, setMood] = useState<MusicalMood>("groovy");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [durationSec, setDurationSec] = useState(32);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const aiStatus = aiChoreographyStatus();

  const stageMoves = useMemo(() => {
    if (activeRoutine?.clips.length) {
      return activeRoutine.clips.map((c) => c.moveId);
    }
    return selectedMoveIds;
  }, [activeRoutine, selectedMoveIds]);

  const boundaries = useMemo(() => {
    if (!activeRoutine?.clips.length) return [];
    const total = activeRoutine.clips.reduce((a, c) => a + c.durationBeats, 0) || 1;
    return activeRoutine.clips.map((c) => c.startBeat / total);
  }, [activeRoutine]);

  const compareIds = useMemo(
    () => [compareMoveIds[0], compareMoveIds[1]].filter(Boolean) as string[],
    [compareMoveIds],
  );

  const playPreview = () => {
    if (!activeRoutine?.clips.length) return;
    setPlaying(true);
    setProgress(0);
    const start = performance.now();
    const totalMs =
      (activeRoutine.clips.reduce((a, c) => a + c.durationBeats, 0) / activeRoutine.bpm) *
      60 *
      1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / totalMs);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  };

  const assemble = () => {
    const routine = assembleFromLibrary({
      style,
      level,
      mood,
      energy,
      durationSec,
      preferredMoveIds: selectedMoveIds,
      challenge: energy === "explosive" ? "power accents" : undefined,
    });
    setActiveRoutine(routine);
  };

  const share = async () => {
    if (!activeRoutine) return;
    const text = exportRoutineShareText(activeRoutine);
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg("Routine copied to clipboard.");
    } catch {
      setShareMsg(text);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Studio · Move Reactor</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#9BB0B8]">
          Build routines from the movement library, preview transitions on the 3D stage, and save
          Motion DNA combinations. Library-assembled sequences are labeled clearly — not AI
          choreography.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[280px] overflow-hidden tml-glass">
          <MovementStage
            moveIds={stageMoves.slice(0, 4)}
            mode="choreo"
            playbackProgress={progress}
            clipBoundaries={boundaries}
          />
        </div>

        <div className="tml-glass space-y-3 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#90C4D8]">
            Sequence brief
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-[#9BB0B8]">
              Style
              <select
                className="mt-1 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-2 py-2 text-white"
                value={style}
                onChange={(e) => setStyle(e.target.value as DanceStyle)}
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[#9BB0B8]">
              Level
              <select
                className="mt-1 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-2 py-2 text-white"
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
              >
                {LEVEL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[#9BB0B8]">
              Mood
              <select
                className="mt-1 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-2 py-2 text-white"
                value={mood}
                onChange={(e) => setMood(e.target.value as MusicalMood)}
              >
                {MOODS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[#9BB0B8]">
              Energy
              <select
                className="mt-1 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-2 py-2 text-white"
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
              >
                {ENERGY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-[#9BB0B8]">
            Duration {durationSec}s
            <input
              type="range"
              min={16}
              max={96}
              step={8}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={assemble}
              className="rounded-md bg-[#5B8DA8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#071014]"
            >
              Assemble from library
            </button>
            <button
              type="button"
              onClick={() => newBlankRoutine()}
              className="rounded-md border border-border/40 bg-white/5 backdrop-blur-md px-3 py-2 text-xs uppercase tracking-[0.12em] text-white"
            >
              Blank routine
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#9BB0B8]">
            {aiStatus.available
              ? aiStatus.note
              : `AI choreography: unavailable — ${aiStatus.reason}`}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
            Timeline {activeRoutine ? `· ${activeRoutine.name}` : ""}
            {activeRoutine ? (
              <span className="ml-2 text-[10px] text-[#C44A9A]">
                {activeRoutine.origin === "library-assembled" ? "library-assembled" : "manual"}
              </span>
            ) : null}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeRoutine?.clips.length || playing}
              onClick={() => playPreview()}
              className="rounded-md bg-[#C44A9A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {playing ? "Playing…" : "Preview on stage"}
            </button>
            <button
              type="button"
              disabled={!activeRoutine}
              onClick={() => activeRoutine && saveRoutine(activeRoutine)}
              className="rounded-md border border-border/40 bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs text-white disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              disabled={!activeRoutine}
              onClick={() => void share()}
              className="rounded-md border border-border/40 bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs text-white disabled:opacity-40"
            >
              Export / share text
            </button>
          </div>
        </div>
        {shareMsg ? (
          <pre className="overflow-x-auto whitespace-pre-wrap tml-glass bg-black/40 p-3 text-xs text-[#C8D8DE]">
            {shareMsg}
          </pre>
        ) : null}
        {!activeRoutine?.clips.length ? (
          <p className="text-sm text-[#9BB0B8]">
            Add moves from the library below, or assemble a library sequence.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeRoutine.clips.map((clip, index) => {
              const m = getMove(clip.moveId);
              return (
                <li
                  key={clip.id}
                  className="flex flex-wrap items-center gap-2 tml-glass bg-black/30 px-3 py-2"
                >
                  <span className="w-6 text-xs text-[#9BB0B8]">{index + 1}</span>
                  <span className="min-w-[8rem] flex-1 text-sm text-white">
                    {m?.name ?? clip.moveId}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#90C4D8]">
                    beat {clip.startBeat}
                  </span>
                  <label className="flex items-center gap-1 text-[10px] text-[#9BB0B8]">
                    beats
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={clip.durationBeats}
                      onChange={(e) => updateClipDuration(clip.id, Number(e.target.value))}
                      className="w-14 rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-1 py-0.5 text-white"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => reorderClips(index, index - 1)}
                    className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === activeRoutine.clips.length - 1}
                    onClick={() => reorderClips(index, index + 1)}
                    className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeClip(clip.id)}
                    className="rounded border border-[#C44A9A]/40 px-2 py-1 text-xs text-[#E8A0D0]"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Movement library
        </h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MOVES_LIBRARY.map((m) => (
            <li key={m.id} className="flex items-center gap-2 tml-glass px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  if (!activeRoutine) newBlankRoutine();
                  addClip(m.id);
                }}
                className="flex-1 text-left text-sm text-white hover:text-[#90C4D8]"
              >
                {m.name}
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-[#9BB0B8]">
                  {m.style} · {m.beats} beats
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleMove(m.id)}
                className={`rounded px-2 py-1 text-[10px] uppercase ${
                  selectedMoveIds.includes(m.id)
                    ? "bg-[#5B8DA8] text-[#071014]"
                    : "border border-white/15 text-[#C8D8DE]"
                }`}
              >
                DNA
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="tml-glass p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
            Motion DNA compare
          </h3>
          <p className="mt-1 text-xs text-[#9BB0B8]">
            Illustrative fingerprints only — not measured body tracking.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[0, 1].map((slot) => (
              <select
                key={slot}
                className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-2 py-2 text-sm text-white"
                value={compareMoveIds[slot as 0 | 1] ?? ""}
                onChange={(e) => setCompareSlot(slot as 0 | 1, e.target.value || null)}
              >
                <option value="">—</option>
                {MOVES_LIBRARY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="mt-3 h-48 overflow-hidden tml-glass">
            <MovementStage moveIds={compareIds} mode="dna" interactive />
          </div>
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={() =>
              saveFavorite(
                `Combo ${compareIds.map((id) => getMove(id)?.name ?? id).join(" → ")}`,
                compareIds,
              )
            }
            className="mt-3 rounded-md border border-border/40 bg-white/5 backdrop-blur-md px-3 py-2 text-xs text-white disabled:opacity-40"
          >
            Save combination
          </button>
        </div>
        <div className="tml-glass p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
            Saved routines & favorites
          </h3>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {routines.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setActiveRoutine(r)}
                  className="w-full tml-glass px-3 py-2 text-left text-sm text-[#C8D8DE] hover:border-[#5B8DA8]/40"
                >
                  {r.name}
                  <span className="mt-0.5 block text-[10px] text-[#9BB0B8]">
                    {r.clips.length} clips · {r.origin}
                  </span>
                </button>
              </li>
            ))}
            {favorites.map((f) => (
              <li key={f.id} className="tml-glass px-3 py-2 text-sm text-[#C8D8DE]">
                ★ {f.name}
              </li>
            ))}
            {!routines.length && !favorites.length ? (
              <li className="text-sm text-[#9BB0B8]">Nothing saved yet.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
