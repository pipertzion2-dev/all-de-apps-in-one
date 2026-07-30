"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  FlaskConical,
  Loader2,
  Sparkles,
  ArrowRight,
  Factory,
  Zap,
  Info,
  Crown,
  ListOrdered,
  Package,
  Truck,
} from "lucide-react";
import { FLAGSHIP_PRESETS } from "@/lib/hybridization/manufacture-plan";

const HybridizationFieldScene = dynamic(
  () => import("@/components/hybridization-field-scene").then((m) => m.HybridizationFieldScene),
  { ssr: false },
);

type Mode = "complementary" | "antagonistic" | "emergent" | "biomimetic";
type Depth = "prototype" | "research" | "production";

type Scores = {
  domainAffinity: number;
  topologyFit: number;
  materialInterfaceRisk: number;
  noveltyIndex: number;
  manufacturingReadiness: number;
  hybridViability: number;
  estimatedTrl: number;
  estimatedRnDMonths: number;
};

type HybridResult = {
  name: string;
  scientificBasis: string;
  manufacturingPathway: string;
  emergentProperties?: string[];
  performanceGains?: Record<string, string>;
  noveltyScore?: number;
  trlLevel?: number;
  estimatedRnDMonths?: number;
  challenges?: string[];
  coreComponents?: string[];
};

type ManufacturePlan = {
  productCodename: string;
  class: string;
  summary: string;
  targetFormFactor: string;
  thermalElectricalEnvelope: string;
  bom: Array<{
    part: string;
    material: string;
    process: string;
    qty: string;
    tolerance: string;
    notes: string;
  }>;
  processFlow: Array<{
    step: number;
    name: string;
    equipment: string;
    duration: string;
    criticalParams: string[];
    exitCriteria: string;
  }>;
  dfmGates: string[];
  supplierClasses: Array<{
    role: string;
    examples: string[];
    region: string;
    moqHint: string;
    leadTime: string;
  }>;
  costModel: {
    nreUsd: string;
    unitCostBandUsd: string;
    toolingUsd: string;
    yieldTarget: string;
    rampMonths: number;
  };
  qualification: string[];
};

type ApiResponse = {
  hybrids?: HybridResult[];
  scientific?: {
    scores: Scores;
    equations: { domainA: string; domainB: string; bridgingPrinciple: string };
    interpretation: string;
    biomimeticAnalogue: string;
    nextSteps: string[];
    grand?: boolean;
  };
  manufacturePlan?: ManufacturePlan;
  manufactureNarrative?: string;
  source?: string;
  grand?: boolean;
  aiFallback?: boolean;
  error?: string;
};

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "complementary", label: "Complementary", blurb: "Strengths fill gaps" },
  { id: "antagonistic", label: "Antagonistic", blurb: "Opposition → equilibrium" },
  { id: "emergent", label: "Emergent", blurb: "New capability appears" },
  { id: "biomimetic", label: "Biomimetic", blurb: "Nature’s template" },
];

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? 100 - value : value;
  const color = good >= 70 ? "bg-emerald-500" : good >= 45 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function HybridizationCalculatorPanel({ compact = false }: { compact?: boolean }) {
  const flagship = FLAGSHIP_PRESETS[0];
  const [systemA, setSystemA] = useState({
    name: flagship.systemA.name,
    description: flagship.systemA.description,
  });
  const [systemB, setSystemB] = useState({
    name: flagship.systemB.name,
    description: flagship.systemB.description,
  });
  const [mode, setMode] = useState<Mode>(flagship.mode);
  const [depth, setDepth] = useState<Depth>(flagship.depth);
  const [target, setTarget] = useState(flagship.target);
  const [loading, setLoading] = useState<"calc" | "ai" | "grand" | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  const canRun = systemA.name.trim() && systemB.name.trim() && target.trim();

  const applyPreset = (id: string) => {
    const p = FLAGSHIP_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setSystemA({ name: p.systemA.name, description: p.systemA.description });
    setSystemB({ name: p.systemB.name, description: p.systemB.description });
    setTarget(p.target);
    setMode(p.mode);
    setDepth(p.depth);
  };

  const run = useCallback(
    async (opts: { calculatorOnly: boolean; grand?: boolean; presetId?: string }) => {
      if (!opts.presetId && !canRun) return;
      setLoading(opts.grand ? "grand" : opts.calculatorOnly ? "calc" : "ai");
      setError("");
      try {
        const r = await fetch("/api/hardware/hybridize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            opts.presetId
              ? { presetId: opts.presetId, calculatorOnly: opts.calculatorOnly, grand: true }
              : {
                  systemA: { name: systemA.name, description: systemA.description },
                  systemB: { name: systemB.name, description: systemB.description },
                  hybridizationMode: mode,
                  targetApplication: target,
                  scientificDepth: opts.grand ? "production" : depth,
                  calculatorOnly: opts.calculatorOnly,
                  grand: !!opts.grand,
                },
          ),
        });
        const data = (await r.json()) as ApiResponse;
        if (!r.ok) throw new Error(data.error || "Hybridization failed");
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(null);
      }
    },
    [canRun, systemA, systemB, mode, depth, target],
  );

  const scores = result?.scientific?.scores;
  const hybrids = result?.hybrids ?? [];
  const manufacturePlan = result?.manufacturePlan;

  const viabilityLabel = useMemo(() => {
    if (!scores) return null;
    if (result?.grand || scores.hybridViability >= 75) return "Flagship pathway";
    if (scores.hybridViability >= 70) return "Strong candidate";
    if (scores.hybridViability >= 45) return "Viable with work";
    return "Research probe";
  }, [scores, result?.grand]);

  return (
    <div className={`space-y-6 ${compact ? "" : "max-w-5xl mx-auto"}`}>
      {!compact && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Crown className="w-6 h-6 text-[#FF2BD6]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Grand Hybridization Engine
            </h1>
            <Badge className="bg-[#FF2BD6]/15 text-[#FF2BD6] border-[#FF2BD6]/30" variant="outline">
              Pro Max–class cool chamber ready
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
            Automate flagship hybrids — vapor-chamber–class thin cooling, scientific scoring, and a
            full factory plan (BOM, process flow, DFM, suppliers, cost, qualification).
          </p>
        </div>
      )}

      {!compact && (
        <div className="space-y-2">
          <HybridizationFieldScene scores={scores} mode={mode} height={360} />
          <p className="text-[11px] text-muted-foreground text-center">
            Dual-domain field — drag to tilt, click to pulse. Scores reshape the bridge in real time.
          </p>
        </div>
      )}

      {!compact && (
        <div className="grid gap-2 sm:grid-cols-3">
          {FLAGSHIP_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p.id);
                void run({ calculatorOnly: true, grand: true, presetId: p.id });
              }}
              className="rounded-xl border border-[#FF2BD6]/25 bg-gradient-to-br from-[#FF2BD6]/10 to-[#00E5FF]/5 p-3 text-left hover:border-[#FF2BD6]/50 transition-colors"
              data-testid={`preset-${p.id}`}
            >
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF2BD6]" />
                {p.title}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{p.blurb}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System A</CardTitle>
            <CardDescription>First parent (e.g. vapor chamber)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={systemA.name}
                onChange={(e) => setSystemA((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>What it does</Label>
              <Textarea
                className="min-h-[90px]"
                value={systemA.description}
                onChange={(e) => setSystemA((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System B</CardTitle>
            <CardDescription>Second parent (e.g. graphite / power plane)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={systemB.name}
                onChange={(e) => setSystemB((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>What it does</Label>
              <Textarea
                className="min-h-[90px]"
                value={systemB.description}
                onChange={(e) => setSystemB((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Target application</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hybridization mode</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    mode === m.id
                      ? "border-[#00E5FF] bg-[#00E5FF]/10"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-[11px] text-muted-foreground">{m.blurb}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Scientific depth</Label>
            <div className="flex flex-wrap gap-2">
              {(["prototype", "research", "production"] as Depth[]).map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={depth === d ? "default" : "outline"}
                  onClick={() => setDepth(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
            <Button
              className="gap-2 bg-gradient-to-r from-[#FF2BD6] to-[#00E5FF] text-black font-semibold"
              disabled={!canRun || !!loading}
              onClick={() => void run({ calculatorOnly: true, grand: true })}
              data-testid="button-hybrid-grand"
            >
              {loading === "grand" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              Automate flagship + factory plan
            </Button>
            <Button
              className="gap-2 bg-[#00E5FF] text-black hover:bg-[#00C4DB]"
              disabled={!canRun || !!loading}
              onClick={() => void run({ calculatorOnly: true })}
              data-testid="button-hybrid-calc"
            >
              {loading === "calc" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Instant score
            </Button>
            <Button
              className="gap-2"
              variant="outline"
              disabled={!canRun || !!loading}
              onClick={() => void run({ calculatorOnly: false, grand: true })}
              data-testid="button-hybrid-ai"
            >
              {loading === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI grand synthesis
            </Button>
            <Link href="/dashboard/manufacture" className="sm:ml-auto">
              <Button variant="ghost" className="gap-2 w-full sm:w-auto">
                <Factory className="w-4 h-4" /> Manufacture Studio
              </Button>
            </Link>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Flagship automation always returns a deterministic manufacture plan (BOM, process, DFM,
            suppliers). AI synthesis adds narrative when a model key is configured.
          </p>
        </CardContent>
      </Card>

      {scores && (
        <Card className="border-[#00E5FF]/30">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5" /> Scientific readout
              </CardTitle>
              <Badge variant="secondary">{viabilityLabel}</Badge>
              {result?.grand ? <Badge className="bg-[#FF2BD6]/20 text-[#FF2BD6]">Grand</Badge> : null}
              {result?.source ? <Badge variant="outline">{result.source}</Badge> : null}
            </div>
            <CardDescription>{result?.scientific?.interpretation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreBar label="Hybrid viability" value={scores.hybridViability} />
              <ScoreBar label="Domain affinity" value={scores.domainAffinity} />
              <ScoreBar label="Topology fit" value={scores.topologyFit} />
              <ScoreBar label="Manufacturing readiness" value={scores.manufacturingReadiness} />
              <ScoreBar label="Novelty index" value={scores.noveltyIndex} />
              <ScoreBar label="Material interface risk" value={scores.materialInterfaceRisk} invert />
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge>TRL ~{scores.estimatedTrl}</Badge>
              <Badge variant="outline">~{scores.estimatedRnDMonths} R&amp;D months</Badge>
            </div>
            {result?.scientific?.equations && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1 font-mono">
                <p>A: {result.scientific.equations.domainA}</p>
                <p>B: {result.scientific.equations.domainB}</p>
                <p className="text-foreground/90 whitespace-pre-wrap font-sans text-sm pt-1">
                  {result.scientific.equations.bridgingPrinciple}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {manufacturePlan && (
        <Card className="border-[#FF2BD6]/35 shadow-[0_0_40px_rgba(255,43,214,0.08)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="w-5 h-5 text-[#FF2BD6]" /> Automated manufacture plan
            </CardTitle>
            <CardDescription>
              <span className="font-mono text-foreground/80">{manufacturePlan.productCodename}</span>
              {" · "}
              {manufacturePlan.class} — {manufacturePlan.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Form factor</p>
                <p>{manufacturePlan.targetFormFactor}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Envelope</p>
                <p>{manufacturePlan.thermalElectricalEnvelope}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Package className="w-4 h-4" /> BOM
              </h3>
              <div className="space-y-2">
                {manufacturePlan.bom.map((line) => (
                  <div key={line.part} className="rounded-lg border border-border/60 p-3">
                    <p className="font-medium">{line.part}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {line.material} · {line.process} · {line.qty}
                    </p>
                    <p className="text-xs mt-1">
                      Tol: {line.tolerance} — {line.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <ListOrdered className="w-4 h-4" /> Process flow
              </h3>
              <ol className="space-y-2">
                {manufacturePlan.processFlow.map((s) => (
                  <li key={s.step} className="rounded-lg border border-border/60 p-3">
                    <p className="font-medium">
                      {s.step}. {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.equipment} · {s.duration}
                    </p>
                    <p className="text-xs mt-1">Exit: {s.exitCriteria}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">DFM gates</h3>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  {manufacturePlan.dfmGates.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cost model</h3>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>NRE: {manufacturePlan.costModel.nreUsd}</li>
                  <li>Unit: {manufacturePlan.costModel.unitCostBandUsd}</li>
                  <li>Tooling: {manufacturePlan.costModel.toolingUsd}</li>
                  <li>Yield: {manufacturePlan.costModel.yieldTarget}</li>
                  <li>Ramp: ~{manufacturePlan.costModel.rampMonths} months</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4" /> Supplier classes
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {manufacturePlan.supplierClasses.map((s) => (
                  <div key={s.role} className="rounded-lg border border-border/60 p-3">
                    <p className="font-medium">{s.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.examples.join(" · ")}</p>
                    <p className="text-xs mt-1">
                      {s.region} · MOQ {s.moqHint} · LT {s.leadTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Qualification</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {manufacturePlan.qualification.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>

            {result?.manufactureNarrative ? (
              <p className="rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 p-3 text-sm">
                {result.manufactureNarrative}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {hybrids.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FF2BD6]" /> Hybrid designs
          </h2>
          <div className="grid gap-3">
            {hybrids.map((h, i) => (
              <Card key={`${h.name}-${i}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{h.name}</CardTitle>
                  <CardDescription className="line-clamp-4">{h.scientificBasis}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Manufacture: </span>
                    {h.manufacturingPathway}
                  </p>
                  {h.coreComponents?.length ? (
                    <p className="text-xs text-muted-foreground">
                      Stack: {h.coreComponents.slice(0, 8).join(" · ")}
                    </p>
                  ) : null}
                  {h.emergentProperties?.length ? (
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {h.emergentProperties.slice(0, 4).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {typeof h.noveltyScore === "number" ? (
                      <Badge variant="secondary">Novelty {h.noveltyScore}</Badge>
                    ) : null}
                    {typeof h.trlLevel === "number" ? (
                      <Badge variant="outline">TRL {h.trlLevel}</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/hardware-builder">
              <Button className="gap-2">
                Continue in Hardware Builder <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard/manufacture">
              <Button variant="outline" className="gap-2">
                Manufacture Studio <Factory className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
