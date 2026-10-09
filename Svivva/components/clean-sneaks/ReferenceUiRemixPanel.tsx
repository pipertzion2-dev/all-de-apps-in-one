"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  isMediaReferenceFile,
  sampleMediaReference,
  sha256Hex,
  sha256Text,
} from "@/lib/poor-man-protection/client-media";
import { autoSealReferenceUiTheme } from "@/lib/clean-sneaks/auto-seal-ui-theme";
import {
  buildReferenceUiTheme,
  clearSavedReferenceUiTheme,
  paletteFromTextReference,
  retargetUiOption,
  type KleanReferenceUiTheme,
  writeSavedReferenceUiTheme,
} from "@/lib/clean-sneaks/reference-ui-theme";
import { getUiOption, KLEAN_UI_OPTIONS } from "@/lib/clean-sneaks/ui-options-catalog";
import {
  deleteSavedGameUi,
  listSavedGameUis,
  saveGameUi,
  type SavedGameUi,
} from "@/lib/clean-sneaks/saved-game-ui";
import type { Baloon8ColorwayId } from "@/lib/clean-sneaks/sneaker-catalog";
import { KLEAN_DISCOVER_PERFECT_UI } from "@/lib/clean-sneaks/game-copy";

type SealStatus =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "sealed"; hash: string }
  | { kind: "queued"; reason: "auth_required" | "network" }
  | { kind: "error"; message: string }
  | { kind: "saved"; title: string };

type Props = {
  theme: KleanReferenceUiTheme | null;
  onThemeApplied: (theme: KleanReferenceUiTheme) => void;
  onThemeCleared: () => void;
  onColorwayHint?: (id: Baloon8ColorwayId) => void;
  compact?: boolean;
};

export function ReferenceUiRemixPanel({
  theme,
  onThemeApplied,
  onThemeCleared,
  onColorwayHint,
  compact = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [referenceText, setReferenceText] = useState(theme?.referenceText ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [autoPatent, setAutoPatent] = useState(true);
  const [saveTitle, setSaveTitle] = useState("");
  const [library, setLibrary] = useState<SavedGameUi[]>([]);
  const [status, setStatus] = useState<SealStatus>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<{
    imageBase64?: string;
    mimeType?: string;
    fileName?: string;
    mediaKind?: "image" | "video" | "text";
  }>({});

  const refreshLibrary = useCallback(() => {
    setLibrary(listSavedGameUis());
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const takeFile = useCallback((next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (!isMediaReferenceFile(next)) {
      setStatus({ kind: "error", message: "Drop an image or video (mp4, webm, png, jpg…)." });
      return;
    }
    setFile(next);
    setStatus({ kind: "idle" });
  }, []);

  const sealTheme = useCallback(
    async (next: KleanReferenceUiTheme) => {
      if (!autoPatent) return;
      setStatus({ kind: "working", step: "Auto-sealing with Poor Man Protection…" });
      const result = await autoSealReferenceUiTheme(next, mediaRef.current);
      if (result.status === "sealed") {
        onThemeApplied(result.theme);
        setStatus({ kind: "sealed", hash: result.certificate.contentHash });
      } else if (result.status === "queued") {
        setStatus({ kind: "queued", reason: result.reason });
      } else {
        setStatus({ kind: "error", message: result.message });
      }
    },
    [autoPatent, onThemeApplied],
  );

  const createGameUi = useCallback(async () => {
    const text = referenceText.trim();
    if (!text && !file) {
      setStatus({
        kind: "error",
        message: "Add an image or video — and optional text — then create your game UI.",
      });
      return;
    }

    setBusy(true);
    setStatus({ kind: "working", step: "Reading your reference…" });
    try {
      let palette = paletteFromTextReference(text || file?.name || "klean remix");
      let contentHash = "";
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      let fileName: string | undefined;
      let mediaKind: "image" | "video" | "text" = "text";

      if (file) {
        setStatus({
          kind: "working",
          step: file.type.startsWith("video/")
            ? "Sampling video frames…"
            : "Sampling exact palette…",
        });
        const buf = await file.arrayBuffer();
        contentHash = await sha256Hex(buf);
        const sampled = await sampleMediaReference(file);
        palette = sampled.palette;
        imageBase64 = sampled.imageBase64;
        mimeType = sampled.mimeType;
        fileName = file.name;
        mediaKind = sampled.kind;
      } else {
        contentHash = await sha256Text(
          JSON.stringify({ referenceText: text, kind: "klean-ui-reference" }),
        );
      }

      mediaRef.current = { imageBase64, mimeType, fileName, mediaKind };

      setStatus({ kind: "working", step: "Building your game UI…" });
      const next = buildReferenceUiTheme({
        referenceText: text || fileName || "My reference",
        palette,
        contentHash,
        fileName,
      });
      writeSavedReferenceUiTheme(next);
      onThemeApplied(next);
      onColorwayHint?.(next.nearestColorwayId);
      setSaveTitle(next.name.slice(0, 80));
      await sealTheme(next);
      if (!autoPatent) setStatus({ kind: "idle" });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not create game UI",
      });
    } finally {
      setBusy(false);
    }
  }, [autoPatent, file, onColorwayHint, onThemeApplied, referenceText, sealTheme]);

  const pickUiOption = useCallback(
    async (optionId: string) => {
      if (!theme) return;
      setBusy(true);
      try {
        const next = retargetUiOption(theme, optionId);
        writeSavedReferenceUiTheme(next);
        onThemeApplied(next);
        onColorwayHint?.(next.nearestColorwayId);
        setSaveTitle(next.name.slice(0, 80));
        await sealTheme(next);
        if (!autoPatent) setStatus({ kind: "idle" });
      } finally {
        setBusy(false);
      }
    },
    [autoPatent, onColorwayHint, onThemeApplied, sealTheme, theme],
  );

  const handleSave = useCallback(() => {
    if (!theme) {
      setStatus({ kind: "error", message: "Create a game UI first, then save it." });
      return;
    }
    const entry = saveGameUi({
      theme,
      title: saveTitle.trim() || theme.name,
      thumbBase64: mediaRef.current.imageBase64,
      mediaKind: mediaRef.current.mediaKind,
    });
    refreshLibrary();
    setStatus({ kind: "saved", title: entry.title });
  }, [refreshLibrary, saveTitle, theme]);

  const handleLoad = useCallback(
    (entry: SavedGameUi) => {
      writeSavedReferenceUiTheme(entry.theme);
      onThemeApplied(entry.theme);
      onColorwayHint?.(entry.theme.nearestColorwayId);
      setReferenceText(entry.theme.referenceText);
      setSaveTitle(entry.title);
      setStatus({ kind: "idle" });
    },
    [onColorwayHint, onThemeApplied],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteSavedGameUi(id);
      refreshLibrary();
    },
    [refreshLibrary],
  );

  const clearRemix = useCallback(() => {
    clearSavedReferenceUiTheme();
    setFile(null);
    setReferenceText("");
    setSaveTitle("");
    setStatus({ kind: "idle" });
    mediaRef.current = {};
    onThemeCleared();
    if (fileRef.current) fileRef.current.value = "";
  }, [onThemeCleared]);

  const activeOption = theme ? getUiOption(theme.uiOptionId) : null;
  const rankedIds = theme?.rankedUiOptions?.map((r) => r.id) ?? [];
  const orderedOptions = [
    ...rankedIds.map((id) => getUiOption(id)),
    ...KLEAN_UI_OPTIONS.filter((o) => !rankedIds.includes(o.id)),
  ];

  return (
    <div
      className={`w-full rounded-lg border border-white/15 bg-black/55 ${compact ? "p-2.5 space-y-2" : "p-3 space-y-3"}`}
      data-testid="reference-ui-remix-panel"
      data-klean-ui-option={theme?.uiOptionId}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      style={{
        borderColor: theme
          ? "color-mix(in srgb, var(--klean-accent, #5B8DA8) 55%, transparent)"
          : undefined,
        background: theme
          ? "color-mix(in srgb, var(--klean-bg-panel, #111) 80%, transparent)"
          : undefined,
        borderRadius: theme ? "var(--klean-radius, 14px)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`uppercase tracking-[0.25em] ${compact ? "text-[9px]" : "text-[10px]"}`}
            style={{ color: "var(--klean-accent, #5B8DA8)" }}
          >
            {KLEAN_DISCOVER_PERFECT_UI}
          </p>
          <p className={`text-white/70 ${compact ? "text-[10px]" : "text-xs"}`}>
            Drop an image or video, add a short note, create your game UI — then save it.
          </p>
        </div>
        {theme ? (
          <button
            type="button"
            onClick={clearRemix}
            className="shrink-0 text-[10px] uppercase tracking-wider text-white/45 hover:text-white/80"
            data-testid="button-clear-reference-ui"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        data-testid="dropzone-reference-media"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) takeFile(dropped);
        }}
        className={`relative flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-dashed px-3 py-4 text-center transition ${
          dragOver
            ? "border-[var(--klean-accent,#5B8DA8)] bg-white/10"
            : "border-white/25 bg-black/35 hover:border-white/45"
        }`}
      >
        {previewUrl && file ? (
          file.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          )
        ) : null}
        <p className="relative z-[1] text-xs font-semibold text-white">
          {file ? file.name : "Drop image or video here"}
        </p>
        <p className="relative z-[1] text-[10px] text-white/55">
          {file
            ? "Tap to replace · mp4, webm, png, jpg, webp"
            : "or tap to choose · mp4 / webm / png / jpg"}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.png,.jpg,.jpeg,.webp,.gif"
          className="hidden"
          data-testid="input-reference-media"
          onChange={(e) => takeFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="klean-ref-text" className="text-[10px] text-white/55">
          Text with it (optional)
        </Label>
        <Textarea
          id="klean-ref-text"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="e.g. neon tokyo night rain — vibe notes for your UI"
          className="min-h-[52px] border-white/15 bg-black/40 text-xs text-white placeholder:text-white/30"
          data-testid="input-reference-text"
        />
      </div>

      <label className="flex items-center gap-2 text-[11px] text-white/70">
        <input
          type="checkbox"
          checked={autoPatent}
          onChange={(e) => setAutoPatent(e.target.checked)}
          className="rounded border-white/30"
          data-testid="checkbox-auto-patent"
        />
        Automatically patent this UI with Poor Man Protection
      </label>

      <Button
        type="button"
        disabled={busy}
        onClick={() => void createGameUi()}
        className="w-full text-white"
        style={{ background: "var(--klean-accent, #5B8DA8)" }}
        data-testid="button-apply-reference-ui"
      >
        {busy
          ? status.kind === "working"
            ? status.step
            : "Working…"
          : theme
            ? "Recreate my game UI"
            : "Create my game UI"}
      </Button>

      {theme ? (
        <div className="space-y-2" data-testid="reference-ui-options">
          <div className="flex flex-wrap items-center gap-1.5" data-testid="reference-ui-swatches">
            {theme.palette.map((s) => (
              <span
                key={`${s.role}-${s.hex}`}
                title={`${s.role} ${s.hex}`}
                className="h-4 w-4 rounded-full border border-white/25"
                style={{ background: s.hex }}
              />
            ))}
            <span className="text-[10px] text-white/50">
              exact palette · {theme.nearestColorwayId}
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            {KLEAN_UI_OPTIONS.length} UI options · tap to reshape chrome
          </p>
          <div
            className="grid max-h-[9.5rem] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3"
            role="listbox"
            aria-label="Strategic UI options"
          >
            {orderedOptions.map((opt) => {
              const selected = theme.uiOptionId === opt.id;
              const rank = theme.rankedUiOptions.findIndex((r) => r.id === opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={busy}
                  title={opt.blurb}
                  onClick={() => void pickUiOption(opt.id)}
                  className={`rounded-md border px-2 py-1.5 text-left transition ${
                    selected
                      ? "border-[var(--klean-accent,#7EC8D9)] bg-white/10 text-white"
                      : "border-white/15 bg-black/35 text-white/70 hover:border-white/35"
                  }`}
                  data-testid={`ui-option-${opt.id}`}
                  style={
                    selected
                      ? {
                          boxShadow:
                            activeOption?.chrome === "glow"
                              ? `0 0 12px ${theme.colors.accent}66`
                              : undefined,
                          borderRadius: "var(--klean-radius, 8px)",
                        }
                      : undefined
                  }
                >
                  <span className="block text-[10px] font-semibold leading-tight">{opt.label}</span>
                  <span className="mt-0.5 block text-[9px] leading-snug text-white/45">
                    {rank === 0 ? "Best match · " : rank > 0 ? `#${rank + 1} · ` : ""}
                    {opt.hudPlacement}
                  </span>
                </button>
              );
            })}
          </div>
          {activeOption ? (
            <p
              className="text-[10px] leading-snug text-white/55"
              data-testid="text-active-ui-option"
            >
              <span className="text-white/80">{activeOption.label}</span> — {activeOption.blurb}
            </p>
          ) : null}

          <div
            className="space-y-1.5 rounded-md border border-white/15 bg-black/40 p-2"
            data-testid="save-game-ui-box"
          >
            <Label htmlFor="klean-save-title" className="text-[10px] text-white/55">
              Save this game UI
            </Label>
            <div className="flex gap-2">
              <Input
                id="klean-save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Name your UI"
                className="h-8 border-white/15 bg-black/40 text-xs text-white"
                data-testid="input-save-game-ui-title"
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0 text-white"
                style={{ background: "var(--klean-accent, #5B8DA8)" }}
                onClick={handleSave}
                data-testid="button-save-game-ui"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {library.length > 0 ? (
        <div className="space-y-1.5" data-testid="saved-game-ui-library">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Saved game UIs ({library.length})
          </p>
          <ul className="max-h-36 space-y-1 overflow-y-auto">
            {library.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-2 py-1.5"
              >
                {entry.thumbBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/jpeg;base64,${entry.thumbBase64}`}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span
                    className="h-8 w-8 shrink-0 rounded"
                    style={{ background: entry.theme.colors.accent }}
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-white">{entry.title}</p>
                  <p className="truncate text-[9px] text-white/45">
                    {getUiOption(entry.theme.uiOptionId).label}
                    {entry.mediaKind ? ` · ${entry.mediaKind}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 border-white/20 px-2 text-[10px] text-white"
                  onClick={() => handleLoad(entry)}
                  data-testid={`button-load-game-ui-${entry.id}`}
                >
                  Load
                </Button>
                <button
                  type="button"
                  className="text-[10px] text-white/40 hover:text-red-300"
                  onClick={() => handleDelete(entry.id)}
                  data-testid={`button-delete-game-ui-${entry.id}`}
                  aria-label={`Delete ${entry.title}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status.kind === "saved" ? (
        <p className="text-[11px] text-emerald-300/90" data-testid="text-game-ui-saved">
          Saved “{status.title}” — load it anytime from your library below.
        </p>
      ) : null}

      {status.kind === "sealed" ? (
        <p className="text-[11px] text-emerald-300/90" data-testid="text-reference-ui-sealed">
          Sealed automatically.{" "}
          <Link href="/dashboard/poor-man-protection" className="underline underline-offset-2">
            Open Poor Man Protection
          </Link>{" "}
          <span className="text-white/40">({status.hash.slice(0, 12)}…)</span>
        </p>
      ) : null}

      {status.kind === "queued" ? (
        <p className="text-[11px] text-amber-200/90" data-testid="text-reference-ui-queued">
          UI applied. Sign in to finish the automatic patent — your remix is queued.{" "}
          <Link href="/login?redirect=/clean-sneaks" className="underline underline-offset-2">
            Sign in
          </Link>
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p className="text-[11px] text-red-300/90" data-testid="text-reference-ui-error">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
