"use client";

import {
  TmlButton,
  TmlInput,
  TmlLabel,
  TmlPanel,
  TmlTextarea,
} from "@/components/the-moves-like/ui/tml";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import { MOVE_CATEGORIES } from "@/lib/the-moves-like/types";

export function ProfileScreen() {
  const profile = useMovesLikeStore((s) => s.profile);
  const setProfile = useMovesLikeStore((s) => s.setProfile);
  const movements = useMovesLikeStore((s) => s.movements);
  const routines = useMovesLikeStore((s) => s.routines);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  const userMoves = movements.filter((m) => m.source === "user");
  const favorites = movements.filter((m) => m.favorite);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D91B3]">Profile</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Dancer portfolio</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Creative identity, not a generic social profile. Data stays local until auth + cloud storage
        ship.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[160px_1fr]">
        <TmlPanel className="flex aspect-square items-center justify-center bg-[linear-gradient(160deg,rgba(255,255,255,0.4)_0%,rgba(109,145,179,0.1)_100%)] text-4xl font-black text-[#6D91B3]">
          {(profile.displayName || "?").slice(0, 1).toUpperCase()}
        </TmlPanel>
        <TmlPanel className="space-y-3 p-4">
          <div>
            <TmlLabel className="mb-1">Display name</TmlLabel>
            <TmlInput
              value={profile.displayName}
              onChange={(e) => setProfile({ displayName: e.target.value })}
            />
          </div>
          <div>
            <TmlLabel className="mb-1">Username</TmlLabel>
            <TmlInput
              value={profile.username}
              onChange={(e) =>
                setProfile({ username: e.target.value.replace(/\s+/g, "").toLowerCase() })
              }
            />
          </div>
          <div>
            <TmlLabel className="mb-1">Styles (comma separated)</TmlLabel>
            <TmlInput
              value={profile.styles.join(", ")}
              onChange={(e) =>
                setProfile({
                  styles: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <TmlLabel className="mb-1">Bio</TmlLabel>
            <TmlTextarea
              value={profile.bio}
              onChange={(e) => setProfile({ bio: e.target.value })}
            />
          </div>
        </TmlPanel>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <TmlPanel className="p-4">
          <TmlLabel>Your moves</TmlLabel>
          <p className="mt-2 text-3xl font-black text-[#6D91B3]">{userMoves.length}</p>
        </TmlPanel>
        <TmlPanel className="p-4">
          <TmlLabel>Routines</TmlLabel>
          <p className="mt-2 text-3xl font-black text-[#6D91B3]">{routines.length}</p>
        </TmlPanel>
        <TmlPanel className="p-4">
          <TmlLabel>Favorites</TmlLabel>
          <p className="mt-2 text-3xl font-black text-[#AC81AF]">{favorites.length}</p>
        </TmlPanel>
      </div>

      <TmlPanel className="mt-6 p-4">
        <div className="flex items-center justify-between gap-2">
          <TmlLabel>Signature movements</TmlLabel>
          <TmlButton
            type="button"
            variant="ghost"
            className="min-h-8 text-xs"
            onClick={() => setScreen("moves")}
          >
            Open library
          </TmlButton>
        </div>
        {!favorites.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Star moves in your library to feature them here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {favorites.slice(0, 8).map((m) => (
              <li
                key={m.id}
                className="tml-glass flex items-center justify-between px-3 py-2"
              >
                <span className="font-semibold">{m.name}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {MOVE_CATEGORIES.find((c) => c.id === m.category)?.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TmlPanel>

      <TmlPanel className="mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <TmlLabel>Saved routines</TmlLabel>
          <TmlButton
            type="button"
            variant="ghost"
            className="min-h-8 text-xs"
            onClick={() => setScreen("studio")}
          >
            Open Studio
          </TmlButton>
        </div>
        {!routines.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Build a set in Studio to showcase it here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {routines.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/55 px-3 py-2">
                <p className="font-semibold">{r.name}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {r.clips.length} clips · private (local)
                </p>
              </li>
            ))}
          </ul>
        )}
      </TmlPanel>
    </div>
  );
}
