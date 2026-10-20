"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GitBranch, Loader2, Sparkles, Rocket, Trophy, Scissors, Layers, Map, CheckCircle2, Package } from "lucide-react";
import { useState } from "react";

type IfmPairing = {
  id: string;
  fusionTitle: string;
  slug: string;
  toolA: { name: string; hub: string };
  toolB: { name: string; hub: string };
  status: string;
  score?: { total: number };
};

type RescoreResponse = {
  ok: boolean;
  ga4Synced?: boolean;
  scored: number;
  archived: number;
  leaderboard: Array<{
    id: string;
    fusionTitle: string;
    slug: string;
    status: string;
    score: number;
    sessions7d?: number;
    conversions7d?: number;
    toolA: string;
    toolB: string;
  }>;
  winners: Array<{ id: string; fusionTitle: string; score: number }>;
  pruneCandidates: Array<{ id: string; fusionTitle: string; score: number }>;
};

type CompoundResponse = {
  ok: boolean;
  scored: number;
  expanded: number;
  shipped: number;
  expandedPairingIds: string[];
  winners: Array<{
    id: string;
    fusionTitle: string;
    score: number;
    sessions7d?: number;
    conversions7d?: number;
  }>;
};

type RoadmapItem = {
  id: string;
  fusionTitle: string;
  score: number;
  status: string;
  microToolShipped?: boolean;
  sessions7d?: number;
  conversions7d?: number;
  productUrl?: string;
};

type RoadmapResponse = {
  items: RoadmapItem[];
  promoted?: number;
  microToolsShipped?: number;
  roadmap?: {
    autoPromote?: boolean;
    autoApprove?: boolean;
    autoShip?: boolean;
  };
};

type PreviewResponse = {
  families: Array<{ hub: string; count: number }>;
  pairings: IfmPairing[];
};

export default function OrbitIfmPage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [previewCount, setPreviewCount] = useState(5);

  const previewQuery = useQuery<PreviewResponse>({
    queryKey: ["orbit-ifm-preview", previewCount],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/ifm/pairings?count=${previewCount}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const createIfmRoute = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/routes/from-ifm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orbitProjectId: projectId.trim() || undefined,
          pairCount: previewCount,
          status: "active",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orbit-routes"] }),
  });

  const generateForProject = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/ifm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: previewCount }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
  });

  const shipForProject = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/ifm/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
  });

  const runSeoOps = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/seo-ops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
  });

  const rescoreForProject = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/ifm/rescore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPrune: false }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data as RescoreResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-ifm-project", projectId] });
    },
  });

  const compoundForProject = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/ifm/compound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expandCount: 2, shipExpanded: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data as CompoundResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-ifm-project", projectId] });
    },
  });

  const feedRoadmap = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPromote: 3, shipMicroTools: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data as RoadmapResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-roadmap", projectId] });
    },
  });

  const rescoreRoadmap = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap/rescore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orbit-roadmap", projectId] }),
  });

  const approveRoadmap = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orbit-roadmap", projectId] }),
  });

  const shipRoadmap = useMutation({
    mutationFn: async () => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orbit-roadmap", projectId] }),
  });

  const patchRoadmapConfig = useMutation({
    mutationFn: async (patch: { autoPromote?: boolean; autoApprove?: boolean; autoShip?: boolean }) => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orbit-roadmap", projectId] }),
  });

  const roadmapQuery = useQuery<RoadmapResponse>({
    queryKey: ["orbit-roadmap", projectId],
    enabled: Boolean(projectId.trim()),
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/roadmap`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const projectPairingsQuery = useQuery<{ pairings: IfmPairing[] }>({
    queryKey: ["orbit-ifm-project", projectId],
    enabled: Boolean(projectId.trim()),
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId.trim()}/ifm/generate`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const pairings = previewQuery.data?.pairings || [];
  const families = previewQuery.data?.families || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/orbit/routes"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          OaaS Routes
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6" />
          Intent Fusion Matrix
        </h1>
        <p className="text-muted-foreground">
          Cross-hub tool pairings → bridge pages → indexable intent fusion loops (IFM).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configure</CardTitle>
          <CardDescription>Bind IFM to a project and choose how many pairings per run.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1 space-y-1">
            <Label htmlFor="ifm-project">Orbit project ID</Label>
            <Input
              id="ifm-project"
              placeholder="Optional — for persist + route binding"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1">
            <Label htmlFor="ifm-count">Pairings</Label>
            <Input
              id="ifm-count"
              type="number"
              min={1}
              max={10}
              value={previewCount}
              onChange={(e) => setPreviewCount(Number(e.target.value) || 3)}
            />
          </div>
          <Button
            variant="outline"
            disabled={!projectId.trim() || generateForProject.isPending}
            onClick={() => generateForProject.mutate()}
          >
            {generateForProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save to project
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || shipForProject.isPending}
            onClick={() => shipForProject.mutate()}
          >
            {shipForProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Ship bridges
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || runSeoOps.isPending}
            onClick={() => runSeoOps.mutate()}
          >
            {runSeoOps.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            SEO ops gate
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || rescoreForProject.isPending}
            onClick={() => rescoreForProject.mutate()}
          >
            {rescoreForProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="mr-2 h-4 w-4" />
            )}
            Rescore IFM
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || compoundForProject.isPending}
            onClick={() => compoundForProject.mutate()}
          >
            {compoundForProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Layers className="mr-2 h-4 w-4" />
            )}
            Compound winners
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || feedRoadmap.isPending}
            onClick={() => feedRoadmap.mutate()}
          >
            {feedRoadmap.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Map className="mr-2 h-4 w-4" />
            )}
            Feed roadmap
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || rescoreRoadmap.isPending}
            onClick={() => rescoreRoadmap.mutate()}
          >
            {rescoreRoadmap.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="mr-2 h-4 w-4" />
            )}
            Rescore roadmap
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || approveRoadmap.isPending}
            onClick={() => approveRoadmap.mutate()}
          >
            {approveRoadmap.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve queue
          </Button>
          <Button
            variant="outline"
            disabled={!projectId.trim() || shipRoadmap.isPending}
            onClick={() => shipRoadmap.mutate()}
          >
            {shipRoadmap.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            Ship products
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/dashboard/orbit/matrix">
              <Rocket className="mr-2 h-4 w-4" />
              Scene matrix
            </Link>
          </Button>
          <Button disabled={createIfmRoute.isPending} onClick={() => createIfmRoute.mutate()}>
            {createIfmRoute.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="mr-2 h-4 w-4" />
            )}
            Create IFM route
          </Button>
        </CardContent>
      </Card>

      {families.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {families.map((f) => (
            <Badge key={f.hub} variant="outline">
              {f.hub}: {f.count} tools
            </Badge>
          ))}
        </div>
      ) : null}

      {rescoreForProject.data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Performance leaderboard
            </CardTitle>
            <CardDescription>
              Rescored {rescoreForProject.data.scored} pairing(s) — winners vs prune candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rescoreForProject.data.winners.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-green-700">Winners</p>
                <div className="space-y-2">
                  {rescoreForProject.data.winners.map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded border border-green-200 bg-green-50 px-3 py-2 text-sm">
                      <span>{w.fusionTitle}</span>
                      <Badge variant="secondary">{w.score}/100</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {rescoreForProject.data.pruneCandidates.length > 0 ? (
              <div>
                <p className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-700">
                  <Scissors className="h-4 w-4" />
                  Prune candidates
                </p>
                <div className="space-y-2">
                  {rescoreForProject.data.pruneCandidates.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                      <span>{p.fusionTitle}</span>
                      <Badge variant="outline">{p.score}/100</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {rescoreForProject.data.leaderboard.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Full ranking</p>
                <div className="space-y-1">
                  {rescoreForProject.data.leaderboard.slice(0, 10).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {i + 1}. {p.fusionTitle}{" "}
                        <span className="text-xs">({p.toolA} + {p.toolB})</span>
                      </span>
                      <span>{p.score}/100 · {p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {rescoreForProject.data.ga4Synced ? (
              <p className="text-xs text-muted-foreground">Per-pair GA4 attribution synced.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {compoundForProject.data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Winner compounding
            </CardTitle>
            <CardDescription>
              Expanded {compoundForProject.data.expanded} pairing(s), shipped{" "}
              {compoundForProject.data.shipped} bridge page(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {compoundForProject.data.winners.length > 0 ? (
              <div className="space-y-2">
                {compoundForProject.data.winners.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{w.fusionTitle}</span>
                    <span className="text-muted-foreground">
                      {w.score}/100
                      {w.sessions7d != null ? ` · ${w.sessions7d} sessions` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No winners to compound yet — rescore first.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {projectId.trim() && (roadmapQuery.data?.items?.length || feedRoadmap.data) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Product roadmap feed
            </CardTitle>
            <CardDescription>
              Proposed → approved → shipped. Micro-tools embed on promote; approval generates product specs; ship publishes fusion tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmapQuery.data?.roadmap ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {(["autoPromote", "autoApprove", "autoShip"] as const).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={roadmapQuery.data?.roadmap?.[key] ? "default" : "outline"}
                    disabled={!projectId.trim() || patchRoadmapConfig.isPending}
                    onClick={() =>
                      patchRoadmapConfig.mutate({
                        [key]: !roadmapQuery.data?.roadmap?.[key],
                      })
                    }
                  >
                    {key.replace("auto", "Auto ")}
                  </Button>
                ))}
              </div>
            ) : null}
            {feedRoadmap.data ? (
              <p className="text-sm text-green-600">
                Promoted {feedRoadmap.data.promoted ?? 0} item(s)
                {feedRoadmap.data.microToolsShipped != null
                  ? ` · ${feedRoadmap.data.microToolsShipped} micro-tool(s) shipped`
                  : ""}
              </p>
            ) : null}
            {(roadmapQuery.data?.items ?? []).slice(0, 10).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
                <span>{item.fusionTitle}</span>
                <span className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  {item.score}/100
                  {item.sessions7d != null ? ` · ${item.sessions7d} sessions` : ""}
                  <Badge variant="outline">{item.status}</Badge>
                  {item.microToolShipped ? (
                    <Badge variant="secondary">micro-tool</Badge>
                  ) : null}
                  {item.productUrl ? (
                    <Link href={item.productUrl} className="text-[#5B8DA8] hover:underline text-xs">
                      fusion tool
                    </Link>
                  ) : null}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {projectId.trim() && projectPairingsQuery.data?.pairings?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project pairings</CardTitle>
            <CardDescription>Persisted IFM pairings with latest scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...projectPairingsQuery.data.pairings]
              .sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0))
              .slice(0, 10)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{p.fusionTitle}</span>
                  <span className="flex items-center gap-2">
                    {p.score ? <Badge variant="secondary">{p.score.total}/100</Badge> : null}
                    <Badge variant="outline">{p.status}</Badge>
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview pairings</CardTitle>
          <CardDescription>Cross-hub combinations for this week&apos;s matrix.</CardDescription>
        </CardHeader>
        <CardContent>
          {previewQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : pairings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pairings available — need tools in 2+ hubs.</p>
          ) : (
            <div className="space-y-3">
              {pairings.map((p) => (
                <div key={p.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{p.fusionTitle}</span>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.toolA.name} ({p.toolA.hub}) + {p.toolB.name} ({p.toolB.hub})
                  </p>
                  <p className="text-xs text-muted-foreground">/{p.slug}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {generateForProject.data ? (
        <p className="text-sm text-green-600">
          Saved {generateForProject.data.created} pairing(s) to project.
        </p>
      ) : null}
      {shipForProject.data ? (
        <p className="text-sm text-green-600">
          Shipped {shipForProject.data.shipped} bridge page(s)
          {shipForProject.data.failed ? ` (${shipForProject.data.failed} failed quality gate)` : ""}.
        </p>
      ) : null}
      {runSeoOps.data ? (
        <p className={runSeoOps.data.ok ? "text-sm text-green-600" : "text-sm text-destructive"}>
          SEO ops gate: {runSeoOps.data.ok ? "passed" : "failed"}
          {!runSeoOps.data.ok && runSeoOps.data.issues?.length
            ? ` — ${runSeoOps.data.issues.slice(0, 2).join("; ")}`
            : null}
        </p>
      ) : null}
      {createIfmRoute.data?.route?.id ? (
        <p className="text-sm">
          Route created:{" "}
          <Link
            href={`/dashboard/orbit/routes/${createIfmRoute.data.route.id}`}
            className="text-primary hover:underline"
          >
            Open route
          </Link>
        </p>
      ) : null}
    </div>
  );
}
