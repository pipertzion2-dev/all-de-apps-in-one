"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CypherSubmission,
  DancerProfile,
  Movement,
  MovesLikeScreen,
  MoveCategory,
  Routine,
  TimelineClip,
} from "./types";
import { SAMPLE_CHALLENGES, SAMPLE_MOVEMENTS } from "./sample-data";
import { deleteMediaBlob, putMediaBlob, uid } from "./media-store";

type MovesLikeState = {
  screen: MovesLikeScreen;
  setScreen: (s: MovesLikeScreen) => void;

  movements: Movement[];
  upsertMovement: (m: Movement) => void;
  deleteMovement: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  attachVideo: (
    movementId: string,
    blob: Blob,
    meta: { durationSec: number; thumbnailDataUrl?: string },
  ) => Promise<void>;

  routines: Routine[];
  activeRoutineId: string | null;
  setActiveRoutineId: (id: string | null) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  newRoutine: (name?: string) => string;
  addClipFromMovement: (movementId: string) => void;
  removeClip: (clipId: string) => void;
  reorderClips: (from: number, to: number) => void;
  updateClip: (clipId: string, patch: Partial<TimelineClip>) => void;
  attachMusic: (blob: Blob, name: string) => Promise<void>;

  profile: DancerProfile;
  setProfile: (p: Partial<DancerProfile>) => void;

  submissions: CypherSubmission[];
  addSubmission: (s: Omit<CypherSubmission, "id" | "createdAt">) => void;
};

function nowIso() {
  return new Date().toISOString();
}

function activeRoutine(state: MovesLikeState): Routine | null {
  return state.routines.find((r) => r.id === state.activeRoutineId) ?? null;
}

export const useMovesLikeStore = create<MovesLikeState>()(
  persist(
    (set, get) => ({
      screen: "train",
      setScreen: (screen) => set({ screen }),

      movements: SAMPLE_MOVEMENTS,
      upsertMovement: (m) =>
        set((s) => {
          const i = s.movements.findIndex((x) => x.id === m.id);
          if (i < 0) return { movements: [m, ...s.movements] };
          const next = [...s.movements];
          next[i] = m;
          return { movements: next };
        }),
      deleteMovement: async (id) => {
        const m = get().movements.find((x) => x.id === id);
        if (m?.videoBlobId) {
          try {
            await deleteMediaBlob(m.videoBlobId);
          } catch {
            /* ignore */
          }
        }
        set((s) => ({
          movements: s.movements.filter((x) => x.id !== id || x.source === "sample"),
        }));
      },
      toggleFavorite: (id) =>
        set((s) => ({
          movements: s.movements.map((m) =>
            m.id === id ? { ...m, favorite: !m.favorite, updatedAt: nowIso() } : m,
          ),
        })),
      attachVideo: async (movementId, blob, meta) => {
        const blobId = uid("vid");
        await putMediaBlob(blobId, blob);
        const objectUrl = URL.createObjectURL(blob);
        set((s) => ({
          movements: s.movements.map((m) =>
            m.id === movementId
              ? {
                  ...m,
                  videoBlobId: blobId,
                  videoObjectUrl: objectUrl,
                  durationSec: meta.durationSec || m.durationSec,
                  thumbnailDataUrl: meta.thumbnailDataUrl ?? m.thumbnailDataUrl,
                  updatedAt: nowIso(),
                  source: "user",
                }
              : m,
          ),
        }));
      },

      routines: [],
      activeRoutineId: null,
      setActiveRoutineId: (id) => set({ activeRoutineId: id }),
      saveRoutine: (r) =>
        set((s) => {
          const i = s.routines.findIndex((x) => x.id === r.id);
          if (i < 0) return { routines: [r, ...s.routines], activeRoutineId: r.id };
          const next = [...s.routines];
          next[i] = { ...r, updatedAt: nowIso() };
          return { routines: next };
        }),
      deleteRoutine: (id) =>
        set((s) => ({
          routines: s.routines.filter((r) => r.id !== id),
          activeRoutineId: s.activeRoutineId === id ? null : s.activeRoutineId,
        })),
      newRoutine: (name) => {
        const id = uid("routine");
        const stamp = nowIso();
        const r: Routine = {
          id,
          name: name?.trim() || "Untitled routine",
          clips: [],
          createdAt: stamp,
          updatedAt: stamp,
        };
        set((s) => ({ routines: [r, ...s.routines], activeRoutineId: id }));
        return id;
      },
      addClipFromMovement: (movementId) => {
        const m = get().movements.find((x) => x.id === movementId);
        if (!m) return;
        set((s) => {
          let routine = activeRoutine(s);
          if (!routine) {
            const stamp = nowIso();
            routine = {
              id: uid("routine"),
              name: "Untitled routine",
              clips: [],
              createdAt: stamp,
              updatedAt: stamp,
            };
          }
          const startSec = routine.clips.reduce(
            (acc, c) => Math.max(acc, c.startSec + c.durationSec),
            0,
          );
          const clip: TimelineClip = {
            id: uid("clip"),
            movementId,
            startSec,
            durationSec: Math.max(0.5, m.durationSec || 2),
            playbackRate: 1,
          };
          const next: Routine = {
            ...routine,
            clips: [...routine.clips, clip],
            updatedAt: nowIso(),
          };
          const routines = s.routines.some((r) => r.id === next.id)
            ? s.routines.map((r) => (r.id === next.id ? next : r))
            : [next, ...s.routines];
          return { routines, activeRoutineId: next.id };
        });
      },
      removeClip: (clipId) =>
        set((s) => {
          const routine = activeRoutine(s);
          if (!routine) return s;
          const clips = routine.clips.filter((c) => c.id !== clipId);
          let t = 0;
          const reflow = clips.map((c) => {
            const next = { ...c, startSec: t };
            t += c.durationSec;
            return next;
          });
          const next = { ...routine, clips: reflow, updatedAt: nowIso() };
          return { routines: s.routines.map((r) => (r.id === next.id ? next : r)) };
        }),
      reorderClips: (from, to) =>
        set((s) => {
          const routine = activeRoutine(s);
          if (!routine) return s;
          const clips = [...routine.clips];
          if (from < 0 || to < 0 || from >= clips.length || to >= clips.length) return s;
          const [item] = clips.splice(from, 1);
          clips.splice(to, 0, item!);
          let t = 0;
          const reflow = clips.map((c) => {
            const next = { ...c, startSec: t };
            t += c.durationSec;
            return next;
          });
          const next = { ...routine, clips: reflow, updatedAt: nowIso() };
          return { routines: s.routines.map((r) => (r.id === next.id ? next : r)) };
        }),
      updateClip: (clipId, patch) =>
        set((s) => {
          const routine = activeRoutine(s);
          if (!routine) return s;
          const clips = routine.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c));
          let t = 0;
          const reflow = clips.map((c) => {
            const next = { ...c, startSec: t, durationSec: Math.max(0.25, c.durationSec) };
            t += next.durationSec;
            return next;
          });
          const next = { ...routine, clips: reflow, updatedAt: nowIso() };
          return { routines: s.routines.map((r) => (r.id === next.id ? next : r)) };
        }),
      attachMusic: async (blob, name) => {
        const routine = activeRoutine(get());
        if (!routine) return;
        const blobId = uid("audio");
        await putMediaBlob(blobId, blob);
        const objectUrl = URL.createObjectURL(blob);
        const next = {
          ...routine,
          musicBlobId: blobId,
          musicObjectUrl: objectUrl,
          musicName: name,
          updatedAt: nowIso(),
        };
        set((s) => ({
          routines: s.routines.map((r) => (r.id === next.id ? next : r)),
        }));
      },

      profile: {
        displayName: "Your name",
        username: "bboy",
        bio: "Break · footwork · freezes. Building my movement library.",
        styles: ["Breaking", "Freestyle"],
        signatureMoveIds: [],
      },
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      submissions: [],
      addSubmission: (payload) =>
        set((s) => ({
          submissions: [
            {
              ...payload,
              id: uid("sub"),
              createdAt: nowIso(),
            },
            ...s.submissions,
          ],
        })),
    }),
    {
      name: "the-moves-like-v2",
      partialize: (s) => ({
        screen: s.screen,
        movements: s.movements.map((m) => ({
          ...m,
          videoObjectUrl: undefined,
        })),
        routines: s.routines.map((r) => ({
          ...r,
          musicObjectUrl: undefined,
        })),
        activeRoutineId: s.activeRoutineId,
        profile: s.profile,
        submissions: s.submissions.map((x) => ({ ...x, videoObjectUrl: undefined })),
      }),
    },
  ),
);

export { SAMPLE_CHALLENGES };

export function createEmptyMovement(partial?: Partial<Movement>): Movement {
  const stamp = nowIso();
  const id = partial?.id ?? uid("move");
  return {
    id,
    name: partial?.name ?? "Untitled move",
    category: partial?.category ?? "other",
    tags: partial?.tags ?? [],
    notes: partial?.notes ?? "",
    difficulty: partial?.difficulty,
    techniqueNotes: partial?.techniqueNotes ?? "",
    durationSec: partial?.durationSec ?? 0,
    favorite: partial?.favorite ?? false,
    source: "user",
    createdAt: partial?.createdAt ?? stamp,
    updatedAt: stamp,
    videoBlobId: partial?.videoBlobId,
    videoObjectUrl: partial?.videoObjectUrl,
    videoUrl: partial?.videoUrl,
    thumbnailDataUrl: partial?.thumbnailDataUrl,
  };
}
