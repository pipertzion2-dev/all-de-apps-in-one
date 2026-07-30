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
} from "lucide-react";

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
  noveltyScore?: number;
  trlLevel?: number;
  estimatedRnDMonths?: number;
  challenges?: string[];
};

type ApiResponse = {
  hybrids?: HybridResult[];
  scientific?: {
    scores: Scores;
    equations: { domainA: string; domainB: string; bridgingPrinciple: string };
    interpretation: string;
    biomimeticAnalogue: string;
    nextSteps: string[];
  };
  source?: string;
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
  const color =
    good >= 70 ? "bg-emerald-500" : good >= 45 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export function HybridizationCalculatorPanel({ compact = false }: { compact?: boolean }) {
  const [systemA, setSystemA] = useState({ name: "Vapor chamber cooler", description: "Flat copper two-phase heat spreader for SoC" });
  const [systemB, setSystemB] = useState({ name: "PCB power plane", description: "Hierarchical copper power delivery network" });
  const [mode, setMode] = useState<Mode>("complementary");
  const [depth, setDepth] = useState<Depth>("prototype");
  const [target, setTarget] = useState("Thin consumer electronics thermal + power module");
  const [loading, setLoading] = useState<"calc" | "ai" | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  const canRun = systemA.name.trim() && systemB.name.trim() && target.trim();

  const run = useCallback(
    async (calculatorOnly: boolean) => {
      if (!canRun) return;
      setLoading(calculatorOnly ? "calc" : "ai");
      setError("");
      try {
        const r = await fetch("/api/hardware/hybridize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            systemA: { name: systemA.name, description: systemA.description },
            systemB: { name: systemB.name, description: systemB.description },
            hybridizationMode: mode,
            targetApplication: target,
            scientificDepth: depth,
            calculatorOnly,
          }),
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

  const viabilityLabel = useMemo(() => {
    if (!scores) return null;
    if (scores.hybridViability >= 70) return "Strong candidate";
    if (scores.hybridViability >= 45) return "Viable with work";
    return "Research probe";
  }, [scores]);

  return (
    <div className={`space-y-6 ${compact ? "" : "max-w-5xl mx-auto"}`}>
      {!compact && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#00E5FF]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hybridization Calculator</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Scientific automatic scoring for crossing two hardware systems — domain affinity,
            topology fit, manufacturing readiness, TRL — then optional AI design synthesis.
          </p>
        </div>
      )}

      {!compact && (
        <div className="space-y-2">
          <HybridizationFieldScene scores={scores} mode={mode} height={300} />
          <p className="text-[11px] text-muted-foreground text-center">
            Dual-domain field — drag to tilt, click to pulse the bridge. Updates live from your scores.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System A</CardTitle>
            <CardDescription>First parent schematic or product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={systemA.name} onChange={(e) => setSystemA((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>What it does</Label>
              <Textarea
                className="min-h-[80px]"
                value={systemA.description}
                onChange={(e) => setSystemA((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System B</CardTitle>
            <CardDescription>Second parent to hybridize with</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={systemB.name} onChange={(e) => setSystemB((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>What it does</Label>
              <Textarea
                className="min-h-[80px]"
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
                    mode === m.id ? "border-[#00E5FF] bg-[#00E5FF]/10" : "border-border hover:bg-muted/50"
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
                <Button key={d} type="button" size="sm" variant={depth === d ? "default" : "outline"} onClick={() => setDepth(d)}>
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="gap-2 bg-[#00E5FF] text-black hover:bg-[#00C4DB]"
              disabled={!canRun || !!loading}
              onClick={() => void run(true)}
              data-testid="button-hybrid-calc"
            >
              {loading === "calc" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Instant scientific score
            </Button>
            <Button
              className="gap-2"
              variant="outline"
              disabled={!canRun || !!loading}
              onClick={() => void run(false)}
              data-testid="button-hybrid-ai"
            >
              {loading === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI design synthesis
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
            Instant score always works offline of the LLM. AI synthesis needs a configured model key and
            enriches the calculator with design write-ups.
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
              {result?.source ? <Badge variant="outline">{result.source}</Badge> : null}
              {result?.aiFallback ? <Badge variant="outline">AI fallback → calculator</Badge> : null}
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
                  <CardDescription className="line-clamp-3">{h.scientificBasis}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Manufacture: </span>
                    {h.manufacturingPathway}
                  </p>
                  {h.emergentProperties?.length ? (
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {h.emergentProperties.slice(0, 3).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {typeof h.noveltyScore === "number" ? <Badge variant="secondary">Novelty {h.noveltyScore}</Badge> : null}
                    {typeof h.trlLevel === "number" ? <Badge variant="outline">TRL {h.trlLevel}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link href="/dashboard/hardware-builder">
            <Button className="gap-2 mt-2">
              Continue in Hardware Builder <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
