"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FavoriteCombo,
  MovesLikeScreen,
  PracticeSection,
  Routine,
  StyleClashChallenge,
  TimelineClip,
} from "./types";
import { getMove } from "./moves-library";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type MovesLikeState = {
  screen: MovesLikeScreen;
  setScreen: (s: MovesLikeScreen) => void;

  selectedMoveIds: string[];
  toggleMove: (id: string) => void;
  setSelectedMoves: (ids: string[]) => void;

  compareMoveIds: [string | null, string | null];
  setCompareSlot: (slot: 0 | 1, id: string | null) => void;

  activeRoutine: Routine | null;
  routines: Routine[];
  setActiveRoutine: (r: Routine | null) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  addClip: (moveId: string) => void;
  removeClip: (clipId: string) => void;
  reorderClips: (from: number, to: number) => void;
  updateClipDuration: (clipId: string, durationBeats: number) => void;
  newBlankRoutine: (name?: string) => void;

  favorites: FavoriteCombo[];
  saveFavorite: (name: string, moveIds: string[]) => void;
  removeFavorite: (id: string) => void;

  practiceHistory: { moveId: string; at: string }[];
  recordPractice: (moveId: string) => void;
  practiceLoop: PracticeSection | null;
  setPracticeLoop: (s: PracticeSection | null) => void;

  challenges: StyleClashChallenge[];
  createChallenge: (prompt: string, moveId: string) => string;
  addChallengeResponse: (
    challengeId: string,
    payload: { authorLabel: string; note: string; videoObjectUrl?: string },
  ) => void;
  voteResponse: (challengeId: string, responseId: string, kind: "creativity" | "style") => void;

  recordingsMeta: { id: string; label: string; createdAt: string }[];
  addRecordingMeta: (label: string) => string;
};

function ensureRoutine(state: MovesLikeState): Routine {
  if (state.activeRoutine) return state.activeRoutine;
  const now = new Date().toISOString();
  return {
    id: uid("routine"),
    name: "Untitled routine",
    bpm: 120,
    clips: [],
    createdAt: now,
    updatedAt: now,
    origin: "manual",
  };
}

export const useMovesLikeStore = create<MovesLikeState>()(
  persist(
    (set, get) => ({
      screen: "discover",
      setScreen: (screen) => set({ screen }),

      selectedMoveIds: ["two-step", "body-roll"],
      toggleMove: (id) =>
        set((s) => ({
          selectedMoveIds: s.selectedMoveIds.includes(id)
            ? s.selectedMoveIds.filter((x) => x !== id)
            : [...s.selectedMoveIds, id].slice(-6),
        })),
      setSelectedMoves: (ids) => set({ selectedMoveIds: ids.slice(0, 6) }),

      compareMoveIds: ["two-step", "body-roll"],
      setCompareSlot: (slot, id) =>
        set((s) => {
          const next: [string | null, string | null] = [...s.compareMoveIds];
          next[slot] = id;
          return { compareMoveIds: next };
        }),

      activeRoutine: null,
      routines: [],
      setActiveRoutine: (r) => set({ activeRoutine: r }),
      saveRoutine: (r) =>
        set((s) => {
          const updated = { ...r, updatedAt: new Date().toISOString() };
          const others = s.routines.filter((x) => x.id !== updated.id);
          return {
            activeRoutine: updated,
            routines: [updated, ...others].slice(0, 40),
          };
        }),
      deleteRoutine: (id) =>
        set((s) => ({
          routines: s.routines.filter((r) => r.id !== id),
          activeRoutine: s.activeRoutine?.id === id ? null : s.activeRoutine,
        })),
      addClip: (moveId) => {
        const move = getMove(moveId);
        if (!move) return;
        set((s) => {
          const routine = ensureRoutine(s);
          const last = routine.clips[routine.clips.length - 1];
          const startBeat = last ? last.startBeat + last.durationBeats : 0;
          const clip: TimelineClip = {
            id: uid("clip"),
            moveId,
            startBeat,
            durationBeats: move.beats,
          };
          const next = {
            ...routine,
            clips: [...routine.clips, clip],
            updatedAt: new Date().toISOString(),
          };
          return { activeRoutine: next };
        });
      },
      removeClip: (clipId) =>
        set((s) => {
          if (!s.activeRoutine) return s;
          let beat = 0;
          const clips = s.activeRoutine.clips
            .filter((c) => c.id !== clipId)
            .map((c) => {
              const next = { ...c, startBeat: beat };
              beat += c.durationBeats;
              return next;
            });
          return {
            activeRoutine: {
              ...s.activeRoutine,
              clips,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      reorderClips: (from, to) =>
        set((s) => {
          if (!s.activeRoutine) return s;
          const clips = [...s.activeRoutine.clips];
          if (from < 0 || to < 0 || from >= clips.length || to >= clips.length) return s;
          const [item] = clips.splice(from, 1);
          if (!item) return s;
          clips.splice(to, 0, item);
          let beat = 0;
          const reindexed = clips.map((c) => {
            const next = { ...c, startBeat: beat };
            beat += c.durationBeats;
            return next;
          });
          return {
            activeRoutine: {
              ...s.activeRoutine,
              clips: reindexed,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      updateClipDuration: (clipId, durationBeats) =>
        set((s) => {
          if (!s.activeRoutine) return s;
          let beat = 0;
          const clips = s.activeRoutine.clips.map((c) => {
            const dur = c.id === clipId ? Math.max(1, durationBeats) : c.durationBeats;
            const next = { ...c, startBeat: beat, durationBeats: dur };
            beat += dur;
            return next;
          });
          return {
            activeRoutine: {
              ...s.activeRoutine,
              clips,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      newBlankRoutine: (name) => {
        const now = new Date().toISOString();
        set({
          activeRoutine: {
            id: uid("routine"),
            name: name ?? "Untitled routine",
            bpm: 120,
            clips: [],
            createdAt: now,
            updatedAt: now,
            origin: "manual",
          },
        });
      },

      favorites: [],
      saveFavorite: (name, moveIds) =>
        set((s) => ({
          favorites: [
            { id: uid("fav"), name, moveIds, createdAt: new Date().toISOString() },
            ...s.favorites,
          ].slice(0, 50),
        })),
      removeFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),

      practiceHistory: [],
      recordPractice: (moveId) =>
        set((s) => ({
          practiceHistory: [{ moveId, at: new Date().toISOString() }, ...s.practiceHistory].slice(
            0,
            100,
          ),
        })),
      practiceLoop: null,
      setPracticeLoop: (practiceLoop) => set({ practiceLoop }),

      challenges: [],
      createChallenge: (prompt, moveId) => {
        const id = uid("clash");
        set((s) => ({
          challenges: [
            {
              id,
              prompt,
              moveId,
              createdAt: new Date().toISOString(),
              responses: [],
            },
            ...s.challenges,
          ].slice(0, 30),
        }));
        return id;
      },
      addChallengeResponse: (challengeId, payload) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id !== challengeId
              ? c
              : {
                  ...c,
                  responses: [
                    {
                      id: uid("resp"),
                      authorLabel: payload.authorLabel,
                      note: payload.note,
                      createdAt: new Date().toISOString(),
                      videoObjectUrl: payload.videoObjectUrl,
                      votesCreativity: 0,
                      votesStyle: 0,
                    },
                    ...c.responses,
                  ],
                },
          ),
        })),
      voteResponse: (challengeId, responseId, kind) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id !== challengeId
              ? c
              : {
                  ...c,
                  responses: c.responses.map((r) =>
                    r.id !== responseId
                      ? r
                      : {
                          ...r,
                          votesCreativity:
                            kind === "creativity" ? r.votesCreativity + 1 : r.votesCreativity,
                          votesStyle: kind === "style" ? r.votesStyle + 1 : r.votesStyle,
                        },
                  ),
                },
          ),
        })),

      recordingsMeta: [],
      addRecordingMeta: (label) => {
        const id = uid("rec");
        set((s) => ({
          recordingsMeta: [
            { id, label, createdAt: new Date().toISOString() },
            ...s.recordingsMeta,
          ].slice(0, 40),
        }));
        return id;
      },
    }),
    {
      name: "zzai-the-moves-like-v1",
      partialize: (s) => ({
        selectedMoveIds: s.selectedMoveIds,
        compareMoveIds: s.compareMoveIds,
        routines: s.routines,
        activeRoutine: s.activeRoutine,
        favorites: s.favorites,
        practiceHistory: s.practiceHistory,
        challenges: s.challenges.map((c) => ({
          ...c,
          // Drop ephemeral blob URLs from persistence
          responses: c.responses.map(({ videoObjectUrl: _v, ...rest }) => rest),
        })),
        recordingsMeta: s.recordingsMeta,
      }),
    },
  ),
);

export function exportRoutineShareText(routine: Routine): string {
  const lines = [
    `THE MOVES LIKE — ${routine.name}`,
    `BPM ${routine.bpm} · ${routine.origin}`,
    ...routine.clips.map((c, i) => {
      const move = getMove(c.moveId);
      return `${i + 1}. ${move?.name ?? c.moveId} @ beat ${c.startBeat} (${c.durationBeats} beats)`;
    }),
    `zzaizzai.com/the-moves-like`,
  ];
  return lines.join("\n");
}
