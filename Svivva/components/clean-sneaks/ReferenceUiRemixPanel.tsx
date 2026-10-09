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
  type KleanReferenceUiTheme,
  writeSavedReferenceUiTheme,
} from "@/lib/clean-sneaks/reference-ui-theme";
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
        setStatus({ kind: "working", step: "Sampling palette…" });
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

      setStatus({ kind: "working", step: "Building UI theme…" });
      const next = buildReferenceUiTheme({
        referenceText: text || fileName || "Uploaded reference",
        palette,
        contentHash,
        fileName,
      });
      writeSavedReferenceUiTheme(next);
      onThemeApplied(next);
      onColorwayHint?.(next.nearestColorwayId);

      if (!autoPatent) {
        setStatus({ kind: "idle" });
        setBusy(false);
        return;
      }

      setStatus({ kind: "working", step: "Auto-sealing with Poor Man Protection…" });
      const result = await autoSealReferenceUiTheme(next, {
        imageBase64,
        mimeType,
        fileName,
      });

      if (result.status === "sealed") {
        onThemeApplied(result.theme);
        setStatus({ kind: "sealed", hash: result.certificate.contentHash });
      } else if (result.status === "queued") {
        setStatus({ kind: "queued", reason: result.reason });
      } else {
        setStatus({ kind: "error", message: result.message });
      }
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Remix failed",
      });
    } finally {
      setBusy(false);
    }
  }, [autoPatent, file, onColorwayHint, onThemeApplied, referenceText]);

  const clearRemix = useCallback(() => {
    clearSavedReferenceUiTheme();
    setFile(null);
    setReferenceText("");
    setStatus({ kind: "idle" });
    onThemeCleared();
    if (fileRef.current) fileRef.current.value = "";
  }, [onThemeCleared]);

  return (
    <div
      className={`w-full rounded-lg border border-white/15 bg-black/55 ${compact ? "p-2.5 space-y-2" : "p-3 space-y-3"}`}
      data-testid="reference-ui-remix-panel"
      style={{
        borderColor: theme ? "color-mix(in srgb, var(--klean-accent, #5B8DA8) 55%, transparent)" : undefined,
        background: theme
          ? "color-mix(in srgb, var(--klean-bg-panel, #111) 80%, transparent)"
          : undefined,
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
            Input a reference — the game UI reshapes around it, then auto-patents the remix.
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
          placeholder="e.g. oil-slick midnight court pack, or a mood board URL note"
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
        {file ? (
          <p className="truncate text-[10px] text-white/45">{file.name}</p>
        ) : null}
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

      {theme ? (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="reference-ui-swatches">
          {theme.palette.map((s) => (
            <span
              key={`${s.role}-${s.hex}`}
              title={`${s.role} ${s.hex}`}
              className="h-4 w-4 rounded-full border border-white/25"
              style={{ background: s.hex }}
            />
          ))}
          <span className="text-[10px] text-white/50">→ {theme.nearestColorwayId}</span>
        </div>
      ) : null}

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
            ? "Re-apply reference UI"
            : "Apply reference UI"}
      </Button>

      {status.kind === "sealed" ? (
        <p className="text-[11px] text-emerald-300/90" data-testid="text-reference-ui-sealed">
          Sealed automatically.{" "}
          <Link
            href="/dashboard/poor-man-protection"
            className="underline underline-offset-2"
          >
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
