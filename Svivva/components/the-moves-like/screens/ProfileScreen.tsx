"use client";

import { getMove } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";

export function ProfileScreen() {
  const routines = useMovesLikeStore((s) => s.routines);
  const favorites = useMovesLikeStore((s) => s.favorites);
  const practiceHistory = useMovesLikeStore((s) => s.practiceHistory);
  const recordingsMeta = useMovesLikeStore((s) => s.recordingsMeta);
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const setScreen = useMovesLikeStore((s) => s.setScreen);
  const setActiveRoutine = useMovesLikeStore((s) => s.setActiveRoutine);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">
          Local practice history, saved routines, recordings, and Motion DNA collection — stored in
          this browser.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#90C4D8]">Routines</p>
          <p className="mt-2 text-3xl font-bold text-white">{routines.length}</p>
        </div>
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#90C4D8]">Favorites</p>
          <p className="mt-2 text-3xl font-bold text-white">{favorites.length}</p>
        </div>
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#90C4D8]">Practice logs</p>
          <p className="mt-2 text-3xl font-bold text-white">{practiceHistory.length}</p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Movement collection
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {selectedMoveIds.map((id) => (
            <li
              key={id}
              className="border border-[#5B8DA8]/40 bg-[#5B8DA8]/10 px-3 py-1 text-xs text-[#90C4D8]"
            >
              {getMove(id)?.name ?? id}
            </li>
          ))}
          {!selectedMoveIds.length ? (
            <li className="text-sm text-[#9BB0B8]">Pick moves on Discover or Studio.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Saved routines
        </h3>
        <ul className="mt-3 space-y-2">
          {routines.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between border border-white/10 px-3 py-2"
            >
              <div>
                <p className="text-sm text-white">{r.name}</p>
                <p className="text-[10px] text-[#9BB0B8]">
                  {r.clips.length} clips · {r.origin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveRoutine(r);
                  setScreen("studio");
                }}
                className="text-xs uppercase tracking-[0.12em] text-[#5B8DA8]"
              >
                Open
              </button>
            </li>
          ))}
          {!routines.length ? <li className="text-sm text-[#9BB0B8]">No saved routines.</li> : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Practice history
        </h3>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {practiceHistory.map((p, i) => (
            <li key={`${p.moveId}-${p.at}-${i}`} className="text-xs text-[#C8D8DE]">
              {getMove(p.moveId)?.name ?? p.moveId} · {new Date(p.at).toLocaleString()}
            </li>
          ))}
          {!practiceHistory.length ? (
            <li className="text-sm text-[#9BB0B8]">
              Practice in Learn · Ghost Mode to log sessions.
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Recordings
        </h3>
        <ul className="mt-3 space-y-1">
          {recordingsMeta.map((r) => (
            <li key={r.id} className="text-sm text-[#C8D8DE]">
              {r.label} · {new Date(r.createdAt).toLocaleString()}
            </li>
          ))}
          {!recordingsMeta.length ? (
            <li className="text-sm text-[#9BB0B8]">
              Capture takes in{" "}
              <button type="button" className="text-[#5B8DA8]" onClick={() => setScreen("create")}>
                Create
              </button>
              .
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
