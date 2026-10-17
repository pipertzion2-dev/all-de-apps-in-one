"use client";

import { useMemo, useRef, useState } from "react";
import {
  TmlButton,
  TmlInput,
  TmlLabel,
  TmlPanel,
  TmlSelect,
} from "@/components/the-moves-like/ui/tml";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import { cn } from "@/lib/utils";

export function StudioScreen() {
  const movements = useMovesLikeStore((s) => s.movements);
  const routines = useMovesLikeStore((s) => s.routines);
  const activeRoutineId = useMovesLikeStore((s) => s.activeRoutineId);
  const setActiveRoutineId = useMovesLikeStore((s) => s.setActiveRoutineId);
  const newRoutine = useMovesLikeStore((s) => s.newRoutine);
  const saveRoutine = useMovesLikeStore((s) => s.saveRoutine);
  const deleteRoutine = useMovesLikeStore((s) => s.deleteRoutine);
  const addClipFromMovement = useMovesLikeStore((s) => s.addClipFromMovement);
  const removeClip = useMovesLikeStore((s) => s.removeClip);
  const reorderClips = useMovesLikeStore((s) => s.reorderClips);
  const updateClip = useMovesLikeStore((s) => s.updateClip);
  const attachMusic = useMovesLikeStore((s) => s.attachMusic);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  const routine = routines.find((r) => r.id === activeRoutineId) ?? null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const totalSec = useMemo(
    () => routine?.clips.reduce((a, c) => a + c.durationSec, 0) ?? 0,
    [routine],
  );

  const playSequence = async () => {
    if (!routine?.clips.length) return;
    setPlaying(true);
    setPlayhead(0);
    if (routine.musicObjectUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    }
    let t = 0;
    for (const clip of routine.clips) {
      setPlayhead(t);
      await new Promise((r) => setTimeout(r, clip.durationSec * 1000));
      t += clip.durationSec;
      if (!useMovesLikeStore.getState().activeRoutineId) break;
    }
    setPlayhead(totalSec);
    setPlaying(false);
    audioRef.current?.pause();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D91B3]">Studio</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Choreography builder
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Sequence-based timeline — arrange saved moves, set durations, add music. Full nonlinear
            compositing comes later; this prototype is reliable and expandable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TmlButton type="button" variant="secondary" onClick={() => newRoutine()}>
            New routine
          </TmlButton>
          <TmlButton type="button" variant="ghost" onClick={() => setScreen("moves")}>
            Browse Moves
          </TmlButton>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
        <TmlPanel className="p-3">
          <TmlLabel className="mb-2">Routines</TmlLabel>
          {!routines.length ? (
            <p className="text-xs text-muted-foreground">No saved routines yet.</p>
          ) : (
            <ul className="space-y-1">
              {routines.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setActiveRoutineId(r.id)}
                    className={cn(
                      "w-full rounded-lg px-2 py-2 text-left text-sm",
                      r.id === activeRoutineId
                        ? "bg-[rgba(109,145,179,0.18)] text-[#6D91B3]"
                        : "text-muted-foreground hover:bg-white/40 hover:text-foreground",
                    )}
                  >
                    {r.name}
                    <span className="mt-0.5 block text-[10px] opacity-70">
                      {r.clips.length} clips ·{" "}
                      {r.clips.reduce((a, c) => a + c.durationSec, 0).toFixed(1)}s
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TmlPanel>

        <div className="space-y-4">
          {!routine ? (
            <TmlPanel className="p-8 text-center">
              <p className="text-lg font-semibold">Start a routine</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a blank timeline or add a move from your library.
              </p>
              <TmlButton type="button" className="mt-4" onClick={() => newRoutine("Cipher set")}>
                Create routine
              </TmlButton>
            </TmlPanel>
          ) : (
            <>
              <TmlPanel className="flex flex-wrap items-end gap-3 p-4">
                <div className="min-w-[12rem] flex-1">
                  <TmlLabel className="mb-1">Routine name</TmlLabel>
                  <TmlInput
                    value={routine.name}
                    onChange={(e) => saveRoutine({ ...routine, name: e.target.value })}
                  />
                </div>
                <TmlButton type="button" onClick={() => saveRoutine(routine)}>
                  Save
                </TmlButton>
                <TmlButton
                  type="button"
                  variant="secondary"
                  disabled={!routine.clips.length || playing}
                  onClick={() => void playSequence()}
                >
                  {playing ? "Playing…" : "Play sequence"}
                </TmlButton>
                <TmlButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm("Delete this routine?")) deleteRoutine(routine.id);
                  }}
                >
                  Delete
                </TmlButton>
              </TmlPanel>

              <TmlPanel className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TmlLabel>Music track</TmlLabel>
                  <label className="cursor-pointer text-xs font-semibold text-[#6D91B3] hover:underline">
                    {routine.musicName ? `Replace · ${routine.musicName}` : "Upload audio"}
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void attachMusic(f, f.name);
                      }}
                    />
                  </label>
                </div>
                {routine.musicObjectUrl ? (
                  <audio
                    ref={audioRef}
                    src={routine.musicObjectUrl}
                    className="mt-2 w-full"
                    controls
                  />
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Optional — sync later with beat tools.
                  </p>
                )}
              </TmlPanel>

              <TmlPanel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/55 px-4 py-2">
                  <TmlLabel>Timeline · {totalSec.toFixed(1)}s</TmlLabel>
                  <span className="text-[10px] text-muted-foreground">
                    Playhead {playhead.toFixed(1)}s · drag clips to reorder
                  </span>
                </div>
                <div className="relative min-h-[120px] overflow-x-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(109,145,179,0.08)_100%)] p-3">
                  <div
                    className="pointer-events-none absolute bottom-3 top-3 w-0.5 bg-[#6D91B3]"
                    style={{
                      left: totalSec
                        ? `calc(12px + ${(playhead / Math.max(totalSec, 0.01)) * 100}% - 12px)`
                        : 12,
                    }}
                  />
                  <div className="flex min-w-full gap-2">
                    {routine.clips.map((clip, index) => {
                      const move = movements.find((m) => m.id === clip.movementId);
                      return (
                        <div
                          key={clip.id}
                          draggable
                          onDragStart={() => setDragFrom(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragFrom === null) return;
                            reorderClips(dragFrom, index);
                            setDragFrom(null);
                          }}
                          className="tml-glass-teal min-w-[140px] flex-1 cursor-grab p-2 active:cursor-grabbing"
                          style={{ flexGrow: clip.durationSec }}
                        >
                          <p className="truncate text-xs font-semibold text-foreground">
                            {move?.name ?? "Missing move"}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            {clip.durationSec.toFixed(1)}s
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <input
                              type="number"
                              min={0.25}
                              step={0.25}
                              value={clip.durationSec}
                              onChange={(e) =>
                                updateClip(clip.id, { durationSec: Number(e.target.value) || 0.25 })
                              }
                              className="w-16 rounded border border-white/55 bg-white/55 px-1 py-0.5 text-[10px] text-foreground"
                              aria-label="Duration seconds"
                            />
                            <button
                              type="button"
                              className="rounded px-1.5 text-[10px] text-red-300 hover:bg-red-500/10"
                              onClick={() => removeClip(clip.id)}
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            className="mt-2 w-full rounded border border-white/55 bg-white/55 px-1 py-0.5 text-[10px] text-foreground"
                            placeholder="Transition note"
                            value={clip.note ?? ""}
                            onChange={(e) => updateClip(clip.id, { note: e.target.value })}
                          />
                        </div>
                      );
                    })}
                    {!routine.clips.length ? (
                      <p className="py-8 text-sm text-muted-foreground">
                        Add movements from the library below.
                      </p>
                    ) : null}
                  </div>
                </div>
              </TmlPanel>

              <TmlPanel className="p-4">
                <TmlLabel className="mb-3">Add from library</TmlLabel>
                <div className="flex flex-wrap gap-2">
                  {movements.slice(0, 16).map((m) => (
                    <TmlButton
                      key={m.id}
                      type="button"
                      variant="secondary"
                      className="min-h-9 text-xs"
                      onClick={() => addClipFromMovement(m.id)}
                    >
                      + {m.name}
                    </TmlButton>
                  ))}
                </div>
              </TmlPanel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
