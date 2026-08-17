"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Beaker,
  Combine,
  FlaskConical,
  Loader2,
  Store,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import type { HybridizationMode, HybridizationResult } from "@/lib/hybridization/types";
import type { HybridParentRef } from "@/lib/hybridization/feature-lab";
import { formatLineage } from "@/lib/hybridization/feature-lab";

type CatalogFeature = {
  id: string;
  title: string;
  shortTitle: string;
  channelLabel: string;
  href: string;
  bus: string;
  description: string;
  mainBus: string;
};

type CatalogPair = {
  id: string;
  aId: string;
  bId: string;
  aLabel: string;
  bLabel: string;
};

type Catalog = {
  maxOrder: number;
  featureCount: number;
  pairCount: number;
  features: CatalogFeature[];
  pairs: CatalogPair[];
};

type BlendResponse = {
  order: 1 | 2;
  lineage: string[];
  usedEngine: boolean;
  parentA: HybridParentRef;
  parentB: HybridParentRef;
  targetApplication: string;
  result: HybridizationResult;
  error?: string;
};

type StoredArtifact = {
  id: string;
  order: 1 | 2;
  listed: boolean;
  createdAt: string;
  mode: HybridizationMode;
  targetApplication: string;
  lineage: string[];
  parentA: HybridParentRef;
  parentB: HybridParentRef;
  name: string;
  usedEngine: boolean;
  result: HybridizationResult;
};

const STORAGE_KEY = "zzai.hybrid-lab.v1";
const MODES: HybridizationMode[] = ["emergent", "complementary", "antagonistic", "biomimetic"];

function loadArtifacts(): StoredArtifact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredArtifact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArtifacts(next: StoredArtifact[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function artifactToParent(artifact: StoredArtifact): HybridParentRef {
  const optimal =
    artifact.result.hybrids[artifact.result.optimalHybridIndex] || artifact.result.hybrids[0];
  return {
    kind: "hybrid",
    id: artifact.id,
    label: artifact.name,
    description:
      optimal?.emergentBehavior || optimal?.scientificBasis || artifact.targetApplication,
    order: artifact.order,
    lineage: artifact.lineage,
    components: optimal?.coreComponents,
  };
}

function HybridResultCard({
  name,
  order,
  lineage,
  usedEngine,
  result,
}: {
  name: string;
  order: 1 | 2;
  lineage: string[];
  usedEngine: boolean;
  result: HybridizationResult;
}) {
  const hybrid = result.hybrids[result.optimalHybridIndex] || result.hybrids[0];
  if (!hybrid) return null;
  return (
    <Card className="border-[#6B2C4E]/30" data-testid="card-hybrid-result">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#6B2C4E] text-white">H{order === 2 ? "²" : "¹"}</Badge>
          <Badge variant="outline">{usedEngine ? "engine" : "scientific fallback"}</Badge>
          <span className="text-xs text-muted-foreground">{formatLineage(lineage)}</span>
        </div>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{hybrid.emergentBehavior}</p>
        {hybrid.emergentProperties?.length > 0 && (
          <ul className="text-sm space-y-1 list-disc pl-4">
            {hybrid.emergentProperties.slice(0, 4).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Bridge: {result.domainBridgingPrinciple.slice(0, 220)}
          {result.domainBridgingPrinciple.length > 220 ? "…" : ""}
        </p>
      </CardContent>
    </Card>
  );
}

export default function HybridLabPage() {
  const [tab, setTab] = useState("lab");
  const [selected, setSelected] = useState<string[]>([]);
  const [marketPick, setMarketPick] = useState<string[]>([]);
  const [mode, setMode] = useState<HybridizationMode>("emergent");
  const [target, setTarget] = useState("");
  const [pairQuery, setPairQuery] = useState("");
  const [artifacts, setArtifacts] = useState<StoredArtifact[]>([]);
  const [lastBlend, setLastBlend] = useState<BlendResponse | null>(null);

  useEffect(() => {
    setArtifacts(loadArtifacts());
  }, []);

  const persist = useCallback((next: StoredArtifact[]) => {
    setArtifacts(next);
    saveArtifacts(next);
  }, []);

  const catalogQuery = useQuery<Catalog>({
    queryKey: ["/api/hybrid-lab"],
    queryFn: () => fetch("/api/hybrid-lab").then((r) => r.json()),
  });
  const catalog = catalogQuery.data;
  const features = catalog?.features || [];
  const featureById = useMemo(() => new Map(features.map((f) => [f.id, f])), [features]);

  const blendMutation = useMutation({
    mutationFn: async (body: {
      parentA: HybridParentRef | { kind: "feature"; id: string };
      parentB: HybridParentRef | { kind: "feature"; id: string };
      hybridizationMode: HybridizationMode;
      targetApplication?: string;
    }) => {
      const res = await authFetch("/api/hybrid-lab/blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as BlendResponse;
      if (!res.ok) throw new Error(data.error || "Blend failed");
      return data;
    },
    onSuccess: (data) => {
      setLastBlend(data);
      setTab("lab");
    },
  });

  const toggleChannel = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const toggleMarket = (id: string) => {
    setMarketPick((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const runFeatureBlend = (aId: string, bId: string) => {
    blendMutation.mutate({
      parentA: { kind: "feature", id: aId },
      parentB: { kind: "feature", id: bId },
      hybridizationMode: mode,
      targetApplication: target.trim() || undefined,
    });
  };

  const saveLast = (listed: boolean) => {
    if (!lastBlend) return;
    const hybrid =
      lastBlend.result.hybrids[lastBlend.result.optimalHybridIndex] || lastBlend.result.hybrids[0];
    const artifact: StoredArtifact = {
      id: crypto.randomUUID(),
      order: lastBlend.order,
      listed,
      createdAt: new Date().toISOString(),
      mode,
      targetApplication: lastBlend.targetApplication,
      lineage: lastBlend.lineage,
      parentA: lastBlend.parentA,
      parentB: lastBlend.parentB,
      name: hybrid?.name || `${lastBlend.parentA.label} × ${lastBlend.parentB.label}`,
      usedEngine: lastBlend.usedEngine,
      result: lastBlend.result,
    };
    persist([artifact, ...artifacts]);
  };

  const listed = artifacts.filter((a) => a.listed);
  const h1Count = artifacts.filter((a) => a.order === 1).length;
  const h2Count = artifacts.filter((a) => a.order === 2).length;

  const filteredPairs = useMemo(() => {
    const q = pairQuery.trim().toLowerCase();
    const pairs = catalog?.pairs || [];
    if (!q) return pairs.slice(0, 24);
    return pairs
      .filter(
        (p) =>
          p.aLabel.toLowerCase().includes(q) ||
          p.bLabel.toLowerCase().includes(q) ||
          p.aId.includes(q) ||
          p.bId.includes(q),
      )
      .slice(0, 40);
  }, [catalog?.pairs, pairQuery]);

  const parentA = selected[0] ? featureById.get(selected[0]) : undefined;
  const parentB = selected[1] ? featureById.get(selected[1]) : undefined;

  return (
    <div className="max-w-5xl space-y-6" id="hybrid-lab" data-testid="page-hybrid-lab">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#6B2C4E]/15 flex items-center justify-center">
            <Combine className="w-5 h-5 text-[#6B2C4E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-hybrid-lab-title">
              Hybrid² Lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Marketplace + laboratory for features of features. Any channel × any channel is H¹.
              Two listed blends become hybridization to the 2nd power.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#5B8DA8]">{catalog?.featureCount ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Channels</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#6B2C4E]">{catalog?.pairCount ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">H¹ recipes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{h1Count}</div>
            <div className="text-xs text-muted-foreground mt-1">Saved H¹</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{h2Count}</div>
            <div className="text-xs text-muted-foreground mt-1">Saved H²</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="tabs-hybrid-lab">
          <TabsTrigger value="lab" className="gap-1.5" data-testid="tab-laboratory">
            <Beaker className="w-3.5 h-3.5" />
            Laboratory
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-1.5" data-testid="tab-marketplace">
            <Store className="w-3.5 h-3.5" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lab" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="font-semibold">Pick two channels</h2>
                <p className="text-sm text-muted-foreground">
                  Every ZZAI module can hybridize with every other module. The FX insert fuses their
                  contracts into one product.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => {
                  const on = selected.includes(f.id);
                  const slot = selected[0] === f.id ? "A" : selected[1] === f.id ? "B" : null;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleChannel(f.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "border-[#6B2C4E] bg-[#6B2C4E] text-white"
                          : "border-border bg-background/40 text-muted-foreground hover:border-[#6B2C4E]/50"
                      }`}
                      data-testid={`button-channel-${f.id}`}
                    >
                      {slot ? `${slot} · ` : ""}
                      {f.channelLabel} {f.shortTitle}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="text-sm min-w-0 flex-1">
                  {parentA && parentB ? (
                    <span className="font-medium">
                      {parentA.shortTitle} × {parentB.shortTitle}
                      <span className="text-muted-foreground font-normal"> → H¹</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select two different channels</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={mode === m ? "default" : "outline"}
                      className={
                        mode === m
                          ? "bg-[#5B8DA8] h-8 text-xs capitalize"
                          : "h-8 text-xs capitalize"
                      }
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Optional target — e.g. a deployable app that seeds Protect-sealed Play patches"
                data-testid="input-hybrid-target"
              />
              <Button
                className="gap-2 bg-[#6B2C4E] hover:bg-[#6B2C4E]/90"
                disabled={!parentA || !parentB || blendMutation.isPending}
                onClick={() => parentA && parentB && runFeatureBlend(parentA.id, parentB.id)}
                data-testid="button-blend-h1"
              >
                {blendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
                Blend channels
              </Button>
              {blendMutation.isError && (
                <p className="text-sm text-destructive" data-testid="text-blend-error">
                  {(blendMutation.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>

          {lastBlend && (
            <div className="space-y-3">
              <HybridResultCard
                name={
                  lastBlend.result.hybrids[lastBlend.result.optimalHybridIndex]?.name ||
                  `${lastBlend.parentA.label} × ${lastBlend.parentB.label}`
                }
                order={lastBlend.order}
                lineage={lastBlend.lineage}
                usedEngine={lastBlend.usedEngine}
                result={lastBlend.result}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveLast(false)}
                  data-testid="button-save-blend"
                >
                  Save to lab
                </Button>
                <Button
                  className="gap-2 bg-[#5B8DA8]"
                  onClick={() => {
                    saveLast(true);
                    setTab("market");
                  }}
                  data-testid="button-list-blend"
                >
                  <Store className="w-4 h-4" />
                  List on marketplace
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div>
                <h2 className="font-semibold">Recipe floor — every channel × every channel</h2>
                <p className="text-sm text-muted-foreground">
                  {catalog?.pairCount ?? 0} first-order recipes. Blend one to mint an H¹ listing,
                  then fuse two listings for H².
                </p>
              </div>
              <Input
                value={pairQuery}
                onChange={(e) => setPairQuery(e.target.value)}
                placeholder="Search recipes — seeds, play, protect…"
                data-testid="input-recipe-search"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredPairs.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                  >
                    <span className="text-xs min-w-0 truncate">
                      {p.aLabel} × {p.bLabel}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 text-xs"
                      disabled={blendMutation.isPending}
                      onClick={() => runFeatureBlend(p.aId, p.bId)}
                    >
                      Blend
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div>
                <h2 className="font-semibold">Listed blends — hybridization²</h2>
                <p className="text-sm text-muted-foreground">
                  Pick two listed products. The lab treats each as a feature-of-features and fuses
                  them into H².
                </p>
              </div>
              {listed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No listings yet. Blend two channels in the laboratory, then list the result here.
                </p>
              ) : (
                <div className="space-y-2">
                  {listed.map((item) => {
                    const on = marketPick.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMarket(item.id)}
                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                          on
                            ? "border-[#6B2C4E] bg-[#6B2C4E]/10"
                            : "border-border/60 hover:border-[#6B2C4E]/40"
                        }`}
                        data-testid={`button-listing-${item.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge variant="outline">H{item.order === 2 ? "²" : "¹"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatLineage(item.lineage)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              <Button
                className="gap-2 bg-[#6B2C4E] hover:bg-[#6B2C4E]/90"
                disabled={marketPick.length !== 2 || blendMutation.isPending}
                onClick={() => {
                  const a = artifacts.find((x) => x.id === marketPick[0]);
                  const b = artifacts.find((x) => x.id === marketPick[1]);
                  if (!a || !b) return;
                  blendMutation.mutate({
                    parentA: artifactToParent(a),
                    parentB: artifactToParent(b),
                    hybridizationMode: mode,
                    targetApplication: target.trim() || undefined,
                  });
                }}
                data-testid="button-blend-h2"
              >
                {blendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Hybridize²
              </Button>
            </CardContent>
          </Card>

          {artifacts.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-semibold">Lab inventory</h2>
                {artifacts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        H{item.order === 2 ? "²" : "¹"} · {formatLineage(item.lineage)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={item.listed ? "default" : "outline"}
                      className={item.listed ? "h-8 bg-[#5B8DA8] text-xs" : "h-8 text-xs"}
                      onClick={() =>
                        persist(
                          artifacts.map((a) =>
                            a.id === item.id ? { ...a, listed: !a.listed } : a,
                          ),
                        )
                      }
                    >
                      {item.listed ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Listed
                        </>
                      ) : (
                        "List"
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
