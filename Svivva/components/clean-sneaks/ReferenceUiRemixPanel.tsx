"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  extractPalette,
  fileToDownscaledBase64,
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
import type { Baloon8ColorwayId } from "@/lib/clean-sneaks/sneaker-catalog";
import { KLEAN_DISCOVER_PERFECT_UI } from "@/lib/clean-sneaks/game-copy";

type SealStatus =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "sealed"; hash: string }
  | { kind: "queued"; reason: "auth_required" | "network" }
  | { kind: "error"; message: string };

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
  const [autoPatent, setAutoPatent] = useState(true);
  const [status, setStatus] = useState<SealStatus>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  /** Stash media so switching UI options can re-seal with the same reference bytes */
  const mediaRef = useRef<{
    imageBase64?: string;
    mimeType?: string;
    fileName?: string;
  }>({});

  const sealTheme = useCallback(
    async (next: KleanReferenceUiTheme) => {
      if (!autoPatent) {
        setStatus({ kind: "idle" });
        return;
      }
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

  const applyRemix = useCallback(async () => {
    const text = referenceText.trim();
    if (!text && !file) {
      setStatus({ kind: "error", message: "Add a text/URL reference or upload an image." });
      return;
    }

    setBusy(true);
    setStatus({ kind: "working", step: "Reading reference…" });
    try {
      let palette = paletteFromTextReference(text || file?.name || "klean remix");
      let contentHash = "";
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      let fileName: string | undefined;

      if (file) {
        setStatus({ kind: "working", step: "Sampling exact palette…" });
        const buf = await file.arrayBuffer();
        contentHash = await sha256Hex(buf);
        palette = await extractPalette(file);
        imageBase64 = await fileToDownscaledBase64(file);
        mimeType = file.type || "image/png";
        fileName = file.name;
      } else {
        contentHash = await sha256Text(
          JSON.stringify({ referenceText: text, kind: "klean-ui-reference" }),
        );
      }

      mediaRef.current = { imageBase64, mimeType, fileName };

      setStatus({ kind: "working", step: "Matching UI options…" });
      const next = buildReferenceUiTheme({
        referenceText: text || fileName || "Uploaded reference",
        palette,
        contentHash,
        fileName,
      });
      writeSavedReferenceUiTheme(next);
      onThemeApplied(next);
      onColorwayHint?.(next.nearestColorwayId);
      await sealTheme(next);
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Remix failed",
      });
    } finally {
      setBusy(false);
    }
  }, [file, onColorwayHint, onThemeApplied, referenceText, sealTheme]);

  const pickUiOption = useCallback(
    async (optionId: string) => {
      if (!theme) return;
      setBusy(true);
      try {
        const next = retargetUiOption(theme, optionId);
        writeSavedReferenceUiTheme(next);
        onThemeApplied(next);
        onColorwayHint?.(next.nearestColorwayId);
        await sealTheme(next);
      } finally {
        setBusy(false);
      }
    },
    [onColorwayHint, onThemeApplied, sealTheme, theme],
  );

  const clearRemix = useCallback(() => {
    clearSavedReferenceUiTheme();
    setFile(null);
    setReferenceText("");
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
            Import a reference — colors come out exact; chrome strategically reshapes across{" "}
            {KLEAN_UI_OPTIONS.length} UI options.
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

      <div className="space-y-1.5">
        <Label htmlFor="klean-ref-text" className="text-[10px] text-white/55">
          Text or URL reference
        </Label>
        <Textarea
          id="klean-ref-text"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="e.g. neon tokyo night rain, court docket seal, vapor pastel lookbook"
          className="min-h-[64px] border-white/15 bg-black/40 text-xs text-white placeholder:text-white/30"
          data-testid="input-reference-text"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="klean-ref-file" className="text-[10px] text-white/55">
          Image reference (optional)
        </Label>
        <Input
          id="klean-ref-file"
          ref={fileRef}
          type="file"
          accept="image/*"
          className="cursor-pointer border-white/15 bg-black/40 text-xs text-white file:mr-2 file:text-xs"
          data-testid="input-reference-image"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? <p className="truncate text-[10px] text-white/45">{file.name}</p> : null}
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
        onClick={() => void applyRemix()}
        className="w-full text-white"
        style={{ background: "var(--klean-accent, #5B8DA8)" }}
        data-testid="button-apply-reference-ui"
      >
        {busy
          ? status.kind === "working"
            ? status.step
            : "Working…"
          : theme
            ? "Re-discover from reference"
            : "Discover UI options"}
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
            {KLEAN_UI_OPTIONS.length} UI options · best match selected
          </p>
          <div
            className="grid max-h-[9.5rem] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3"
            role="listbox"
            aria-label="Strategic UI options"
          >
            {orderedOptions.map((opt, index) => {
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
                    {index === 0 && rank === 0 ? "" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {activeOption ? (
            <p className="text-[10px] leading-snug text-white/55" data-testid="text-active-ui-option">
              <span className="text-white/80">{activeOption.label}</span> — {activeOption.blurb}{" "}
              Colors stay exact to your reference; layout/chrome is the strategic change.
            </p>
          ) : null}
        </div>
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
