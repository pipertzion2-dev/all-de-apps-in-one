"use client";

import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrackInput {
  title: string;
  description: string;
  emotionalProfile: string[];
  spectralDescription: string;
  rhythmicPattern: string;
  harmonicLanguage: string;
}

type HybridizationPoint = "tonal" | "rhythmic" | "timbral" | "structural" | "emotional";
type OutputFormat = "song-structure" | "production-spec" | "stem-blueprint";

interface PsychoacousticVector {
  valence: number;
  arousal: number;
  tension: number;
  complexity: number;
  brightness: number;
  warmth: number;
  roughness: number;
  pulseClarity: number;
  tonalStability: number;
  spectralSpread: number;
  harmonicDensity: number;
  rhythmicEntropy: number;
}

interface ArrangementSection {
  section: string;
  bars: number;
  description: string;
}

interface GenomeResult {
  genomeA: PsychoacousticVector;
  genomeB: PsychoacousticVector;
  hybridGenome: PsychoacousticVector;
  crossoverPoints: string[];
  dominantStreams: { A: string[]; B: string[] };
  hybridStreams: string[];
  productionSpec: {
    tempo: string;
    key: string;
    timeSignature: string;
    arrangement: ArrangementSection[];
    instrumentStack: string[];
    mixingNotes: string[];
    referenceArtists: string[];
  };
  uniquenessScore: number;
  emotionalArc: string;
  novelMusicologicalConcept: string;
  psychoacousticExplanation: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EMOTIONAL_OPTIONS = [
  "euphoric",
  "melancholic",
  "driving",
  "ethereal",
  "aggressive",
  "intimate",
  "triumphant",
  "mysterious",
  "playful",
  "somber",
];

const HARMONIC_OPTIONS = [
  "Diatonic major",
  "Natural minor",
  "Lydian",
  "Mixolydian",
  "Dorian",
  "Phrygian",
  "Blues pentatonic",
  "Chromatic jazz",
  "Whole tone",
  "Octatonic (diminished)",
  "Quartal harmony",
  "Atonal/12-tone",
];

const GENOME_AXES: { key: keyof PsychoacousticVector; label: string }[] = [
  { key: "valence", label: "Valence" },
  { key: "arousal", label: "Arousal" },
  { key: "tension", label: "Tension" },
  { key: "complexity", label: "Complexity" },
  { key: "brightness", label: "Brightness" },
  { key: "warmth", label: "Warmth" },
  { key: "roughness", label: "Roughness" },
  { key: "pulseClarity", label: "Pulse" },
  { key: "tonalStability", label: "Tonal" },
  { key: "spectralSpread", label: "Spectral" },
  { key: "harmonicDensity", label: "Harmonic" },
  { key: "rhythmicEntropy", label: "Entropy" },
];

const emptyTrack = (): TrackInput => ({
  title: "",
  description: "",
  emotionalProfile: [],
  spectralDescription: "",
  rhythmicPattern: "",
  harmonicLanguage: "",
});

// ── Radar Chart ────────────────────────────────────────────────────────────────

interface RadarProps {
  vectors: { genome: PsychoacousticVector; color: string; label: string }[];
  size?: number;
}

function RadarChart({ vectors, size = 220 }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const n = GENOME_AXES.length;

  function point(value: number, index: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const rv = r * Math.max(0, Math.min(1, value));
    return [cx + rv * Math.cos(angle), cy + rv * Math.sin(angle)];
  }

  function axisPoint(index: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function labelPoint(index: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const lr = r * 1.22;
    return [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)];
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const [ax, ay] = axisPoint(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={ax}
            y2={ay}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygons */}
      {vectors.map(({ genome, color, label }) => {
        const pts = GENOME_AXES.map(({ key }, i) => {
          const [px, py] = point(genome[key], i);
          return `${px},${py}`;
        }).join(" ");
        return (
          <g key={label}>
            <polygon
              points={pts}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeWidth={1.5}
            />
            {GENOME_AXES.map(({ key }, i) => {
              const [px, py] = point(genome[key], i);
              return <circle key={key} cx={px} cy={py} r={2.5} fill={color} />;
            })}
          </g>
        );
      })}

      {/* Axis labels */}
      {GENOME_AXES.map(({ label }, i) => {
        const [lx, ly] = labelPoint(i);
        return (
          <text
            key={label}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fill="rgba(255,255,255,0.55)"
            fontFamily="monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Track Panel ────────────────────────────────────────────────────────────────

interface TrackPanelProps {
  label: string;
  accent: string;
  track: TrackInput;
  onChange: (t: TrackInput) => void;
}

function TrackPanel({ label, accent, track, onChange }: TrackPanelProps) {
  const toggle = (emotion: string) => {
    const next = track.emotionalProfile.includes(emotion)
      ? track.emotionalProfile.filter((e) => e !== emotion)
      : [...track.emotionalProfile, emotion];
    onChange({ ...track, emotionalProfile: next });
  };

  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-5 space-y-4 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
        <h3 className="text-sm font-semibold tracking-widest uppercase text-white/70">{label}</h3>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Track Title</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          placeholder="e.g. Midnight City"
          value={track.title}
          onChange={(e) => onChange({ ...track, title: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Description</label>
        <textarea
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
          placeholder="Tempo, key, genre, instrumentation…"
          value={track.description}
          onChange={(e) => onChange({ ...track, description: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Emotional Profile</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONAL_OPTIONS.map((emo) => {
            const active = track.emotionalProfile.includes(emo);
            return (
              <button
                key={emo}
                type="button"
                onClick={() => toggle(emo)}
                className="px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  background: active ? accent + "33" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${active ? accent : "rgba(255,255,255,0.1)"}`,
                  color: active ? accent : "rgba(255,255,255,0.5)",
                }}
              >
                {emo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Spectral Character</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          placeholder="e.g. bright 8kHz presence, warm bass-heavy"
          value={track.spectralDescription}
          onChange={(e) => onChange({ ...track, spectralDescription: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Rhythmic Pattern</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          placeholder="e.g. 4/4 syncopated trap hi-hats"
          value={track.rhythmicPattern}
          onChange={(e) => onChange({ ...track, rhythmicPattern: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/40">Harmonic Language</label>
        <select
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          value={track.harmonicLanguage}
          onChange={(e) => onChange({ ...track, harmonicLanguage: e.target.value })}
        >
          <option value="">Select…</option>
          {HARMONIC_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PlayPsychoacousticGenome() {
  const [trackA, setTrackA] = useState<TrackInput>(emptyTrack());
  const [trackB, setTrackB] = useState<TrackInput>(emptyTrack());
  const [hybridizationPoint, setHybridizationPoint] = useState<HybridizationPoint>("tonal");
  const [targetEmotion, setTargetEmotion] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("production-spec");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenomeResult | null>(null);

  const canSubmit =
    trackA.title.trim() &&
    trackB.title.trim() &&
    trackA.description.trim() &&
    trackB.description.trim() &&
    targetEmotion.trim();

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/svivva-play/psychoacoustic-genome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackA, trackB, hybridizationPoint, targetEmotion, outputFormat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data as GenomeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [trackA, trackB, hybridizationPoint, targetEmotion, outputFormat, canSubmit]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0d0d1a] text-white overflow-hidden">
      <div className="w-full px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-lg">
              🧬
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Psychoacoustic Genome Engine</h1>
          </div>
          <p className="text-sm text-white/40 pl-11">
            Hybridize two musical genomes using ASA stream analysis &amp; Fletcher-Munson contours
          </p>
        </div>

        {/* Track Panels */}
        <div className="flex gap-4 flex-col md:flex-row">
          <TrackPanel label="Track A" accent="#a78bfa" track={trackA} onChange={setTrackA} />
          <div className="flex items-center justify-center">
            <div className="text-white/20 text-2xl select-none hidden md:block">✕</div>
          </div>
          <TrackPanel label="Track B" accent="#34d399" track={trackB} onChange={setTrackB} />
        </div>

        {/* Hybridization Controls */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-white/50">
            Hybridization Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/40">Hybridization Point</label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    "tonal",
                    "rhythmic",
                    "timbral",
                    "structural",
                    "emotional",
                  ] as HybridizationPoint[]
                ).map((hp) => (
                  <button
                    key={hp}
                    type="button"
                    onClick={() => setHybridizationPoint(hp)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background:
                        hybridizationPoint === hp
                          ? "rgba(167,139,250,0.2)"
                          : "rgba(255,255,255,0.06)",
                      border: `1px solid ${hybridizationPoint === hp ? "#a78bfa" : "rgba(255,255,255,0.1)"}`,
                      color: hybridizationPoint === hp ? "#a78bfa" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {hp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/40">Target Emotion</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                placeholder="e.g. nostalgic euphoria"
                value={targetEmotion}
                onChange={(e) => setTargetEmotion(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/40">Output Format</label>
              <select
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              >
                <option value="song-structure">Song Structure</option>
                <option value="production-spec">Production Spec</option>
                <option value="stem-blueprint">Stem Blueprint</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                canSubmit && !loading
                  ? "linear-gradient(135deg, #7c3aed, #a21caf)"
                  : "rgba(255,255,255,0.08)",
            }}
          >
            {loading ? "Hybridizing Genomes…" : "Run Psychoacoustic Genome Hybridization"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Novel Concept Banner */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 space-y-1">
              <div className="text-xs uppercase tracking-widest text-violet-400 font-semibold">
                Novel Musicological Concept
              </div>
              <div className="text-base font-bold text-white">
                {result.novelMusicologicalConcept}
              </div>
            </div>

            {/* Genome Radar Charts */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-widest uppercase text-white/50">
                Psychoacoustic Genome Vectors
              </h2>
              <div className="flex flex-wrap gap-8 justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RadarChart
                    vectors={[{ genome: result.genomeA, color: "#a78bfa", label: "A" }]}
                    size={200}
                  />
                  <span className="text-xs text-white/40">Track A · {trackA.title}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RadarChart
                    vectors={[{ genome: result.genomeB, color: "#34d399", label: "B" }]}
                    size={200}
                  />
                  <span className="text-xs text-white/40">Track B · {trackB.title}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RadarChart
                    vectors={[
                      { genome: result.genomeA, color: "#a78bfa44", label: "A" },
                      { genome: result.genomeB, color: "#34d39944", label: "B" },
                      { genome: result.hybridGenome, color: "#f59e0b", label: "Hybrid" },
                    ]}
                    size={200}
                  />
                  <span className="text-xs text-white/40">Hybrid Genome</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-5 justify-center text-xs text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Track A
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Track B
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Hybrid
                </span>
              </div>
            </div>

            {/* Uniqueness Score + Emotional Arc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-white/40">
                    Uniqueness Score
                  </span>
                  <span className="text-lg font-bold text-amber-400">{result.uniquenessScore}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${result.uniquenessScore}%`,
                      background:
                        result.uniquenessScore > 75
                          ? "#f59e0b"
                          : result.uniquenessScore > 50
                            ? "#a78bfa"
                            : "#6b7280",
                    }}
                  />
                </div>
                <div className="text-xs text-white/30">vs. existing music landscape</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <span className="text-xs uppercase tracking-widest text-white/40">
                  Emotional Arc
                </span>
                <p className="text-sm text-white/70 leading-relaxed">{result.emotionalArc}</p>
              </div>
            </div>

            {/* Crossover Points */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-white/40">
                Crossover Points Identified
              </h3>
              <div className="space-y-2">
                {result.crossoverPoints.map((pt, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm text-white/70">
                    <span
                      className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa" }}
                    >
                      {i + 1}
                    </span>
                    {pt}
                  </div>
                ))}
              </div>
            </div>

            {/* ASA Streams */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-white/40">
                ASA Auditory Streams
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {(["A", "B", "Hybrid"] as const).map((which) => {
                  const streams =
                    which === "A"
                      ? result.dominantStreams.A
                      : which === "B"
                        ? result.dominantStreams.B
                        : result.hybridStreams;
                  const color = which === "A" ? "#a78bfa" : which === "B" ? "#34d399" : "#f59e0b";
                  return (
                    <div key={which} className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color }}>
                        Track {which}
                      </div>
                      {streams.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-white/60">
                          <span className="font-mono text-xs opacity-60">
                            {s.split(":")[0] ?? "stream"}
                          </span>
                          <span className="text-white/40">›</span>
                          <span>{s.split(":").slice(1).join(":") || s}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Spec Arrangement Table */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Production Spec</h3>
                <div className="flex gap-3 text-xs text-white/40">
                  <span>
                    <span className="text-white/60">Tempo:</span> {result.productionSpec.tempo}
                  </span>
                  <span>
                    <span className="text-white/60">Key:</span> {result.productionSpec.key}
                  </span>
                  <span>
                    <span className="text-white/60">Time:</span>{" "}
                    {result.productionSpec.timeSignature}
                  </span>
                </div>
              </div>

              {/* Arrangement table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-white/30 border-b border-white/10">
                      <th className="pb-2 pr-4 font-normal">Section</th>
                      <th className="pb-2 pr-4 font-normal">Bars</th>
                      <th className="pb-2 font-normal">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.productionSpec.arrangement.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-4 text-amber-400 font-medium whitespace-nowrap">
                          {row.section}
                        </td>
                        <td className="py-2 pr-4 text-white/50 font-mono text-xs">{row.bars}</td>
                        <td className="py-2 text-white/60 leading-relaxed">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instrument Stack */}
              <div className="space-y-2">
                <div className="text-xs text-white/30">Instrument Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.productionSpec.instrumentStack.map((inst, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-xs bg-white/8 border border-white/10 text-white/60"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mixing Notes */}
              <div className="space-y-2">
                <div className="text-xs text-white/30">Mixing Notes</div>
                <ul className="space-y-1">
                  {result.productionSpec.mixingNotes.map((note, i) => (
                    <li key={i} className="text-sm text-white/55 flex gap-2">
                      <span className="text-violet-400 mt-0.5">›</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reference Artists */}
              <div className="space-y-2">
                <div className="text-xs text-white/30">Reference Artists</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.productionSpec.referenceArtists.map((artist, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-xs border border-violet-500/30 text-violet-300"
                      style={{ background: "rgba(124,58,237,0.1)" }}
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Psychoacoustic Explanation */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 space-y-1">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Psychoacoustic Explanation
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {result.psychoacousticExplanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
