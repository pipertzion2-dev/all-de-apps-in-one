"use client";

import { useCallback, useRef, useState } from "react";
import {
  collectMidiUploads,
  estimateUploadBytes,
  MIDI_UPLOAD_SOFT_LIMIT_BYTES,
} from "@/lib/svivva-play/midi-evolution/extract-midi-upload";
import type {
  CompositionMemory,
  GeneratedPart,
  MeendLevel,
  StylePresetId,
  TransformationReport,
} from "@/lib/svivva-play/midi-evolution/types";

// ─── Prompt presets ───────────────────────────────────────────────────────────

const FULL_ENGINE_PROMPT = `LONG-FORM MULTI-MIDI COMPOSITION EVOLUTION ENGINE

PHASE 1 — COMPOSITIONAL FORENSICS
Analyze ALL uploaded MIDI files together (not independently).
Determine: recurring motifs, rhythms, interval structures, phrase lengths, register movements, harmonic tendencies, tension/release points, bass movements, melodic contours.
Identify: PRIMARY MOTIFS · SECONDARY MOTIFS · TRANSITION MOTIFS · HIDDEN MOTIFS.
Build a full relationship map between all motifs.

PHASE 2 — MOTIF GENEALOGY
Treat motifs like family members with parent / child / transformed / fragmented / expanded / compressed variants.
Every new idea must feel descended from previous material. Never introduce unrelated material.

PHASE 3 — LONG-FORM MEMORY
The new material must acknowledge earlier motifs, intervals, phrase shapes, rhythmic identities — even when transformed across all uploaded files.

PHASE 4 — RHYTHMIC DNA
Preserve 70–90% rhythmic identity. Maintain phrase lengths, groove placement, accent locations, syncopation, call-response structures. Replace pitch memory; preserve rhythmic memory.

PHASE 5 — HARMONIC EVOLUTION
Do not transpose — reinterpret harmonic meaning emotionally.
Cm9 → AbMaj9(#11) · BbMaj7 → DbMaj9(#11) · Gm11 → BMaj9(#11) · EbMaj7 → F#m11 · AbMaj7 → Emaj13

PHASE 6 — SECTIONAL NARRATIVE (A→J)
A motif may appear in B, return transformed in D, fragment in F, appear inverted in H, resolve in J.
Create long-distance motivic relationships.

SECTION B — SHADOW PORTAL: EbmMaj9, BMaj9(#11), Db13sus, F#m11, AbMaj9(#11). Bass avoids roots.
SECTION C — FRACTURED MIRROR: Inversion. Mirror interval structures. Maintain rhythmic identity.
SECTION D — FLOATING CITY: Quartal harmony. Stacked fourths. Open voicings. Suspended colors.
SECTION E — ABYSS: mMaj9, 13(b9), #11, altered suspensions. Darkest harmonic point.
SECTION F — INDIAN HORIZON: Meend, murki, andolan, kan swar via rapid grace notes and ornamental resolutions.
SECTION G — GLASPER DIMENSION: Every chord contains 9/11/13. Rootless voicings. Upper structures. Drop-2 and drop-2&4.
SECTION H — DERRICK HODGE DIMENSION: Bass as melodic narrator using minor-third displacement, chromatic side-slipping, pedal motion.
SECTION I — COSMIC TENSION: Maximum harmonic density. Every motif simultaneously as original, inverted, fragmented, extended, hidden.
SECTION J — REVELATION: Resolve motif relationships (not harmonic clichés). Listener recognizes the journey, not the chords.

VOICING RULES: drop-2, drop-2&4, quartal, quintal, upper structure triads, polychords. At least 95% inverted — never root position.

INTERWEAVING RULE (MOST IMPORTANT): Every new section must contain traces of earlier motifs, rhythms, intervals, contour shapes, bass movements — even when transformed. Listener must feel "I've heard this before" without knowing why.

Think like: Robert Glasper · Derrick Hodge · Terrace Martin · modern cinematic jazz composers.`;

type PromptPreset = { id: string; label: string; tag: string; prompt: string; color: string };

const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "full-engine",
    label: "Full Evolution Engine",
    tag: "Complete",
    prompt: FULL_ENGINE_PROMPT,
    color: "#A05068",
  },
  {
    id: "glasper-mode",
    label: "Glasper Mode",
    tag: "Harmonic",
    prompt:
      "Generate using Robert Glasper's harmonic language: rootless voicings, upper structure triads, extended 9/11/13 chords on every beat, neo-soul pocket, minimal root movement. Bass pedals under shifting upper harmony. Every chord must contain at least a 9th. Prioritize drop-2 and drop-2&4 voicings. Think 'Black Radio' era.",
    color: "#6B5CB5",
  },
  {
    id: "indian-horizon",
    label: "Indian Horizon (Section F)",
    tag: "Ornament",
    prompt:
      "Apply Section F — Indian Horizon transformation. Ornament all melodic material with meend (pitch glides between notes), murki (rapid oscillation), andolan (slow vibrato), and kan swar (grace note approach tones). Implement as rapid grace notes and neighbor-note clusters in MIDI. Maintain original rhythmic DNA; transform pitch articulation only.",
    color: "#c06010",
  },
  {
    id: "abyss",
    label: "Abyss (Section E)",
    tag: "Dark",
    prompt:
      "Apply Section E — Abyss. Convert all major sonorities into minor-major sonorities (mMaj9). Use 13(b9) on dominant functions, #11 on all Lydian tendencies, altered suspensions. This is the darkest harmonic point — maximum tension with no resolution. Bass moves by tritone substitution only.",
    color: "#3a4a6b",
  },
  {
    id: "derrick-hodge",
    label: "Derrick Hodge Dimension (H)",
    tag: "Bass",
    prompt:
      "Apply Section H — Derrick Hodge Dimension. Bass voice becomes the melodic narrator. Upper harmony remains relatively stable. Bass uses: minor-third displacement (start phrases a minor 3rd below destination), chromatic side-slipping (approach target harmonies from a semitone above or below), pedal motion (hold pedal tones across chord changes). Bass melody should be as singable as the lead melody.",
    color: "#2d6b4a",
  },
];

type LongFormSectionId = "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

type ForensicsReport = {
  narrativeSummary: string;
  fileCount: number;
  globalRelationships: string[];
  motifsByKind: Record<string, number>;
  recurringPhraseLengths: number[];
};

type UploadedFile = { filename: string; base64: string };
type UiMode = "long-form" | "custom";
type Step = 1 | 2 | 3;

const LONG_FORM_SECTIONS: Record<LongFormSectionId, { title: string; emotion: string }> = {
  B: { title: "Shadow Portal", emotion: "First major departure" },
  C: { title: "Fractured Mirror", emotion: "Inversion & reflection" },
  D: { title: "Floating City", emotion: "Quartal suspension" },
  E: { title: "Abyss", emotion: "Darkest harmonic point" },
  F: { title: "Indian Horizon", emotion: "Meend ornamentation" },
  G: { title: "Glasper Dimension", emotion: "Extended 9/11/13" },
  H: { title: "Derrick Hodge", emotion: "Melodic bass narrator" },
  I: { title: "Cosmic Tension", emotion: "Maximum density" },
  J: { title: "Revelation", emotion: "Motif resolution" },
};

const SECTION_ORDER: LongFormSectionId[] = ["B", "C", "D", "E", "F", "G", "H", "I", "J"];

const PRESETS: { id: StylePresetId; label: string }[] = [
  { id: "glasper", label: "Robert Glasper" },
  { id: "derrick-hodge", label: "Derrick Hodge" },
  { id: "stevie-wonder", label: "Stevie Wonder" },
  { id: "indian-fusion", label: "Indian Fusion" },
  { id: "custom", label: "Custom (AI)" },
];

const MEEND_LEVELS: MeendLevel[] = ["off", "light", "medium", "heavy"];

const STEPS = [
  { n: 1 as Step, label: "Upload MIDI", hint: "Section A — your source material" },
  { n: 2 as Step, label: "Forensics", hint: "Global motif & rhythm map" },
  { n: 3 as Step, label: "Generate", hint: "Next section B–J" },
];

function downloadZip(base64: string, filename: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = { embedded?: boolean };

export default function PlayMidiEvolution({ embedded = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uiMode, setUiMode] = useState<UiMode>("long-form");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [memory, setMemory] = useState<CompositionMemory | null>(null);
  const [forensics, setForensics] = useState<ForensicsReport | null>(null);
  const [part, setPart] = useState<GeneratedPart | null>(null);
  const [report, setReport] = useState<TransformationReport | null>(null);
  const [suggestedSection, setSuggestedSection] = useState<LongFormSectionId | null>("B");
  const [selectedSection, setSelectedSection] = useState<LongFormSectionId>("B");
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<StylePresetId>("glasper");
  const [stevieSlides, setStevieSlides] = useState(false);
  const [meendLevel, setMeendLevel] = useState<MeendLevel>("off");
  const [inputBpmText, setInputBpmText] = useState("120");
  const [fileTempoMarker, setFileTempoMarker] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);

  const completedSections = memory?.completedSections ?? [];
  const step: Step = !files.length ? 1 : !memory ? 2 : 3;
  const exportFileCount =
    part?.fileOutputs && part.fileOutputs.length > 0
      ? part.fileOutputs.length
      : filenames.length > 0
        ? filenames.length
        : 1;

  const handleFiles = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    setLoading(true);
    setError(null);
    setUploadHint(null);
    try {
      const encoded = await collectMidiUploads(list);
      if (!encoded.length) {
        setError(
          "No MIDI found. Upload .mid / .midi files, or a .zip containing MIDI stems (e.g. Bass.mid, Melody.mid).",
        );
        return;
      }
      const bytes = estimateUploadBytes(encoded);
      if (bytes > MIDI_UPLOAD_SOFT_LIMIT_BYTES) {
        setUploadHint(
          `Loaded ${encoded.length} file(s) (~${(bytes / 1_000_000).toFixed(1)}MB). Large packs may fail on upload — split into smaller zips if you see errors.`,
        );
      }
      setFiles(encoded);
      setFilenames(encoded.map((f) => f.filename));
      setMemory(null);
      setForensics(null);
      setPart(null);
      setReport(null);
      setFileTempoMarker(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read upload");
    } finally {
      setLoading(false);
    }
  }, []);

  const commitTempo = useCallback((raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.max(20, Math.min(400, parsed)) : 120;
    setInputBpmText(String(next));
    setMemory((current) => {
      if (!current || current.globalBpm === next) return current;
      setForensics(null);
      setPart(null);
      setReport(null);
      return null;
    });
    return next;
  }, []);

  const tempoPayload = useCallback(
    () => ({ manualBpm: commitTempo(inputBpmText) }),
    [commitTempo, inputBpmText],
  );

  const postEvolution = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/svivva-play/midi-evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error("Upload too large for the server. Split your zip into smaller stem packs.");
      }
      throw new Error(data.error || "Request failed");
    }
    return data;
  }, []);

  const callApi = useCallback(
    async (
      action:
        | "forensics"
        | "transform"
        | "continue"
        | "generate-section"
        | "export"
        | "export-suite",
      extra?: { sectionId?: LongFormSectionId },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const body: Record<string, unknown> = {
          action,
          prompt,
          preset,
          stevieSlides,
          meendLevel,
          memory: memory ?? undefined,
          lastPart: part ?? undefined,
          sourceFilename: filenames[0],
          appendAfterLast: true,
          files,
          ...tempoPayload(),
        };
        if (extra?.sectionId) body.sectionId = extra.sectionId;

        const data = await postEvolution(body);
        if (data.memory) {
          setMemory(data.memory);
          if (data.memory.detectedBpm != null) setFileTempoMarker(data.memory.detectedBpm);
        }
        if (data.forensics) setForensics(data.forensics);
        if (data.part) setPart(data.part);
        if (data.report) setReport(data.report);
        if (data.suggestedSection) setSuggestedSection(data.suggestedSection);
        if (action === "export" && data.zipBase64) {
          const secLabel = part?.sectionId
            ? `Sec-${part.sectionId}`
            : (part?.label?.replace(/[^a-zA-Z0-9-]/g, "-") ?? "evolved");
          const bpmLabel = memory ? `_${memory.globalBpm}bpm` : "";
          downloadZip(data.zipBase64, `svivva-evolution_${secLabel}${bpmLabel}.zip`);
        } else if (action === "export-suite" && data.zipBase64) {
          const bpmLabel = data.memory?.globalBpm ? `_${data.memory.globalBpm}bpm` : "";
          downloadZip(data.zipBase64, `svivva-glasper-suite_9-versions${bpmLabel}.zip`);
        }
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      files,
      filenames,
      memory,
      meendLevel,
      part,
      postEvolution,
      preset,
      prompt,
      stevieSlides,
      tempoPayload,
    ],
  );

  const runForensics = () => void callApi("forensics");

  const generateSection = async (sectionId: LongFormSectionId) => {
    setLoading(true);
    setError(null);
    try {
      let mem = memory;
      if (!mem && files.length) {
        const analyzed = await postEvolution({
          action: "forensics",
          files,
          prompt,
          preset,
          stevieSlides,
          meendLevel,
          sourceFilename: filenames[0],
          ...tempoPayload(),
        });
        if (analyzed?.memory) {
          mem = analyzed.memory;
          setMemory(analyzed.memory);
          if (analyzed.memory.detectedBpm != null) setFileTempoMarker(analyzed.memory.detectedBpm);
          setForensics(analyzed.forensics ?? null);
          setSuggestedSection(analyzed.suggestedSection ?? sectionId);
        }
      }
      if (!mem) throw new Error("Upload MIDI files first.");

      const data = await postEvolution({
        action: "generate-section",
        sectionId,
        files,
        memory: mem,
        lastPart: part ?? undefined,
        prompt,
        preset,
        stevieSlides,
        meendLevel,
        sourceFilename: filenames[0],
        appendAfterLast: true,
        ...tempoPayload(),
      });
      if (data?.memory) {
        setMemory(data.memory);
        if (data.memory.detectedBpm != null) setFileTempoMarker(data.memory.detectedBpm);
      }
      if (data?.part) setPart(data.part);
      if (data?.report) setReport(data.report);
      if (data?.suggestedSection) setSuggestedSection(data.suggestedSection);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const shell = embedded
    ? "px-4 sm:px-5 py-5 sm:py-6 space-y-5 bg-transparent text-[#e8e4f0]"
    : "rounded-2xl border border-white/10 bg-[#0e0c16] px-4 sm:px-6 py-8 space-y-6 text-[#e8e4f0]";

  return (
    <div className={shell} data-testid="midi-evolution-engine">
      {!embedded && (
        <div>
          <h2 className="text-xl font-bold text-white/90">MIDI Evolution Engine</h2>
          <p className="text-sm text-white/45 mt-1">
            Long-form composition evolution — velocity & phrasing preserved, pitches reharmonized.
          </p>
        </div>
      )}

      {/* Step indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`rounded-lg border px-3 py-2.5 ${
              step >= s.n ? "border-[#A05068]/40 bg-[#A05068]/8" : "border-white/10 bg-white/4"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                step >= s.n ? "text-[#A05068]" : "text-white/30"
              }`}
            >
              Step {s.n}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-white/80 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-white/40 hidden sm:block">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div
        className="rounded-lg border-2 border-dashed border-white/15 bg-white/4 p-4 sm:p-5 cursor-pointer hover:border-[#A05068]/50 hover:bg-[#A05068]/5 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mid,.midi,.zip,audio/midi,application/zip"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <p className="text-sm font-medium text-white/80">
          {filenames.length
            ? `${filenames.length} MIDI file(s) loaded`
            : "Drop or click to upload MIDI or a .zip stem pack"}
        </p>
        <p className="text-xs text-white/40 mt-1">
          .mid / .midi files or a .zip with multiple stems — analyzed together as one composition.
        </p>
        {uploadHint && <p className="text-xs text-amber-400 mt-2">{uploadHint}</p>}
        {filenames.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {filenames.map((n) => (
              <li
                key={n}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 border border-white/10 text-white/55"
              >
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tempo — always user input; MIDI notes parsed in seconds from file */}
      <div className="rounded-lg border border-white/10 bg-white/4 p-3 sm:p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Project tempo (required)
          </p>
          {fileTempoMarker != null && (
            <span className="text-[10px] text-white/40">
              File tempo marker: <strong className="text-white/60">{fileTempoMarker} BPM</strong>{" "}
              (reference only)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputBpmText}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
              setInputBpmText(next);
            }}
            onBlur={() => commitTempo(inputBpmText)}
            className="w-24 rounded-md border border-white/15 bg-white/6 px-2 py-1.5 text-sm text-white/85"
            aria-label="Project BPM"
          />
          <span className="text-sm text-white/55">
            BPM — used for analysis, generation & export
          </span>
        </div>
        <p className="text-[10px] text-white/35">
          Note pitches and timing are read from the MIDI file; beat grid always follows your BPM
          input.
        </p>
      </div>

      {/* Expression row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-white/10 bg-white/4 p-3 sm:p-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Meend
          </label>
          <select
            className="mt-1 w-full rounded-md border border-white/15 bg-white/6 text-white/85 px-2 py-1.5 text-sm"
            value={meendLevel}
            onChange={(e) => setMeendLevel(e.target.value as MeendLevel)}
          >
            {MEEND_LEVELS.map((m) => (
              <option key={m} value={m}>
                {m === "off" ? "Off" : m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 sm:pt-5">
          <input
            type="checkbox"
            checked={stevieSlides}
            onChange={(e) => setStevieSlides(e.target.checked)}
            className="rounded border-gray-300"
          />
          Stevie semitone slides
        </label>
        <div className="flex gap-1 sm:pt-4">
          {(["long-form", "custom"] as UiMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setUiMode(mode)}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-medium border ${
                uiMode === mode
                  ? "bg-[#A05068] text-white border-[#A05068]"
                  : "bg-white/6 text-white/50 border-white/15"
              }`}
            >
              {mode === "long-form" ? "Sections B–J" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {uiMode === "long-form" ? (
        <>
          {/* Engine info banner */}
          <div className="rounded-lg border border-white/10 bg-gradient-to-r from-white/5 to-transparent px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#A05068] uppercase tracking-wider">
                Long-Form Multi-MIDI Evolution Engine
              </p>
              <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                Phases 1–6 (Forensics → Motif Genealogy → Long-Form Memory → Rhythmic DNA → Harmonic
                Evolution → Sectional Narrative) are embedded. Sections B–J map exactly to Shadow
                Portal → Revelation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUiMode("custom");
                setPrompt(FULL_ENGINE_PROMPT);
                setLoadedPresetId("full-engine");
              }}
              className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-md border border-[#A05068]/30 text-[#A05068] hover:bg-[#A05068]/5 transition-colors whitespace-nowrap"
            >
              Load full prompt →
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={runForensics}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-white/15 bg-white/6 text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              Run forensics only
            </button>
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={() => void generateSection(suggestedSection ?? selectedSection)}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold bg-[#A05068] text-white hover:bg-[#8a4458] disabled:opacity-40"
              data-testid="button-analyze-and-generate"
            >
              {loading
                ? "Working…"
                : `Analyze & generate Section ${suggestedSection ?? selectedSection}`}
            </button>
          </div>

          {forensics && (
            <div className="rounded-lg border border-white/10 bg-white/4 p-4 text-sm space-y-2">
              <p className="text-white/65">{forensics.narrativeSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(["primary", "secondary", "transition", "hidden"] as const).map((k) => (
                  <span
                    key={k}
                    className="px-2 py-1 rounded bg-white/6 border border-white/10 text-white/60"
                  >
                    {k}: {forensics.motifsByKind[k] ?? 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-white/50 mb-2">Or pick a section</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
              {SECTION_ORDER.map((id) => {
                const spec = LONG_FORM_SECTIONS[id];
                const done = completedSections.includes(id);
                const active = selectedSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSection(id)}
                    disabled={!files.length}
                    className={`rounded-md border px-2 py-2 text-left transition-all disabled:opacity-40 ${
                      active
                        ? "border-[#A05068] bg-[#A05068]/10 ring-1 ring-[#A05068]/30"
                        : done
                          ? "border-emerald-400/50 bg-emerald-900/20"
                          : "border-white/10 bg-white/4 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold text-white/80">
                      {id}
                      {done ? " ✓" : ""}
                    </span>
                    <span className="block text-[9px] text-white/40 leading-tight mt-0.5 truncate">
                      {spec.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-white/40 mt-2">
              {LONG_FORM_SECTIONS[selectedSection].title} —{" "}
              {LONG_FORM_SECTIONS[selectedSection].emotion}
            </p>
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={() => void generateSection(selectedSection)}
              className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium border border-[#A05068]/50 text-[#A05068] hover:bg-[#A05068]/5 disabled:opacity-40"
            >
              Generate Section {selectedSection}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Prompt presets */}
          <div className="rounded-lg border border-[#A05068]/20 bg-[#A05068]/3">
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-xs font-bold text-[#A05068] uppercase tracking-wider">
                  Prompt presets
                </p>
                {loadedPresetId && (
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Loaded:{" "}
                    <span className="font-semibold text-white/65">
                      {PROMPT_PRESETS.find((p) => p.id === loadedPresetId)?.label}
                    </span>
                  </p>
                )}
                {!loadedPresetId && (
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Load the full engine prompt or a targeted section directive
                  </p>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showPresets ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showPresets && (
              <div className="border-t border-[#A05068]/10 px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PROMPT_PRESETS.map((pp) => (
                  <button
                    key={pp.id}
                    type="button"
                    onClick={() => {
                      setPrompt(pp.prompt);
                      setLoadedPresetId(pp.id);
                      setShowPresets(false);
                    }}
                    className={`text-left rounded-lg border px-3 py-2.5 transition-all hover:shadow-sm ${
                      loadedPresetId === pp.id
                        ? "border-[#A05068]/50 bg-[#A05068]/6 ring-1 ring-[#A05068]/20"
                        : "border-white/10 bg-white/4 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: pp.color }}
                      >
                        {pp.tag}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white/85">{pp.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2 leading-snug">
                      {pp.prompt.slice(0, 90)}…
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40">Style preset</label>
              <select
                className="mt-1 w-full rounded-md border border-white/15 bg-white/6 text-white/85 px-2 py-1.5 text-sm"
                value={preset}
                onChange={(e) => setPreset(e.target.value as StylePresetId)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            className="w-full min-h-[160px] rounded-lg border border-white/15 bg-white/5 text-white/85 placeholder:text-white/25 px-3 py-2 text-sm font-mono"
            placeholder="Paste your full evolution prompt here — or load one above…"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (loadedPresetId) setLoadedPresetId(null);
            }}
          />
          {prompt.length > 0 && (
            <div className="flex items-center justify-between -mt-3">
              <p className="text-[10px] text-white/30">{prompt.length} chars</p>
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setLoadedPresetId(null);
                }}
                className="text-[10px] text-white/30 hover:text-white/60"
              >
                Clear
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={runForensics}
              className="px-4 py-2 rounded-lg text-sm border border-white/15 text-white/65 hover:bg-white/6 disabled:opacity-40"
            >
              Forensics
            </button>
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={() => void callApi("transform")}
              className="px-4 py-2 rounded-lg text-sm bg-[#A05068] text-white disabled:opacity-40"
            >
              Transform
            </button>
            <button
              type="button"
              disabled={!part || loading}
              onClick={() => void callApi("continue")}
              className="px-4 py-2 rounded-lg text-sm border border-white/15 text-white/65 hover:bg-white/6 disabled:opacity-40"
            >
              Next part
            </button>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/8">
        <button
          type="button"
          disabled={!part || loading}
          onClick={() => void callApi("export")}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          Export MIDI pack ({exportFileCount} file{exportFileCount === 1 ? "" : "s"})
        </button>
        <button
          type="button"
          disabled={!files.length || loading}
          onClick={() => void callApi("export-suite")}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#A05068] text-white hover:bg-[#B45D78] disabled:opacity-40"
        >
          Export 9 versions ({files.length * 9} files)
        </button>
      </div>

      {loading && <p className="text-sm text-white/40 animate-pulse">Processing…</p>}
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {(memory || part) && (
        <div className="rounded-lg border border-white/10 divide-y divide-white/6 text-sm">
          {memory && (
            <div className="p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              <span>
                <strong className="text-white/75">Key</strong> {memory.key}
              </span>
              <span>
                <strong className="text-white/75">BPM</strong> {memory.globalBpm}
              </span>
              {memory.detectedBpm != null && memory.detectedBpm !== memory.globalBpm && (
                <span>
                  <strong className="text-white/75">File marker</strong> {memory.detectedBpm}
                </span>
              )}
              <span>
                <strong className="text-white/75">Motifs</strong> {memory.motifs.length}
              </span>
              <span>
                <strong className="text-white/75">Done</strong>{" "}
                {completedSections.length ? completedSections.join(", ") : "A only"}
              </span>
            </div>
          )}
          {part && (
            <div className="p-3 bg-[#A05068]/5">
              <p className="font-medium text-white/85">{part.label}</p>
              <p className="text-xs text-white/50 mt-1">
                Velocity & phrasing preserved · pitches reharmonized
                {part.pitchBends?.length ? " · meend/slides applied" : ""}
              </p>
              {part.fileOutputs?.length ? (
                <ul className="mt-2 space-y-1">
                  {part.fileOutputs.map((f) => (
                    <li key={f.sourceFileId} className="text-[10px] font-mono text-white/50">
                      {f.sourceFilename} → {f.exportFilename}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/40 mt-1">{part.filename}</p>
              )}
            </div>
          )}
          {report?.newHarmonicCenters?.length ? (
            <div className="p-3 text-xs text-white/40">
              Harmony: {report.newHarmonicCenters.slice(0, 6).join(" → ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
