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
  const [inputBpm, setInputBpm] = useState(120);
  const [fileTempoMarker, setFileTempoMarker] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedSections = memory?.completedSections ?? [];
  const step: Step = !files.length ? 1 : !memory ? 2 : 3;

  const handleFiles = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    const picked = [...list].filter((f) => /\.mid(i)?$/i.test(f.name));
    if (!picked.length) {
      setError("Please upload .mid or .midi files.");
      return;
    }
    const encoded = await Promise.all(picked.map(fileToBase64));
    setFiles(encoded);
    setFilenames(encoded.map((f) => f.filename));
    setMemory(null);
    setForensics(null);
    setPart(null);
    setReport(null);
    setFileTempoMarker(null);
    setError(null);
  }, []);

  const tempoPayload = useCallback(() => ({ manualBpm: inputBpm }), [inputBpm]);

  const postEvolution = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/svivva-play/midi-evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [],
  );

  const callApi = useCallback(
    async (
      action: "forensics" | "transform" | "continue" | "generate-section" | "export",
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
          downloadZip(data.zipBase64, `midi-evolution-${Date.now()}.zip`);
        }
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [files, filenames, inputBpm, memory, meendLevel, part, postEvolution, preset, prompt, stevieSlides, tempoPayload],
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
    ? "px-4 sm:px-5 py-5 sm:py-6 space-y-5 bg-white text-gray-900"
    : "rounded-2xl border border-gray-200 bg-white shadow-sm px-4 sm:px-6 py-8 space-y-6 text-gray-900";

  return (
    <div className={shell} data-testid="midi-evolution-engine">
      {!embedded && (
        <div>
          <h2 className="text-xl font-bold text-gray-900">MIDI Evolution Engine</h2>
          <p className="text-sm text-gray-500 mt-1">
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
              step >= s.n
                ? "border-[#A05068]/40 bg-[#A05068]/5"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                step >= s.n ? "text-[#A05068]" : "text-gray-400"
              }`}
            >
              Step {s.n}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-500 hidden sm:block">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 p-4 sm:p-5 cursor-pointer hover:border-[#A05068]/50 hover:bg-[#A05068]/5 transition-colors"
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
        <p className="text-sm font-medium text-gray-800">
          {filenames.length ? `${filenames.length} file(s) loaded` : "Drop or click to upload MIDI"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Multiple files analyzed together as one composition (sections, motifs, merged ideas).
        </p>
        {filenames.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {filenames.map((n) => (
              <li
                key={n}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600"
              >
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tempo — always user input; MIDI notes parsed in seconds from file */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Project tempo (required)
          </p>
          {fileTempoMarker != null && (
            <span className="text-[10px] text-gray-500">
              File tempo marker: <strong className="text-gray-600">{fileTempoMarker} BPM</strong>{" "}
              (reference only)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={20}
            max={400}
            step={1}
            value={inputBpm}
            onChange={(e) =>
              setInputBpm(Math.max(20, Math.min(400, Number(e.target.value) || 120)))
            }
            className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            aria-label="Project BPM"
          />
          <span className="text-sm text-gray-600">BPM — used for analysis, generation & export</span>
        </div>
        <p className="text-[10px] text-gray-500">
          Note pitches and timing are read from the MIDI file; beat grid always follows your BPM
          input.
        </p>
      </div>

      {/* Expression row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Meend
          </label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
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
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:pt-5">
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
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {mode === "long-form" ? "Sections B–J" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {uiMode === "long-form" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={runForensics}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-40"
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
              <p className="text-gray-700">{forensics.narrativeSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(["primary", "secondary", "transition", "hidden"] as const).map((k) => (
                  <span key={k} className="px-2 py-1 rounded bg-white border border-gray-200">
                    {k}: {forensics.motifsByKind[k] ?? 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Or pick a section</p>
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
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-900">
                      {id}
                      {done ? " ✓" : ""}
                    </span>
                    <span className="block text-[9px] text-gray-500 leading-tight mt-0.5 truncate">
                      {spec.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {LONG_FORM_SECTIONS[selectedSection].title} — {LONG_FORM_SECTIONS[selectedSection].emotion}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Style preset</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            className="w-full min-h-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Paste your full evolution prompt here…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!files.length || loading}
              onClick={runForensics}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40"
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
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40"
            >
              Next part
            </button>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
        <button
          type="button"
          disabled={!part || loading}
          onClick={() => void callApi("export")}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          Export MIDI pack ({(part?.fileOutputs?.length ?? filenames.length) || 1} file
        {((part?.fileOutputs?.length ?? filenames.length) || 1) === 1 ? "" : "s"})
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 animate-pulse">Processing…</p>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {(memory || part) && (
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
          {memory && (
            <div className="p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              <span>
                <strong className="text-gray-800">Key</strong> {memory.key}
              </span>
              <span>
                <strong className="text-gray-800">BPM</strong> {memory.globalBpm}
              </span>
              {memory.detectedBpm != null && memory.detectedBpm !== memory.globalBpm && (
                <span>
                  <strong className="text-gray-800">File marker</strong> {memory.detectedBpm}
                </span>
              )}
              <span>
                <strong className="text-gray-800">Motifs</strong> {memory.motifs.length}
              </span>
              <span>
                <strong className="text-gray-800">Done</strong>{" "}
                {completedSections.length ? completedSections.join(", ") : "A only"}
              </span>
            </div>
          )}
          {part && (
            <div className="p-3 bg-[#A05068]/5">
              <p className="font-medium text-gray-900">{part.label}</p>
              <p className="text-xs text-gray-600 mt-1">
                Velocity & phrasing preserved · pitches reharmonized
                {part.pitchBends?.length ? " · meend/slides applied" : ""}
              </p>
              {part.fileOutputs?.length ? (
                <ul className="mt-2 space-y-1">
                  {part.fileOutputs.map((f) => (
                    <li key={f.sourceFileId} className="text-[10px] font-mono text-gray-600">
                      {f.sourceFilename} → {f.exportFilename}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 mt-1">{part.filename}</p>
              )}
            </div>
          )}
          {report?.newHarmonicCenters?.length ? (
            <div className="p-3 text-xs text-gray-500">
              Harmony: {report.newHarmonicCenters.slice(0, 6).join(" → ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
