"use client";

import { useMemo, useState } from "react";
import { AlertCircle, GitBranch, Loader2, Network, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DiscoveryMode = "composition" | "drift" | "coupling" | "all";

type GraphNode = {
  id: string;
  complexity: number;
  fanOut: number;
  fanIn: number;
  semanticCluster: string;
};

type GraphEdge = {
  from: string;
  to: string;
  mutualInfo: number;
  type: "data-flow" | "semantic" | "temporal";
};

type DiscoveryResult = {
  dependencyGraph: { nodes: GraphNode[]; edges: GraphEdge[] };
  emergentCompositions: {
    pattern: string;
    discoveredCapability: string;
    designerIntended: boolean;
    implementationNotes: string;
    usabilityScore: number;
    securityConsideration: string;
  }[];
  semanticDrift: {
    endpoint: string;
    documentedBehavior: string;
    observedBehavior: string;
    driftScore: number;
    driftType: string;
  }[];
  couplingMatrix: Record<string, Record<string, number>>;
  hiddenUseCases: {
    useCase: string;
    requiredEndpoints: string[];
    compositionPattern: string;
    noveltyScore: number;
    implementationSketch: string;
  }[];
  apiGenomeFingerprint: string;
  complexityScore: number;
  cohesionScore: number;
  recommendations: string[];
};

const EXAMPLE_SPEC = `POST /users
Creates a user and returns { id, email, plan }.

GET /users/{id}/permissions
Returns permissions for a user.

POST /resources
Creates a resource for a user. Requires userId and permission scope.

POST /events
Tracks product events. Returns eventId and riskScore.

GET /analytics/cohorts
Returns retention cohorts for a date range.`;

function DependencyGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const layout = useMemo(() => {
    const width = 720;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 118;
    const positions = new Map<string, { x: number; y: number }>();

    nodes.slice(0, 12).forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    return { width, height, positions };
  }, [nodes]);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
      <svg width={layout.width} height={layout.height} className="min-w-[720px]">
        <defs>
          <marker id="api-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#5BA8A0" opacity="0.8" />
          </marker>
        </defs>
        {edges.slice(0, 24).map((edge, index) => {
          const from = layout.positions.get(edge.from);
          const to = layout.positions.get(edge.to);
          if (!from || !to) return null;
          const stroke =
            edge.type === "data-flow"
              ? "#5BA8A0"
              : edge.type === "semantic"
                ? "#D782B2"
                : "#f97316";
          return (
            <line
              key={`${edge.from}-${edge.to}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={stroke}
              strokeOpacity={0.25 + Math.min(edge.mutualInfo, 1) * 0.5}
              strokeWidth={1 + Math.min(edge.mutualInfo, 1) * 3}
              markerEnd="url(#api-arrow)"
            />
          );
        })}
        {nodes.slice(0, 12).map((node) => {
          const pos = layout.positions.get(node.id);
          if (!pos) return null;
          const r = 14 + Math.min(node.complexity || 0.5, 1) * 12;
          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill="#5BA8A0"
                fillOpacity="0.18"
                stroke="#5BA8A0"
              />
              <text
                x={pos.x}
                y={pos.y + r + 14}
                fill="rgba(255,255,255,0.72)"
                fontSize="10"
                textAnchor="middle"
              >
                {node.id.length > 24 ? `${node.id.slice(0, 21)}...` : node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ApiEmergentDiscovery() {
  const [apiSpec, setApiSpec] = useState(EXAMPLE_SPEC);
  const [usageLogs, setUsageLogs] = useState("");
  const [targetDomain, setTargetDomain] = useState("AI workflow automation");
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const runDiscovery = async () => {
    setLoading(true);
    setError("");
    try {
      let parsedLogs: unknown[] | undefined;
      if (usageLogs.trim()) {
        parsedLogs = JSON.parse(usageLogs);
        if (!Array.isArray(parsedLogs)) throw new Error("Usage logs must be a JSON array.");
      }

      const res = await fetch("/api/api-builder/emergent-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          apiSpec,
          usageLogs: parsedLogs,
          discoveryMode,
          targetDomain,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Emergent discovery failed.");
      setResult(data.result as DiscoveryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Emergent discovery failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#e85d04]/30 bg-black/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#e85d04]/15 p-2 text-[#e85d04]">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Emergent Interface Archaeologist</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Finds hidden endpoint compositions, coupling hot spots, semantic drift, and a
              behavioral API genome fingerprint.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <Label>API spec or natural-language contract</Label>
            <Textarea
              value={apiSpec}
              onChange={(e) => setApiSpec(e.target.value)}
              className="min-h-[260px] font-mono text-xs"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target domain</Label>
              <Input value={targetDomain} onChange={(e) => setTargetDomain(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Discovery mode</Label>
              <select
                value={discoveryMode}
                onChange={(e) => setDiscoveryMode(e.target.value as DiscoveryMode)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Full analysis</option>
                <option value="composition">Emergent compositions</option>
                <option value="drift">Semantic drift</option>
                <option value="coupling">Coupling graph</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Optional usage logs JSON array</Label>
              <Textarea
                value={usageLogs}
                onChange={(e) => setUsageLogs(e.target.value)}
                placeholder='[{"endpoint":"/users","params":"...","response":"...","timestamp":"..."}]'
                className="min-h-[120px] font-mono text-xs"
              />
            </div>
            {error && (
              <div className="flex gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <Button
              onClick={runDiscovery}
              disabled={loading || apiSpec.trim().length < 8}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {loading ? "Mining hidden interfaces..." : "Discover Emergent Interfaces"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-5 border-t border-white/10 pt-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Genome</p>
                <p className="mt-2 break-all font-mono text-sm text-[#5BA8A0]">
                  {result.apiGenomeFingerprint}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Complexity</p>
                <p className="mt-2 text-2xl font-bold">
                  {result.complexityScore?.toFixed?.(1) ?? result.complexityScore}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cohesion</p>
                <p className="mt-2 text-2xl font-bold">
                  {result.cohesionScore?.toFixed?.(1) ?? result.cohesionScore}
                </p>
              </div>
            </div>

            <DependencyGraph
              nodes={result.dependencyGraph?.nodes ?? []}
              edges={result.dependencyGraph?.edges ?? []}
            />

            <div className="grid gap-3 lg:grid-cols-2">
              {result.emergentCompositions?.slice(0, 4).map((composition, index) => (
                <div
                  key={`${composition.pattern}-${index}`}
                  className="rounded-xl border border-[#e85d04]/20 bg-[#e85d04]/5 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold">{composition.discoveredCapability}</p>
                    <span className="rounded-full bg-[#e85d04]/15 px-2 py-0.5 text-xs text-[#e85d04]">
                      {composition.usabilityScore}/10
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{composition.pattern}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {composition.implementationNotes}
                  </p>
                  <p className="mt-2 text-xs text-amber-300">{composition.securityConsideration}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D782B2]" />
                  <p className="font-semibold">Hidden use cases</p>
                </div>
                <div className="space-y-3">
                  {result.hiddenUseCases?.slice(0, 5).map((useCase, index) => (
                    <div
                      key={`${useCase.useCase}-${index}`}
                      className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{useCase.useCase}</p>
                        <span className="text-xs text-[#5BA8A0]">
                          {useCase.noveltyScore}% novel
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {useCase.implementationSketch}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#5BA8A0]" />
                  <p className="font-semibold">Recommendations</p>
                </div>
                <div className="space-y-2">
                  {result.recommendations?.map((recommendation, index) => (
                    <p
                      key={`${recommendation}-${index}`}
                      className="rounded-lg bg-black/20 p-3 text-sm text-muted-foreground"
                    >
                      {recommendation}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
