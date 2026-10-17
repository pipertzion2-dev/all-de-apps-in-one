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
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Local practice history, saved routines, recordings, and Motion DNA collection — stored in
          this browser.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="tml-glass p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Routines</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{routines.length}</p>
        </div>
        <div className="tml-glass p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Favorites</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{favorites.length}</p>
        </div>
        <div className="tml-glass p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Practice logs</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{practiceHistory.length}</p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Movement collection
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {selectedMoveIds.map((id) => (
            <li
              key={id}
              className="border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              {getMove(id)?.name ?? id}
            </li>
          ))}
          {!selectedMoveIds.length ? (
            <li className="text-sm text-muted-foreground">Pick moves on Discover or Studio.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Saved routines
        </h3>
        <ul className="mt-3 space-y-2">
          {routines.map((r) => (
            <li key={r.id} className="flex items-center justify-between tml-glass px-3 py-2">
              <div>
                <p className="text-sm text-foreground">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {r.clips.length} clips · {r.origin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveRoutine(r);
                  setScreen("studio");
                }}
                className="text-xs uppercase tracking-[0.12em] text-primary"
              >
                Open
              </button>
            </li>
          ))}
          {!routines.length ? (
            <li className="text-sm text-muted-foreground">No saved routines.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Practice history
        </h3>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {practiceHistory.map((p, i) => (
            <li key={`${p.moveId}-${p.at}-${i}`} className="text-xs text-foreground/80">
              {getMove(p.moveId)?.name ?? p.moveId} · {new Date(p.at).toLocaleString()}
            </li>
          ))}
          {!practiceHistory.length ? (
            <li className="text-sm text-muted-foreground">
              Practice in Learn · Ghost Mode to log sessions.
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Recordings
        </h3>
        <ul className="mt-3 space-y-1">
          {recordingsMeta.map((r) => (
            <li key={r.id} className="text-sm text-foreground/80">
              {r.label} · {new Date(r.createdAt).toLocaleString()}
            </li>
          ))}
          {!recordingsMeta.length ? (
            <li className="text-sm text-muted-foreground">
              Capture takes in{" "}
              <button type="button" className="text-primary" onClick={() => setScreen("create")}>
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
