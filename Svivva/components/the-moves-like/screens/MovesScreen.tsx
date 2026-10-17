"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TmlButton,
  TmlInput,
  TmlLabel,
  TmlPanel,
  TmlSelect,
} from "@/components/the-moves-like/ui/tml";
import { getMediaBlob } from "@/lib/the-moves-like/media-store";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import { MOVE_CATEGORIES, type MoveCategory, type Movement } from "@/lib/the-moves-like/types";
import { cn } from "@/lib/utils";

export function MovesScreen() {
  const movements = useMovesLikeStore((s) => s.movements);
  const toggleFavorite = useMovesLikeStore((s) => s.toggleFavorite);
  const deleteMovement = useMovesLikeStore((s) => s.deleteMovement);
  const upsertMovement = useMovesLikeStore((s) => s.upsertMovement);
  const addClipFromMovement = useMovesLikeStore((s) => s.addClipFromMovement);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<MoveCategory | "all">("all");
  const [sort, setSort] = useState<"newest" | "name" | "favorites">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...movements];
    if (category !== "all") list = list.filter((m) => m.category === category);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.tags.some((t) => t.toLowerCase().includes(needle)) ||
          m.notes.toLowerCase().includes(needle),
      );
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "favorites") list.sort((a, b) => Number(b.favorite) - Number(a.favorite));
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [movements, q, category, sort]);

  const active = movements.find((m) => m.id === activeId) ?? null;

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    (async () => {
      if (!active) {
        setPlayUrl(null);
        return;
      }
      if (active.videoObjectUrl) {
        setPlayUrl(active.videoObjectUrl);
        return;
      }
      if (active.videoBlobId) {
        try {
          const blob = await getMediaBlob(active.videoBlobId);
          if (cancelled) return;
          if (blob) {
            const url = URL.createObjectURL(blob);
            revoked = url;
            setPlayUrl(url);
            upsertMovement({ ...active, videoObjectUrl: url });
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setPlayUrl(active.videoUrl ?? null);
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D91B3]">Moves</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Movement library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every movement is a reusable creative asset. Sample rows are labeled — your saves
            persist locally.
          </p>
        </div>
        <TmlButton type="button" onClick={() => setScreen("train")}>
          Capture new move
        </TmlButton>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TmlInput
          className="max-w-xs"
          placeholder="Search name, tags, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <TmlSelect
          className="max-w-[10rem]"
          value={category}
          onChange={(e) => setCategory(e.target.value as MoveCategory | "all")}
        >
          <option value="all">All categories</option>
          {MOVE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </TmlSelect>
        <TmlSelect
          className="max-w-[10rem]"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="favorites">Favorites</option>
        </TmlSelect>
        <div className="ml-auto flex gap-1">
          <TmlButton
            type="button"
            variant={view === "grid" ? "primary" : "secondary"}
            className="min-h-9 px-3"
            onClick={() => setView("grid")}
          >
            Grid
          </TmlButton>
          <TmlButton
            type="button"
            variant={view === "list" ? "primary" : "secondary"}
            className="min-h-9 px-3"
            onClick={() => setView("list")}
          >
            List
          </TmlButton>
        </div>
      </div>

      {!filtered.length ? (
        <TmlPanel className="mt-8 p-8 text-center">
          <p className="text-lg font-semibold">No movements yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Head to Train, upload a clip, and save your first move.
          </p>
          <TmlButton type="button" className="mt-4" onClick={() => setScreen("train")}>
            Open Train
          </TmlButton>
        </TmlPanel>
      ) : (
        <ul
          className={cn(
            "mt-6 gap-3",
            view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col",
          )}
        >
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActiveId(m.id)}
                className={cn(
                  "tml-glass w-full p-3 text-left transition hover:border-[#6D91B3]/45",
                  activeId === m.id && "border-[#6D91B3]/55 tml-glass-teal",
                  view === "list" && "flex items-center gap-4",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-xl bg-white/40",
                    view === "grid" ? "aspect-video" : "h-16 w-28 shrink-0",
                  )}
                >
                  {m.thumbnailDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {m.source === "sample" ? "Sample" : "No thumb"}
                    </div>
                  )}
                </div>
                <div className="mt-2 min-w-0 flex-1 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{m.name}</h3>
                    {m.favorite ? <span className="text-[#6D91B3]">★</span> : null}
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {MOVE_CATEGORIES.find((c) => c.id === m.category)?.label} ·{" "}
                    {m.durationSec ? `${m.durationSec.toFixed(1)}s` : "—"} · {m.source}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {active ? (
        <MovementDetail
          movement={active}
          playUrl={playUrl}
          onClose={() => setActiveId(null)}
          onFavorite={() => toggleFavorite(active.id)}
          onDelete={() => void deleteMovement(active.id).then(() => setActiveId(null))}
          onAddToRoutine={() => {
            addClipFromMovement(active.id);
            setScreen("studio");
          }}
          onEdit={(patch) =>
            upsertMovement({ ...active, ...patch, updatedAt: new Date().toISOString() })
          }
        />
      ) : null}
    </div>
  );
}

function MovementDetail({
  movement,
  playUrl,
  onClose,
  onFavorite,
  onDelete,
  onAddToRoutine,
  onEdit,
}: {
  movement: Movement;
  playUrl: string | null;
  onClose: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onAddToRoutine: () => void;
  onEdit: (p: Partial<Movement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[rgba(15,26,28,0.35)] p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
      <TmlPanel className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/55 px-4 py-3">
          <div>
            <TmlLabel>Movement detail</TmlLabel>
            <h2 className="text-xl font-bold">{movement.name}</h2>
          </div>
          <TmlButton type="button" variant="ghost" onClick={onClose}>
            Close
          </TmlButton>
        </div>
        <div className="space-y-4 p-4">
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            {playUrl ? (
              <video src={playUrl} controls playsInline className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {movement.source === "sample"
                  ? "Sample entry — no video attached. Capture your own in Train."
                  : "No video on this movement yet."}
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <TmlLabel className="mb-1">Name</TmlLabel>
              <TmlInput
                value={movement.name}
                onChange={(e) => onEdit({ name: e.target.value })}
                disabled={movement.source === "sample"}
              />
            </div>
            <div>
              <TmlLabel className="mb-1">Category</TmlLabel>
              <TmlSelect
                value={movement.category}
                onChange={(e) => onEdit({ category: e.target.value as MoveCategory })}
                disabled={movement.source === "sample"}
              >
                {MOVE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </TmlSelect>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{movement.notes || "No notes."}</p>
          <div className="flex flex-wrap gap-2">
            <TmlButton type="button" variant="secondary" onClick={onFavorite}>
              {movement.favorite ? "Unfavorite" : "Favorite"}
            </TmlButton>
            <TmlButton type="button" onClick={onAddToRoutine}>
              Add to routine
            </TmlButton>
            {movement.source === "user" ? (
              <TmlButton type="button" variant="danger" onClick={onDelete}>
                Delete
              </TmlButton>
            ) : (
              <span className="self-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Sample content
              </span>
            )}
          </div>
        </div>
      </TmlPanel>
    </div>
  );
}
