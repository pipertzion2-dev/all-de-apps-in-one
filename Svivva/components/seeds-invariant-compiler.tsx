"use client";

import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type InvariantType = "safety" | "liveness" | "fairness" | "security" | "performance";

interface GeneratedApp {
  name: string;
  description: string;
  features: string[];
}

interface ExtractedInvariant {
  id: string;
  type: InvariantType;
  naturalLanguage: string;
  formalSpec: string;
  criticalityLevel: "P0" | "P1" | "P2" | "P3";
  sourceClause: string;
  category: string;
}

interface VerificationResult {
  appName: string;
  invariantId: string;
  verdict: "HOLDS" | "VIOLATED" | "UNKNOWN";
  confidence: number;
  counterexample: string;
  violationType: string;
  fixSuggestion: string;
  severityScore: number;
}

interface HealthScore {
  safety?: number;
  liveness?: number;
  fairness?: number;
  security?: number;
  performance?: number;
}

interface CompilerResult {
  extractedInvariants: ExtractedInvariant[];
  verificationResults: VerificationResult[];
  overallHealthMatrix: { [appName: string]: HealthScore };
  tlaSpecFragment: string;
  criticalViolations: string[];
  recommendedAppOrder: string[];
  specCoverageScore: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const INVARIANT_TYPE_CONFIG: Record<
  InvariantType,
  { label: string; color: string; description: string }
> = {
  safety: { label: "Safety", color: "#f87171", description: "Nothing bad ever happens" },
  liveness: { label: "Liveness", color: "#34d399", description: "Good things eventually happen" },
  fairness: { label: "Fairness", color: "#60a5fa", description: "Equitable resource access" },
  security: { label: "Security", color: "#f59e0b", description: "Information non-interference" },
  performance: {
    label: "Performance",
    color: "#a78bfa",
    description: "Bounded response guarantees",
  },
};

const CRITICALITY_COLORS: Record<string, string> = {
  P0: "#ef4444",
  P1: "#f97316",
  P2: "#eab308",
  P3: "#6b7280",
};

const VERDICT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  HOLDS: {
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.3)",
    text: "#34d399",
    dot: "#34d399",
  },
  VIOLATED: {
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    text: "#f87171",
    dot: "#ef4444",
  },
  UNKNOWN: {
    bg: "rgba(107,114,128,0.1)",
    border: "rgba(107,114,128,0.3)",
    text: "#9ca3af",
    dot: "#6b7280",
  },
};

// ── Health Heatmap ─────────────────────────────────────────────────────────────

function heatColor(value: number | undefined): string {
  if (value === undefined) return "rgba(255,255,255,0.04)";
  if (value >= 0.9) return "rgba(52,211,153,0.35)";
  if (value >= 0.75) return "rgba(52,211,153,0.2)";
  if (value >= 0.5) return "rgba(234,179,8,0.25)";
  if (value >= 0.25) return "rgba(249,115,22,0.3)";
  return "rgba(239,68,68,0.35)";
}

interface HealthMatrixProps {
  matrix: { [appName: string]: HealthScore };
  appNames: string[];
}

function HealthMatrix({ matrix, appNames }: HealthMatrixProps) {
  const types: InvariantType[] = ["safety", "liveness", "fairness", "security", "performance"];

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full">
        <thead>
          <tr>
            <th className="text-left text-muted-foreground/70 font-normal pb-2 pr-4 min-w-28">
              App
            </th>
            {types.map((t) => (
              <th
                key={t}
                className="pb-2 px-3 font-normal text-center"
                style={{ color: INVARIANT_TYPE_CONFIG[t].color }}
              >
                {INVARIANT_TYPE_CONFIG[t].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appNames.map((app) => (
            <tr key={app} className="border-t border-border/60">
              <td className="py-2 pr-4 text-muted-foreground font-medium truncate max-w-xs">
                {app}
              </td>
              {types.map((t) => {
                const val = matrix[app]?.[t];
                return (
                  <td key={t} className="py-2 px-3 text-center">
                    <div
                      className="mx-auto w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-semibold"
                      style={{
                        background: heatColor(val),
                        color:
                          val !== undefined ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {val !== undefined ? (val * 100).toFixed(0) + "%" : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Violation Card ─────────────────────────────────────────────────────────────

function ViolationCard({
  result,
  invariant,
}: {
  result: VerificationResult;
  invariant?: ExtractedInvariant;
}) {
  const [open, setOpen] = useState(false);
  const style = VERDICT_STYLES[result.verdict];

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: style.border, background: style.bg }}
    >
      <button
        type="button"
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={() => result.verdict !== "HOLDS" && setOpen((o) => !o)}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: style.dot }} />
        <span className="flex-1 font-mono text-xs text-foreground">{result.invariantId}</span>
        <span className="text-xs font-semibold" style={{ color: style.text }}>
          {result.verdict}
        </span>
        {result.verdict !== "HOLDS" && (
          <span className="text-muted-foreground/70 text-xs ml-2">{open ? "▲" : "▼"}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground/70">
          {(result.confidence * 100).toFixed(0)}% conf.
        </span>
      </button>

      {open && result.verdict !== "HOLDS" && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {invariant && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground/70">Invariant</div>
              <div className="font-mono text-xs text-muted-foreground bg-background rounded px-3 py-2 leading-relaxed">
                {invariant.formalSpec}
              </div>
            </div>
          )}
          {result.counterexample && (
            <div className="space-y-1">
              <div className="text-xs text-red-400">Counterexample</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {result.counterexample}
              </div>
            </div>
          )}
          {result.violationType && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground/70">Violation Type</div>
              <div className="text-sm text-muted-foreground">{result.violationType}</div>
            </div>
          )}
          {result.fixSuggestion && (
            <div className="space-y-1">
              <div className="text-xs text-emerald-400">Fix Suggestion</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {result.fixSuggestion}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground/70">Severity</div>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(result.severityScore / 10) * 100}%`,
                  background:
                    result.severityScore >= 7
                      ? "#ef4444"
                      : result.severityScore >= 4
                        ? "#f97316"
                        : "#eab308",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {result.severityScore.toFixed(1)}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SeedsInvariantCompiler() {
  const [spec, setSpec] = useState("");
  const [apps, setApps] = useState<GeneratedApp[]>([{ name: "", description: "", features: [] }]);
  const [selectedTypes, setSelectedTypes] = useState<Set<InvariantType>>(
    new Set(["safety", "security"]),
  );
  const [newFeatureText, setNewFeatureText] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompilerResult | null>(null);

  const toggleType = (t: InvariantType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const addApp = () => {
    setApps((a) => [...a, { name: "", description: "", features: [] }]);
    setNewFeatureText((t) => [...t, ""]);
  };

  const removeApp = (i: number) => {
    setApps((a) => a.filter((_, idx) => idx !== i));
    setNewFeatureText((t) => t.filter((_, idx) => idx !== i));
  };

  const updateApp = (i: number, patch: Partial<GeneratedApp>) => {
    setApps((a) => a.map((app, idx) => (idx === i ? { ...app, ...patch } : app)));
  };

  const addFeature = (appIdx: number) => {
    const text = newFeatureText[appIdx]?.trim();
    if (!text) return;
    updateApp(appIdx, { features: [...apps[appIdx].features, text] });
    setNewFeatureText((t) => t.map((v, i) => (i === appIdx ? "" : v)));
  };

  const removeFeature = (appIdx: number, featIdx: number) => {
    updateApp(appIdx, {
      features: apps[appIdx].features.filter((_, i) => i !== featIdx),
    });
  };

  const canSubmit =
    spec.trim().length > 20 && apps.some((a) => a.name.trim()) && selectedTypes.size > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seeds/invariant-compiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalSpec: spec,
          generatedApps: apps.filter((a) => a.name.trim()),
          invariantTypes: Array.from(selectedTypes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data as CompilerResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [spec, apps, selectedTypes, canSubmit]);

  const appNames = apps.filter((a) => a.name.trim()).map((a) => a.name);

  return (
    <div className="w-full rounded-2xl border border-[#5BA8A0]/30 bg-card text-foreground overflow-hidden shadow-sm">
      <div className="w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5BA8A0] to-[#6B2C4A] flex items-center justify-center text-lg text-white">
              ⊢
            </div>
            <h2 className="text-xl font-bold tracking-tight">Behavioral Invariant Compiler</h2>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Extract formal invariants from specs using abstract interpretation · verify apps ·
            generate TLA+
          </p>
        </div>

        {/* Spec Input */}
        <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Original Specification
          </label>
          <textarea
            rows={7}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#5BA8A0]/50 resize-none font-mono leading-relaxed"
            placeholder="Paste your natural-language specification here. E.g.: 'Users must provide explicit consent before any personal data is stored. The system must respond to all requests within 500ms under normal load. No user can access another user's private data…'"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
          />
        </div>

        {/* Apps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Generated Apps to Verify
            </h2>
            <button
              type="button"
              onClick={addApp}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[#5BA8A0]/40 transition-all"
            >
              + Add App
            </button>
          </div>

          {apps.map((app, i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#5BA8A0]/50"
                    placeholder="App name"
                    value={app.name}
                    onChange={(e) => updateApp(i, { name: e.target.value })}
                  />
                  <input
                    className="bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#5BA8A0]/50"
                    placeholder="Brief description"
                    value={app.description}
                    onChange={(e) => updateApp(i, { description: e.target.value })}
                  />
                </div>
                {apps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeApp(i)}
                    className="text-muted-foreground/50 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground/70">Features</div>
                <div className="flex flex-wrap gap-1.5">
                  {app.features.map((f, fi) => (
                    <span
                      key={fi}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-cyan-500/30 text-cyan-300"
                      style={{ background: "rgba(6,182,212,0.08)" }}
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(i, fi)}
                        className="opacity-50 hover:opacity-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#5BA8A0]/50"
                    placeholder="Add a feature…"
                    value={newFeatureText[i] ?? ""}
                    onChange={(e) =>
                      setNewFeatureText((t) => t.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature(i);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addFeature(i)}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-[#5BA8A0]/40 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Invariant Types */}
        <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Invariant Types to Extract
          </h2>
          <div className="flex flex-wrap gap-3">
            {(
              Object.entries(INVARIANT_TYPE_CONFIG) as [
                InvariantType,
                (typeof INVARIANT_TYPE_CONFIG)[InvariantType],
              ][]
            ).map(([type, cfg]) => {
              const active = selectedTypes.has(type);
              return (
                <label
                  key={type}
                  className="flex items-start gap-2.5 cursor-pointer rounded-xl p-3 transition-all border"
                  style={{
                    background: active ? cfg.color + "12" : "rgba(255,255,255,0.03)",
                    borderColor: active ? cfg.color + "50" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-current"
                    checked={active}
                    onChange={() => toggleType(type)}
                  />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: cfg.color }}>
                      {cfg.label}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{cfg.description}</div>
                  </div>
                </label>
              );
            })}
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
                ? "linear-gradient(135deg, #0e7490, #1d4ed8)"
                : "rgba(255,255,255,0.08)",
          }}
        >
          {loading ? "Compiling Invariants…" : "Compile & Verify Behavioral Invariants"}
        </button>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center space-y-1">
                <div className="text-2xl font-bold text-cyan-400">
                  {result.extractedInvariants.length}
                </div>
                <div className="text-xs text-muted-foreground/70">Invariants</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center space-y-1">
                <div className="text-2xl font-bold text-red-400">
                  {result.criticalViolations.length}
                </div>
                <div className="text-xs text-muted-foreground/70">Critical Violations</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center space-y-1">
                <div className="text-2xl font-bold text-emerald-400">
                  {(result.specCoverageScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground/70">Spec Coverage</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center space-y-1">
                <div className="text-2xl font-bold text-amber-400">
                  {result.verificationResults.filter((v) => v.verdict === "VIOLATED").length}
                </div>
                <div className="text-xs text-muted-foreground/70">Violations Found</div>
              </div>
            </div>

            {/* Critical Violations Banner */}
            {result.criticalViolations.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
                <div className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                  Critical Violations
                </div>
                {result.criticalViolations.map((v, i) => (
                  <div key={i} className="text-sm text-red-300 flex gap-2">
                    <span className="text-red-500 mt-0.5">!</span>
                    {v}
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Invariants */}
            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Extracted Invariants
              </h2>
              <div className="space-y-3">
                {result.extractedInvariants.map((inv) => {
                  const typeCfg = INVARIANT_TYPE_CONFIG[inv.type];
                  return (
                    <div
                      key={inv.id}
                      className="rounded-lg border border-border bg-black/20 p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {inv.id}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: typeCfg.color + "20", color: typeCfg.color }}
                        >
                          {typeCfg.label}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: CRITICALITY_COLORS[inv.criticalityLevel] + "20",
                            color: CRITICALITY_COLORS[inv.criticalityLevel],
                          }}
                        >
                          {inv.criticalityLevel}
                        </span>
                        <span className="text-xs text-muted-foreground/70">{inv.category}</span>
                      </div>
                      <p className="text-sm text-foreground/70">{inv.naturalLanguage}</p>
                      <div className="font-mono text-xs text-cyan-300 bg-background rounded px-3 py-2 leading-relaxed break-all">
                        {inv.formalSpec}
                      </div>
                      <p className="text-xs text-muted-foreground/70 italic">{inv.sourceClause}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification Matrix */}
            {appNames.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Verification Matrix
                </h2>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-muted-foreground/70 border-b border-border">
                        <th className="text-left font-normal pb-2 pr-4 min-w-24">Invariant</th>
                        {appNames.map((name) => (
                          <th
                            key={name}
                            className="text-center font-normal pb-2 px-2 whitespace-nowrap"
                          >
                            {name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.extractedInvariants.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/60">
                          <td className="py-2 pr-4 font-mono text-muted-foreground">{inv.id}</td>
                          {appNames.map((name) => {
                            const vr = result.verificationResults.find(
                              (v) => v.appName === name && v.invariantId === inv.id,
                            );
                            const s = VERDICT_STYLES[vr?.verdict ?? "UNKNOWN"];
                            return (
                              <td key={name} className="py-2 px-2 text-center">
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                                  style={{
                                    background: s.bg,
                                    color: s.text,
                                    border: `1px solid ${s.border}`,
                                  }}
                                >
                                  {vr?.verdict ?? "—"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Per-app violation details */}
            {appNames.map((name) => {
              const appResults = result.verificationResults.filter(
                (v) => v.appName === name && v.verdict !== "HOLDS",
              );
              if (appResults.length === 0) return null;
              return (
                <div
                  key={name}
                  className="rounded-xl border border-border bg-muted/40 p-5 space-y-3"
                >
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Violations · {name}
                  </h3>
                  <div className="space-y-2">
                    {appResults.map((vr) => (
                      <ViolationCard
                        key={vr.invariantId + vr.appName}
                        result={vr}
                        invariant={result.extractedInvariants.find((i) => i.id === vr.invariantId)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Health Matrix Heatmap */}
            {Object.keys(result.overallHealthMatrix).length > 0 && (
              <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Health Matrix
                </h2>
                <HealthMatrix matrix={result.overallHealthMatrix} appNames={appNames} />
                <div className="flex gap-4 text-xs text-muted-foreground/70 pt-1">
                  {[
                    { label: "≥90%", color: "rgba(52,211,153,0.35)" },
                    { label: "≥75%", color: "rgba(52,211,153,0.2)" },
                    { label: "≥50%", color: "rgba(234,179,8,0.25)" },
                    { label: "≥25%", color: "rgba(249,115,22,0.3)" },
                    { label: "<25%", color: "rgba(239,68,68,0.35)" },
                  ].map(({ label, color }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended App Order */}
            {result.recommendedAppOrder.length > 0 && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                  Recommended App Order (spec compliance)
                </h2>
                <ol className="space-y-2">
                  {result.recommendedAppOrder.map((name, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground/70">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: i === 0 ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)",
                          color: i === 0 ? "#34d399" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {name}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* TLA+ Spec Fragment */}
            {result.tlaSpecFragment && (
              <div className="rounded-xl border border-border bg-black/40 p-5 space-y-3">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  TLA+ Specification Fragment
                </h2>
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                  {result.tlaSpecFragment}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
