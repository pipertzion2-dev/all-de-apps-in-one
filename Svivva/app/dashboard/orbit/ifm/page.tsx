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
import { ArrowLeft, GitBranch, Loader2, Sparkles, Rocket } from "lucide-react";
import { useState } from "react";

type IfmPairing = {
  id: string;
  fusionTitle: string;
  slug: string;
  toolA: { name: string; hub: string };
  toolB: { name: string; hub: string };
  status: string;
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
