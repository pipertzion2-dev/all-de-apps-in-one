"use client";

import { useState } from "react";

interface CurrentSystem {
  description: string;
  cryptoUsed: string[];
  sensitivityLevel: "public" | "internal" | "confidential" | "top_secret";
  dataTypes: string[];
  longevityRequirement: number;
}

interface VulnerabilityEntry {
  primitive: string;
  classicalSecurityBits: number;
  quantumSecurityBits: number;
  timeToBreakClassical: string;
  timeToBreakQuantum2030: string;
  algorithm: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

interface PQCReplacement {
  replaces: string;
  replacement: string;
  securityLevel: string;
  keySize: string;
  performance: string;
  migrationComplexity: "Low" | "Medium" | "High";
  implementationNote: string;
}

interface ZKProofDesign {
  goal: string;
  protocol: string;
  circuitDescription: string;
  witnessVariables: string[];
  publicInputs: string[];
  proverTime: string;
  verifierTime: string;
  proofSize: string;
  implementation: string;
  useCase: string;
}

interface HomomorphicAssessment {
  feasible: boolean;
  recommendedScheme: string;
  operations: string[];
}

interface MigrationPhase {
  phase: number;
  timeline: string;
  action: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

interface ThreatTimelineEntry {
  year: number;
  actor: string;
  rsa2048BreakProbability: number;
}

interface PQCResult {
  vulnerabilityAssessment: VulnerabilityEntry[];
  pqcReplacements: PQCReplacement[];
  zkProofDesigns: ZKProofDesign[];
  homomorphicAssessment: HomomorphicAssessment;
  cryptoAgilityScore: number;
  migrationRoadmap: MigrationPhase[];
  threatTimeline: ThreatTimelineEntry[];
  overallPostQuantumScore: number;
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-900/60 text-red-300 border border-red-800",
  HIGH: "bg-orange-900/60 text-orange-300 border border-orange-800",
  MEDIUM: "bg-yellow-900/60 text-yellow-300 border border-yellow-800",
  LOW: "bg-slate-800 text-slate-400 border border-slate-700",
};

const COMPLEXITY_COLORS: Record<string, string> = {
  Low: "text-green-400",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-600",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-slate-600",
};

const COMMON_ALGOS = [
  "RSA-2048",
  "RSA-4096",
  "ECDSA P-256",
  "ECDH P-384",
  "AES-128",
  "AES-256",
  "TLS 1.3",
  "SHA-256",
  "Ed25519",
];

const DATA_TYPE_OPTIONS = [
  "user passwords",
  "financial transactions",
  "medical records",
  "personal PII",
  "cryptographic keys",
  "authentication tokens",
  "intellectual property",
];

function GaugeBar({ value, max = 10, label }: { value: number; max?: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span style={{ color }} className="font-semibold">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function QuantumTimeline({ entries }: { entries: ThreatTimelineEntry[] }) {
  if (!entries || entries.length === 0) return null;
  const years = [...new Set(entries.map((e) => e.year))].sort();
  const actors = [...new Set(entries.map((e) => e.actor))];
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const range = maxYear - minYear || 1;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 700 ${actors.length * 50 + 60}`}
        className="w-full"
        style={{ minHeight: actors.length * 50 + 60 }}
      >
        <line x1={40} y1={30} x2={680} y2={30} stroke="#334155" strokeWidth={2} />
        {years.map((y) => {
          const x = 40 + ((y - minYear) / range) * 640;
          return (
            <g key={y}>
              <line x1={x} y1={25} x2={x} y2={35} stroke="#64748b" strokeWidth={1} />
              <text x={x} y={20} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {y}
              </text>
            </g>
          );
        })}
        {actors.map((actor, ai) => {
          const actorEntries = entries.filter((e) => e.actor === actor);
          const y = 60 + ai * 50;
          return (
            <g key={actor}>
              <text x={35} y={y + 14} textAnchor="end" fontSize="10" fill="#94a3b8">
                {actor}
              </text>
              {actorEntries.map((e, ei) => {
                const x = 40 + ((e.year - minYear) / range) * 640;
                const prob = e.rsa2048BreakProbability;
                const r = Math.max(4, prob * 20);
                const fill = prob >= 0.5 ? "#ef4444" : prob >= 0.2 ? "#f97316" : "#22c55e";
                return (
                  <g key={ei}>
                    <circle cx={x} cy={y + 14} r={r} fill={fill} fillOpacity={0.7} />
                    <text x={x} y={y + 32} textAnchor="middle" fontSize="9" fill="#94a3b8">
                      {(prob * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-slate-500 text-center mt-1">
        Circle size = probability of breaking RSA-2048
      </p>
    </div>
  );
}

export default function SecurityPQCConstructor() {
  const [system, setSystem] = useState<CurrentSystem>({
    description:
      "Web application with user authentication, payment processing, and encrypted data storage",
    cryptoUsed: ["RSA-2048", "AES-256", "ECDSA P-256", "TLS 1.3"],
    sensitivityLevel: "confidential",
    dataTypes: ["user passwords", "financial transactions"],
    longevityRequirement: 10,
  });
  const [zkGoals, setZkGoals] = useState<string[]>(["Prove user is over 18 without revealing age"]);
  const [threatModel, setThreatModel] = useState<string[]>(["quantum", "classical"]);
  const [newAlgo, setNewAlgo] = useState("");
  const [newZkGoal, setNewZkGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PQCResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addAlgo(algo: string) {
    const a = algo.trim();
    if (a && !system.cryptoUsed.includes(a)) {
      setSystem((s) => ({ ...s, cryptoUsed: [...s.cryptoUsed, a] }));
    }
    setNewAlgo("");
  }

  function toggleDataType(dt: string) {
    setSystem((s) => ({
      ...s,
      dataTypes: s.dataTypes.includes(dt)
        ? s.dataTypes.filter((d) => d !== dt)
        : [...s.dataTypes, dt],
    }));
  }

  function toggleThreat(t: string) {
    setThreatModel((m) => (m.includes(t) ? m.filter((x) => x !== t) : [...m, t]));
  }

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/security/pqc-proof-constructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSystem: system,
          securityRequirements: [],
          zkProofGoals: zkGoals,
          threatModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      setResult(data.result as PQCResult);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const pqScore = result?.overallPostQuantumScore ?? 0;
  const pqScoreColor = pqScore >= 7 ? "#22c55e" : pqScore >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 tracking-tight">
            Post-Quantum Cryptographic Constructor
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            NIST PQC · ZK-SNARK Circuits · Grover/Shor Analysis · Migration Roadmap
          </p>
        </div>

        {/* Current System */}
        <section className="bg-slate-900 rounded-xl p-5 space-y-4 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Current System</h2>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 h-20 resize-none"
            placeholder="Describe your system's architecture and purpose..."
            value={system.description}
            onChange={(e) => setSystem((s) => ({ ...s, description: e.target.value }))}
          />

          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Cryptographic Primitives in Use
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {system.cryptoUsed.map((a, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 bg-purple-900/40 border border-purple-800 text-purple-300 text-xs px-2.5 py-1 rounded-full"
                >
                  {a}
                  <button
                    onClick={() =>
                      setSystem((s) => ({
                        ...s,
                        cryptoUsed: s.cryptoUsed.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-purple-500 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                placeholder="Add algorithm (e.g. RSA-2048)"
                value={newAlgo}
                onChange={(e) => setNewAlgo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAlgo(newAlgo)}
              />
              <button
                onClick={() => addAlgo(newAlgo)}
                className="bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_ALGOS.filter((a) => !system.cryptoUsed.includes(a)).map((a) => (
                <button
                  key={a}
                  onClick={() => addAlgo(a)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 px-2 py-1 rounded transition-colors"
                >
                  + {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Sensitivity Level</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                value={system.sensitivityLevel}
                onChange={(e) =>
                  setSystem((s) => ({
                    ...s,
                    sensitivityLevel: e.target.value as CurrentSystem["sensitivityLevel"],
                  }))
                }
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="top_secret">Top Secret</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Data Longevity:{" "}
                <span className="text-purple-300 font-semibold">
                  {system.longevityRequirement} years
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={system.longevityRequirement}
                onChange={(e) =>
                  setSystem((s) => ({ ...s, longevityRequirement: parseInt(e.target.value) }))
                }
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Data Types</label>
            <div className="flex flex-wrap gap-2">
              {DATA_TYPE_OPTIONS.map((dt) => (
                <button
                  key={dt}
                  onClick={() => toggleDataType(dt)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    system.dataTypes.includes(dt)
                      ? "bg-purple-900/50 border-purple-700 text-purple-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ZK Proof Goals */}
        <section className="bg-slate-900 rounded-xl p-5 space-y-3 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Zero-Knowledge Proof Goals</h2>
          <p className="text-xs text-slate-400">
            Describe in plain English what you need to prove without revealing
          </p>
          {zkGoals.map((g, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                value={g}
                onChange={(e) =>
                  setZkGoals((goals) => goals.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
              <button
                onClick={() => setZkGoals((goals) => goals.filter((_, j) => j !== i))}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
              placeholder="e.g. Prove balance > threshold without revealing balance"
              value={newZkGoal}
              onChange={(e) => setNewZkGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newZkGoal.trim()) {
                  setZkGoals((g) => [...g, newZkGoal.trim()]);
                  setNewZkGoal("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newZkGoal.trim()) {
                  setZkGoals((g) => [...g, newZkGoal.trim()]);
                  setNewZkGoal("");
                }
              }}
              className="bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </section>

        {/* Threat Model */}
        <section className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Threat Model</h2>
          <div className="flex gap-3 flex-wrap">
            {(["quantum", "classical", "nation_state", "insider"] as const).map((t) => (
              <button
                key={t}
                onClick={() => toggleThreat(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
                  threatModel.includes(t)
                    ? "bg-purple-700 border-purple-600 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? "Constructing PQC Assessment…" : "Generate Post-Quantum Security Assessment"}
        </button>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Scores */}
            <div className="grid grid-cols-3 gap-4">
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                <p className="text-xs text-slate-400 mb-2">Post-Quantum Score</p>
                <p className="text-5xl font-bold" style={{ color: pqScoreColor }}>
                  {result.overallPostQuantumScore?.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500 mt-1">out of 10</p>
              </section>
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <GaugeBar
                  value={result.cryptoAgilityScore ?? 0}
                  max={10}
                  label="Crypto Agility Score"
                />
                <p className="text-xs text-slate-500 mt-2">How easily can algorithms be swapped</p>
              </section>
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 mb-2">Critical Vulnerabilities</p>
                <p className="text-4xl font-bold text-red-400">
                  {result.vulnerabilityAssessment?.filter((v) => v.urgency === "CRITICAL").length ??
                    0}
                </p>
                <p className="text-xs text-slate-500 mt-1">require immediate action</p>
              </section>
            </div>

            {/* Vulnerability Assessment Table */}
            {result.vulnerabilityAssessment?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Quantum Vulnerability Assessment
                </h3>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700">
                      <th className="pb-2 pr-4">Primitive</th>
                      <th className="pb-2 pr-4">Classical Bits</th>
                      <th className="pb-2 pr-4">Quantum Bits</th>
                      <th className="pb-2 pr-4">Break (Classical)</th>
                      <th className="pb-2 pr-4">Break (Quantum 2030)</th>
                      <th className="pb-2 pr-4">Algorithm</th>
                      <th className="pb-2">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.vulnerabilityAssessment.map((v, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/40">
                        <td className="py-2 pr-4 font-medium text-slate-200 font-mono text-xs">
                          {v.primitive}
                        </td>
                        <td className="py-2 pr-4 text-green-400 font-mono">
                          {v.classicalSecurityBits}
                        </td>
                        <td
                          className="py-2 pr-4 font-mono"
                          style={{ color: v.quantumSecurityBits === 0 ? "#ef4444" : "#f59e0b" }}
                        >
                          {v.quantumSecurityBits}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-400">
                          {v.timeToBreakClassical}
                        </td>
                        <td className="py-2 pr-4 text-xs text-red-300">
                          {v.timeToBreakQuantum2030}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-400">{v.algorithm}</td>
                        <td className="py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${URGENCY_COLORS[v.urgency] ?? URGENCY_COLORS.LOW}`}
                          >
                            {v.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* PQC Replacements */}
            {result.pqcReplacements?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">PQC Migration Map</h3>
                <div className="space-y-3">
                  {result.pqcReplacements.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700"
                    >
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-red-300 bg-red-950/50 px-2 py-0.5 rounded">
                            {r.replaces}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="font-mono text-sm text-green-300 bg-green-950/50 px-2 py-0.5 rounded">
                            {r.replacement}
                          </span>
                          <span
                            className={`text-xs font-medium ml-auto ${COMPLEXITY_COLORS[r.migrationComplexity]}`}
                          >
                            {r.migrationComplexity} migration
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{r.securityLevel}</p>
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>
                            Key size: <span className="text-slate-300">{r.keySize}</span>
                          </span>
                          <span>
                            Perf: <span className="text-slate-300">{r.performance}</span>
                          </span>
                        </div>
                        {r.implementationNote && (
                          <p className="text-xs text-slate-500 italic">{r.implementationNote}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ZK Proof Designs */}
            {result.zkProofDesigns?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  ZK Proof Circuit Designs
                </h3>
                <div className="space-y-4">
                  {result.zkProofDesigns.map((z, i) => (
                    <div
                      key={i}
                      className="p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-indigo-300 text-sm">{z.goal}</p>
                        <span className="text-xs bg-indigo-900/50 border border-indigo-800 text-indigo-400 px-2 py-0.5 rounded-full shrink-0">
                          {z.protocol}
                        </span>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">
                        {z.circuitDescription}
                      </pre>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400 mb-1">Private Witnesses:</p>
                          {z.witnessVariables?.map((w, j) => (
                            <p key={j} className="text-slate-300 font-mono">
                              • {w}
                            </p>
                          ))}
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Public Inputs:</p>
                          {z.publicInputs?.map((p, j) => (
                            <p key={j} className="text-slate-300 font-mono">
                              • {p}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>
                          Prover: <span className="text-slate-300">{z.proverTime}</span>
                        </span>
                        <span>
                          Verifier: <span className="text-slate-300">{z.verifierTime}</span>
                        </span>
                        <span>
                          Proof: <span className="text-slate-300">{z.proofSize}</span>
                        </span>
                      </div>
                      {z.implementation && (
                        <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {z.implementation}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Homomorphic Assessment */}
            {result.homomorphicAssessment && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Homomorphic Encryption Assessment
                </h3>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0 ${result.homomorphicAssessment.feasible ? "bg-green-900/50 border border-green-700" : "bg-slate-800 border border-slate-700"}`}
                  >
                    {result.homomorphicAssessment.feasible ? "✓" : "✗"}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-300">
                      {result.homomorphicAssessment.feasible
                        ? "Homomorphic operations are feasible"
                        : "Homomorphic operations not recommended for this use case"}
                    </p>
                    {result.homomorphicAssessment.recommendedScheme && (
                      <p className="text-sm">
                        Recommended scheme:{" "}
                        <span className="text-purple-300 font-mono">
                          {result.homomorphicAssessment.recommendedScheme}
                        </span>
                      </p>
                    )}
                    {result.homomorphicAssessment.operations?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {result.homomorphicAssessment.operations.map((op, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded"
                          >
                            {op}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Threat Timeline */}
            {result.threatTimeline?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Quantum Threat Timeline
                </h3>
                <QuantumTimeline entries={result.threatTimeline} />
              </section>
            )}

            {/* Migration Roadmap */}
            {result.migrationRoadmap?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Post-Quantum Migration Roadmap
                </h3>
                <div className="space-y-3">
                  {result.migrationRoadmap.map((phase, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${PRIORITY_COLORS[phase.priority] ?? "bg-slate-600"}`}
                      >
                        {phase.phase}
                      </div>
                      <div className="flex-1 pb-3 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-400 font-mono">{phase.timeline}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${URGENCY_COLORS[phase.priority] ?? URGENCY_COLORS.LOW}`}
                          >
                            {phase.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200">{phase.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
