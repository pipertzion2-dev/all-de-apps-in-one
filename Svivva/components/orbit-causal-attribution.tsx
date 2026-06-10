"use client";

import { useState } from "react";

interface Channel {
  name: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  timing: "before_launch" | "launch_week" | "ongoing" | "seasonal";
}

interface Outcome {
  metric: string;
  value: number;
  period: string;
}

interface DAGNode {
  id: string;
  type: "channel" | "outcome" | "confounder" | "instrument";
}

interface DAGEdge {
  from: string;
  to: string;
  type: "causal" | "confounded" | "mediated";
  strength: number;
}

interface CausalEffect {
  channel: string;
  doCalcEffect: number;
  correlationalEffect: number;
  biasAmount: number;
  biasSource: string;
  counterfactualImpact: string;
  transferEntropy: number;
  informationFlowDirection: "source" | "sink" | "neutral";
  trueROI: number;
  apparentROI: number;
  confidence: number;
}

interface Confounder {
  name: string;
  affectedChannels: string[];
  biasDirection: "upward" | "downward";
  magnitudeEstimate: string;
}

interface AllocationRec {
  channel: string;
  currentSpend: number;
  recommendedSpend: number;
  causalJustification: string;
}

interface CausalResult {
  causalDAG: { nodes: DAGNode[]; edges: DAGEdge[]; confounders: string[]; colliders: string[] };
  causalEffects: CausalEffect[];
  confounders: Confounder[];
  optimalAllocation: AllocationRec[];
  hiddenGemChannels: string[];
  overratedChannels: string[];
  keyInsight: string;
  actionableRecommendations: string[];
}

const TIMING_OPTIONS: Channel["timing"][] = ["before_launch", "launch_week", "ongoing", "seasonal"];

const NODE_COLORS: Record<string, string> = {
  channel: "#3b82f6",
  outcome: "#22c55e",
  confounder: "#f59e0b",
  instrument: "#a855f7",
};

const EDGE_COLORS: Record<string, string> = {
  causal: "#3b82f6",
  confounded: "#f97316",
  mediated: "#9ca3af",
};

function CausalDAGViz({ dag }: { dag: CausalResult["causalDAG"] }) {
  const { nodes, edges } = dag;
  if (!nodes || nodes.length === 0) return null;

  const width = 600;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 60;

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    positions[n.id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  function arrowHead(x1: number, y1: number, x2: number, y2: number, color: string, id: string) {
    return (
      <defs key={`def-${id}`}>
        <marker id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-2xl mx-auto"
      style={{ height: 340 }}
    >
      {edges.map((e, i) => {
        const p1 = positions[e.from];
        const p2 = positions[e.to];
        if (!p1 || !p2) return null;
        const color = EDGE_COLORS[e.type] ?? "#9ca3af";
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ox = (dx / dist) * 18;
        const oy = (dy / dist) * 18;
        const markerId = `e${i}`;
        return (
          <g key={i}>
            {arrowHead(p1.x, p1.y, p2.x, p2.y, color, markerId)}
            <line
              x1={p1.x + ox}
              y1={p1.y + oy}
              x2={p2.x - ox}
              y2={p2.y - oy}
              stroke={color}
              strokeWidth={Math.max(1, e.strength * 4)}
              strokeOpacity={0.75}
              strokeDasharray={
                e.type === "confounded" ? "5,4" : e.type === "mediated" ? "2,3" : "none"
              }
              markerEnd={`url(#arrow-${markerId})`}
            />
            <text
              x={(p1.x + p2.x) / 2}
              y={(p1.y + p2.y) / 2 - 4}
              fontSize="10"
              fill={color}
              textAnchor="middle"
              opacity={0.85}
            >
              {e.strength.toFixed(2)}
            </text>
          </g>
        );
      })}
      {nodes.map((n) => {
        const pos = positions[n.id];
        if (!pos) return null;
        const fill = NODE_COLORS[n.type] ?? "#6b7280";
        return (
          <g key={n.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={18}
              fill={fill}
              fillOpacity={0.85}
              stroke="#1e293b"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 30}
              fontSize="11"
              fill="#e2e8f0"
              textAnchor="middle"
              fontWeight="600"
            >
              {n.id.length > 14 ? n.id.slice(0, 12) + "…" : n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function OrbitCausalAttribution() {
  const [channels, setChannels] = useState<Channel[]>([
    {
      name: "Google Ads",
      spend: 5000,
      impressions: 120000,
      clicks: 3200,
      conversions: 140,
      timing: "ongoing",
    },
    { name: "SEO Organic", impressions: 45000, clicks: 2100, conversions: 95, timing: "ongoing" },
  ]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { metric: "signups", value: 312, period: "Q1 2024" },
  ]);
  const [confounders, setConfounders] = useState("iOS 17 release, seasonal demand spike");
  const [analysisDepth, setAnalysisDepth] = useState<"quick" | "deep" | "production">("deep");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CausalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addChannel() {
    setChannels((c) => [...c, { name: "", timing: "ongoing" }]);
  }
  function removeChannel(i: number) {
    setChannels((c) => c.filter((_, idx) => idx !== i));
  }
  function updateChannel(i: number, field: keyof Channel, value: string | number) {
    setChannels((c) => c.map((ch, idx) => (idx === i ? { ...ch, [field]: value } : ch)));
  }

  function addOutcome() {
    setOutcomes((o) => [...o, { metric: "", value: 0, period: "" }]);
  }
  function removeOutcome(i: number) {
    setOutcomes((o) => o.filter((_, idx) => idx !== i));
  }
  function updateOutcome(i: number, field: keyof Outcome, value: string | number) {
    setOutcomes((o) => o.map((out, idx) => (idx === i ? { ...out, [field]: value } : out)));
  }

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orbit/causal-attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels,
          outcomes,
          confounders: confounders
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          analysisDepth,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      setResult(data.result as CausalResult);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor = (c: number) =>
    c >= 0.8 ? "text-green-400" : c >= 0.6 ? "text-yellow-400" : "text-red-400";

  const roiDiff = (apparent: number, actual: number) => {
    const diff = apparent - actual;
    if (diff > 0.5) return "text-red-400";
    if (diff < -0.5) return "text-green-400";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 tracking-tight">
            ORBIT — Causal Attribution Engine
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Do-calculus · Causal DAG · Transfer Entropy · Counterfactual ROI
          </p>
        </div>

        {/* Channels */}
        <section className="bg-slate-900 rounded-xl p-5 space-y-4 border border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-100">Marketing Channels</h2>
            <button
              onClick={addChannel}
              className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Channel
            </button>
          </div>
          <div className="space-y-3">
            {channels.map((ch, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 items-center">
                <input
                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Channel name"
                  value={ch.name}
                  onChange={(e) => updateChannel(i, "name", e.target.value)}
                />
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Spend $"
                  type="number"
                  value={ch.spend ?? ""}
                  onChange={(e) => updateChannel(i, "spend", parseFloat(e.target.value) || 0)}
                />
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Clicks"
                  type="number"
                  value={ch.clicks ?? ""}
                  onChange={(e) => updateChannel(i, "clicks", parseInt(e.target.value) || 0)}
                />
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Conversions"
                  type="number"
                  value={ch.conversions ?? ""}
                  onChange={(e) => updateChannel(i, "conversions", parseInt(e.target.value) || 0)}
                />
                <select
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  value={ch.timing}
                  onChange={(e) => updateChannel(i, "timing", e.target.value as Channel["timing"])}
                >
                  {TIMING_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeChannel(i)}
                  className="text-slate-500 hover:text-red-400 text-sm justify-self-center transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Outcomes */}
        <section className="bg-slate-900 rounded-xl p-5 space-y-4 border border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-100">Outcomes</h2>
            <button
              onClick={addOutcome}
              className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Outcome
            </button>
          </div>
          <div className="space-y-3">
            {outcomes.map((out, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Metric (e.g. signups)"
                  value={out.metric}
                  onChange={(e) => updateOutcome(i, "metric", e.target.value)}
                />
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Value"
                  type="number"
                  value={out.value}
                  onChange={(e) => updateOutcome(i, "value", parseFloat(e.target.value) || 0)}
                />
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Period (e.g. Q1 2024)"
                  value={out.period}
                  onChange={(e) => updateOutcome(i, "period", e.target.value)}
                />
                <button
                  onClick={() => removeOutcome(i)}
                  className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Config */}
        <section className="bg-slate-900 rounded-xl p-5 space-y-4 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Analysis Config</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">External Confounders</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                placeholder="Comma-separated external factors: iOS release, competitor launch..."
                value={confounders}
                onChange={(e) => setConfounders(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Analysis Depth</label>
              <div className="flex gap-2 flex-wrap">
                {(["quick", "deep", "production"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setAnalysisDepth(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      analysisDepth === d
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={runAnalysis}
          disabled={loading || channels.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? "Running Causal Analysis…" : "Run Causal Attribution Analysis"}
        </button>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Key Insight */}
            <section className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-800 rounded-xl p-5">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
                Key Causal Insight
              </p>
              <p className="text-slate-100 text-base leading-relaxed">{result.keyInsight}</p>
            </section>

            {/* Overrated vs Hidden Gems */}
            <div className="grid grid-cols-2 gap-4">
              <section className="bg-slate-900 border border-red-900/50 rounded-xl p-4">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">
                  Overrated Channels
                </p>
                {result.overratedChannels?.length > 0 ? (
                  <ul className="space-y-1">
                    {result.overratedChannels.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">None identified</p>
                )}
              </section>
              <section className="bg-slate-900 border border-green-900/50 rounded-xl p-4">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">
                  Hidden Gem Channels
                </p>
                {result.hiddenGemChannels?.length > 0 ? (
                  <ul className="space-y-1">
                    {result.hiddenGemChannels.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">None identified</p>
                )}
              </section>
            </div>

            {/* Causal DAG */}
            {result.causalDAG?.nodes?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">Causal DAG</h3>
                <CausalDAGViz dag={result.causalDAG} />
                <div className="flex gap-5 justify-center mt-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-500 inline-block" />
                    Causal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-0.5 bg-orange-500 inline-block border-dashed"
                      style={{
                        borderTopWidth: 1,
                        borderStyle: "dashed",
                        background: "transparent",
                        borderColor: "#f97316",
                      }}
                    />
                    Confounded
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-gray-500 inline-block" />
                    Mediated
                  </span>
                </div>
                {result.causalDAG.colliders?.length > 0 && (
                  <p className="text-xs text-amber-400 mt-2 text-center">
                    Colliders detected: {result.causalDAG.colliders.join(", ")}
                  </p>
                )}
              </section>
            )}

            {/* Causal Effects Table */}
            {result.causalEffects?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Causal Effects Analysis
                </h3>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700">
                      <th className="pb-2 pr-4">Channel</th>
                      <th className="pb-2 pr-4">True ROI</th>
                      <th className="pb-2 pr-4">Apparent ROI</th>
                      <th className="pb-2 pr-4">Bias</th>
                      <th className="pb-2 pr-4">Do-Calc Effect</th>
                      <th className="pb-2 pr-4">Transfer Entropy</th>
                      <th className="pb-2 pr-4">Flow</th>
                      <th className="pb-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.causalEffects.map((e, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/40">
                        <td className="py-2 pr-4 font-medium text-slate-200">{e.channel}</td>
                        <td className="py-2 pr-4 text-green-400 font-mono">
                          {e.trueROI?.toFixed(2)}x
                        </td>
                        <td className={`py-2 pr-4 font-mono ${roiDiff(e.apparentROI, e.trueROI)}`}>
                          {e.apparentROI?.toFixed(2)}x
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${e.biasAmount > 0.2 ? "bg-red-900/50 text-red-300" : "bg-slate-800 text-slate-400"}`}
                          >
                            {e.biasAmount?.toFixed(2)} ({e.biasSource})
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-blue-300">
                          {e.doCalcEffect?.toFixed(3)}
                        </td>
                        <td className="py-2 pr-4 font-mono text-purple-300">
                          {e.transferEntropy?.toFixed(3)}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-xs font-medium ${e.informationFlowDirection === "source" ? "text-blue-400" : e.informationFlowDirection === "sink" ? "text-orange-400" : "text-slate-400"}`}
                          >
                            {e.informationFlowDirection}
                          </span>
                        </td>
                        <td
                          className={`py-2 font-mono font-semibold ${confidenceColor(e.confidence)}`}
                        >
                          {(e.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 space-y-2">
                  {result.causalEffects.map((e, i) => (
                    <p key={i} className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-300 font-medium">{e.channel}:</span>{" "}
                      {e.counterfactualImpact}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Optimal Allocation */}
            {result.optimalAllocation?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Causal Budget Reallocation
                </h3>
                <div className="space-y-3">
                  {result.optimalAllocation.map((a, i) => {
                    const delta = a.recommendedSpend - a.currentSpend;
                    const pct = a.currentSpend > 0 ? Math.round((delta / a.currentSpend) * 100) : 0;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-3 bg-slate-800/60 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-200 text-sm">{a.channel}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{a.causalJustification}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm font-mono">
                              ${(a.currentSpend ?? 0).toLocaleString()}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="text-slate-100 text-sm font-mono font-semibold">
                              ${(a.recommendedSpend ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-slate-400"}`}
                          >
                            {delta >= 0 ? "+" : ""}
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Confounders */}
            {result.confounders?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Identified Confounders
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {result.confounders.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg"
                    >
                      <p className="font-medium text-amber-300 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Affects: {c.affectedChannels?.join(", ")}
                      </p>
                      <p className="text-xs text-slate-400">
                        Bias:{" "}
                        <span
                          className={
                            c.biasDirection === "upward" ? "text-red-400" : "text-blue-400"
                          }
                        >
                          {c.biasDirection}
                        </span>
                        {" · "}
                        {c.magnitudeEstimate}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {result.actionableRecommendations?.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-3">
                  Actionable Recommendations
                </h3>
                <ol className="space-y-2">
                  {result.actionableRecommendations.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="text-blue-400 font-semibold shrink-0">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
