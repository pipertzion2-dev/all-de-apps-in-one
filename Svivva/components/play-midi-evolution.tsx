"use client";

import { useCallback, useRef, useState } from "react";
import type {
  CompositionMemory,
  GeneratedPart,
  MeendLevel,
  StylePresetId,
  TransformationReport,
} from "@/lib/svivva-play/midi-evolution/types";

type LongFormSectionId = "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

type ForensicsReport = {
  narrativeSummary: string;
  fileCount: number;
  globalRelationships: string[];
  motifsByKind: Record<string, number>;
  recurringPhraseLengths: number[];
  recurringRhythms: number[];
  recurringIntervals: number[];
  melodicContours: string[];
  harmonicTendencies: string[];
  relationshipMap: { from: string; to: string; relation: string }[];
};

type UploadedFile = { filename: string; base64: string };

type UiMode = "long-form" | "custom";

const LONG_FORM_SECTIONS: Record<
  LongFormSectionId,
  { title: string; emotion: string; color: string }
> = {
  B: { title: "Shadow Portal", emotion: "First major departure", color: "#6366f1" },
  C: { title: "Fractured Mirror", emotion: "Inversion & reflection", color: "#8b5cf6" },
  D: { title: "Floating City", emotion: "Quartal suspension", color: "#06b6d4" },
  E: { title: "Abyss", emotion: "Darkest harmonic point", color: "#1e293b" },
  F: { title: "Indian Horizon", emotion: "Meend ornamentation", color: "#f59e0b" },
  G: { title: "Glasper Dimension", emotion: "Extended 9/11/13", color: "#10b981" },
  H: { title: "Derrick Hodge", emotion: "Melodic bass narrator", color: "#ec4899" },
  I: { title: "Cosmic Tension", emotion: "Maximum density", color: "#ef4444" },
  J: { title: "Revelation", emotion: "Motif resolution", color: "#fbbf24" },
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

async function fileToBase64(file: File): Promise<UploadedFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return { filename: file.name, base64: btoa(binary) };
}

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

export default function PlayMidiEvolution() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);

  const completedSections = memory?.completedSections ?? [];

  const handleFiles = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    const picked = [...list].filter((f) => /\.mid(i)?$/i.test(f.name));
    if (!picked.length) {
      setError("Upload .mid or .midi files");
      return;
    }
    const encoded = await Promise.all(picked.map(fileToBase64));
    setFiles(encoded);
    setFilenames(encoded.map((f) => f.filename));
    setMemory(null);
    setForensics(null);
    setPart(null);
    setReport(null);
    setError(null);
  }, []);

  const callApi = useCallback(
    async (
      action:
        | "forensics"
        | "analyze"
        | "transform"
        | "continue"
        | "generate-section"
        | "export",
      extra?: { sectionId?: LongFormSectionId },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const body: Record<string, unknown> = {
          action: action === "analyze" ? "forensics" : action,
          prompt,
          preset,
          stevieSlides,
          meendLevel,
          memory: memory ?? undefined,
          lastPart: part ?? undefined,
          sourceFilename: filenames[0],
          appendAfterLast: true,
        };
        if (files.length) body.files = files;
        if (extra?.sectionId) body.sectionId = extra.sectionId;

        const res = await fetch("/api/svivva-play/midi-evolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        if (data.memory) setMemory(data.memory);
        if (data.forensics) setForensics(data.forensics);
        if (data.part) setPart(data.part);
        if (data.report) setReport(data.report);
        if (data.suggestedSection) setSuggestedSection(data.suggestedSection);
        if (data.aiPlan?.intentSummary) {
          setAiHint(`${data.aiPlan.intentSummary} (${data.aiPlan.provider ?? "engine"})`);
        }
        if (action === "export" && data.zipBase64) {
          downloadZip(data.zipBase64, `long-form-evolution-${Date.now()}.zip`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [files, filenames, memory, meendLevel, part, preset, prompt, stevieSlides],
  );

  const generateSelectedSection = () => {
    void callApi("generate-section", { sectionId: selectedSection });
  };

  const generateSuggestedNext = () => {
    const next = suggestedSection ?? selectedSection;
    setSelectedSection(next);
    void callApi("generate-section", { sectionId: next });
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0a0f18] text-white overflow-hidden">
      <div className="px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-lg">
              🎹
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Long-Form MIDI Evolution Engine
            </h2>
          </div>
          <p className="text-sm text-white/40 pl-11">
            Multi-MIDI compositional forensics → motif genealogy → sections A through J
          </p>
        </div>

        <div className="flex gap-2">
          {(["long-form", "custom"] as UiMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setUiMode(mode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: uiMode === mode ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${uiMode === mode ? "#f59e0b" : "rgba(255,255,255,0.1)"}`,
                color: uiMode === mode ? "#fbbf24" : "rgba(255,255,255,0.5)",
              }}
            >
              {mode === "long-form" ? "Long-Form Narrative (A→J)" : "Custom Prompt"}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5 cursor-pointer"
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
            accept=".mid,.midi,audio/midi"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <p className="text-sm text-white/60">
            Drop <strong className="text-white/80">multiple MIDI files</strong> — analyzed together
            as one compositional graph (sections, motifs, merged ideas)
          </p>
          {filenames.length > 0 && (
            <ul className="mt-2 text-xs text-white/45 space-y-0.5">
              {filenames.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/70">Expression (optional)</h3>
          <p className="text-xs text-white/45">
            Velocity and phrasing stay identical to your upload — only pitches change. Meend and
            Stevie slides add semitone pitch-bends without moving notes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/40">Meend (Indian pitch glide)</label>
              <select
                className="w-full bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-sm"
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
            <label className="flex items-center gap-2 text-sm text-white/70 pt-5 sm:pt-0 sm:items-end sm:pb-2">
              <input
                type="checkbox"
                checked={stevieSlides}
                onChange={(e) => setStevieSlides(e.target.checked)}
                className="rounded"
              />
              Stevie Wonder semitone slides
            </label>
          </div>
        </div>

        {uiMode === "long-form" ? (
          <>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-amber-200/90">Workflow</h3>
              <ol className="text-xs text-white/55 space-y-1 list-decimal list-inside">
                <li>
                  <strong className="text-white/70">Section A</strong> = your uploaded MIDI (source
                  material)
                </li>
                <li>
                  Run <strong className="text-white/70">Compositional Forensics</strong> — global
                  motif map, rhythmic DNA, relationship graph
                </li>
                <li>
                  Pick section <strong className="text-white/70">B through J</strong> and generate
                  the next narrative chapter
                </li>
                <li>
                  Harmonic evolution repitches your notes —{" "}
                  <strong className="text-white/70">velocity &amp; phrasing unchanged</strong>
                </li>
              </ol>
              <button
                type="button"
                disabled={!files.length || loading}
                onClick={() => void callApi("forensics")}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-amber-600/90 hover:bg-amber-600 disabled:opacity-40"
              >
                {loading ? "Analyzing…" : "1. Run Compositional Forensics (Phases 1–3)"}
              </button>
            </div>

            {forensics && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm">
                <p className="text-white/80">{forensics.narrativeSummary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-white/40 block">Primary</span>
                    {forensics.motifsByKind.primary ?? 0}
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-white/40 block">Secondary</span>
                    {forensics.motifsByKind.secondary ?? 0}
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-white/40 block">Transition</span>
                    {forensics.motifsByKind.transition ?? 0}
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-white/40 block">Hidden</span>
                    {forensics.motifsByKind.hidden ?? 0}
                  </div>
                </div>
                {forensics.globalRelationships.map((r) => (
                  <p key={r} className="text-xs text-white/45">
                    {r}
                  </p>
                ))}
                {forensics.recurringPhraseLengths.length > 0 && (
                  <p className="text-xs text-white/45">
                    Phrase lengths: {forensics.recurringPhraseLengths.join("s, ")}s
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">
                  2. Generate Next Section (B–J)
                </h3>
                {suggestedSection && !completedSections.includes(suggestedSection) && (
                  <button
                    type="button"
                    disabled={!memory || loading}
                    onClick={generateSuggestedNext}
                    className="text-xs px-2 py-1 rounded bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40"
                  >
                    Suggested: Section {suggestedSection}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {SECTION_ORDER.map((id) => {
                  const spec = LONG_FORM_SECTIONS[id];
                  const done = completedSections.includes(id);
                  const active = selectedSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedSection(id)}
                      className="rounded-lg p-2 text-left transition-all border"
                      style={{
                        borderColor: active ? spec.color : "rgba(255,255,255,0.08)",
                        background: active
                          ? `${spec.color}22`
                          : done
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(255,255,255,0.04)",
                        opacity: !memory && !done ? 0.5 : 1,
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: spec.color }}>
                        {id}
                        {done ? " ✓" : ""}
                      </span>
                      <span className="block text-[10px] text-white/55 leading-tight mt-0.5">
                        {spec.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSection && (
                <div
                  className="rounded-lg p-3 text-xs space-y-1"
                  style={{
                    background: `${LONG_FORM_SECTIONS[selectedSection].color}15`,
                    border: `1px solid ${LONG_FORM_SECTIONS[selectedSection].color}40`,
                  }}
                >
                  <p className="font-medium text-white/80">
                    Section {selectedSection}: {LONG_FORM_SECTIONS[selectedSection].title}
                  </p>
                  <p className="text-white/50">{LONG_FORM_SECTIONS[selectedSection].emotion}</p>
                </div>
              )}

              <button
                type="button"
                disabled={!memory || loading}
                onClick={generateSelectedSection}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{
                  background: memory
                    ? `linear-gradient(135deg, ${LONG_FORM_SECTIONS[selectedSection].color}, #1e1b4b)`
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {loading
                  ? "Generating section…"
                  : `Generate Section ${selectedSection} — ${LONG_FORM_SECTIONS[selectedSection].title}`}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!part || loading}
                onClick={() => void callApi("export")}
                className="px-4 py-2 rounded-lg text-sm bg-emerald-700/80 hover:bg-emerald-700 disabled:opacity-40"
              >
                Export pack (MIDI + CompositionMemory + Report)
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-white/40">Style preset</label>
                <select
                  className="w-full bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-sm"
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

            <p className="text-xs text-white/40">
              Meend and Stevie slides are configured in the Expression panel above.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-white/40">Transformation prompt</label>
              <textarea
                className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/20 focus:outline-none focus:border-white/30"
                placeholder="Paste your long-form evolution prompt here…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <p className="text-xs text-white/40">
              Meend and Stevie slides are configured in the Expression panel above.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!files.length || loading}
                onClick={() => void callApi("forensics")}
                className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 disabled:opacity-40"
              >
                Forensics
              </button>
              <button
                type="button"
                disabled={(!files.length && !memory) || loading}
                onClick={() => void callApi("transform")}
                className="px-4 py-2 rounded-lg text-sm bg-amber-600/80 hover:bg-amber-600 disabled:opacity-40"
              >
                Transform
              </button>
              <button
                type="button"
                disabled={!part || loading}
                onClick={() => void callApi("continue")}
                className="px-4 py-2 rounded-lg text-sm bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40"
              >
                Generate next part
              </button>
              <button
                type="button"
                disabled={!part || loading}
                onClick={() => void callApi("export")}
                className="px-4 py-2 rounded-lg text-sm bg-emerald-700/80 hover:bg-emerald-700 disabled:opacity-40"
              >
                Export pack
              </button>
            </div>
          </>
        )}

        {loading && <p className="text-sm text-white/50 animate-pulse">Processing…</p>}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {aiHint && <p className="text-xs text-white/45">{aiHint}</p>}

        {memory && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-2">
            <p>
              <span className="text-white/40">Key:</span> {memory.key}{" "}
              <span className="text-white/40 ml-3">BPM:</span> {memory.globalBpm}
            </p>
            <p>
              <span className="text-white/40">Motifs:</span> {memory.motifs.length}{" "}
              <span className="text-white/40 ml-3">Sections completed:</span>{" "}
              {completedSections.length ? completedSections.join(", ") : "A (source only)"}
            </p>
          </div>
        )}

        {part && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
            <p className="font-medium">{part.label}</p>
            {part.sectionTitle && (
              <p className="text-amber-200/70 text-xs mt-0.5">Section {part.sectionId}</p>
            )}
            <p className="text-white/50 text-xs mt-1">{part.filename}</p>
            <p className="text-white/45 text-xs mt-2">
              Same velocity &amp; phrasing as source — pitches reharmonized
              {part.pitchBends?.length ? " + pitch-bend expression" : ""}
            </p>
          </div>
        )}

        {report && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/50 space-y-1">
            {report.sectionTitle && <p>Section: {report.sectionTitle}</p>}
            <p>Voice leading: {report.voiceLeadingStrategy}</p>
            <p>Bass: {report.bassStrategy}</p>
            <p>Harmony arc: {report.newHarmonicCenters.join(" → ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
