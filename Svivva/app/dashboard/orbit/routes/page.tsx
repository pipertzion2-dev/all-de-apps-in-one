"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, GitBranch, Loader2, RefreshCw } from "lucide-react";

type OrbitRouteRow = {
  id: string;
  name: string;
  description?: string | null;
  orbitProjectId?: string | null;
  sourceChannel: string;
  status: string;
  lastRunAt?: string | null;
  lastError?: string | null;
  destinations: Array<{ channel: string; order: number }>;
};

export default function OrbitRoutesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<{ routes: OrbitRouteRow[]; templates?: unknown[] }>({
    queryKey: ["orbit-routes"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/routes?templates=1");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const syncWorkspace = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/workspace/sync-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createRoutes: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-routes"] });
      qc.invalidateQueries({ queryKey: ["orbit-routes-panel"] });
    },
  });

  const routes = data?.routes || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/orbit"
            className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Orbit Launchpad
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <GitBranch className="h-6 w-6" />
            OaaS Routes
          </h1>
          <p className="text-muted-foreground">
            Patch-bay workflows chaining ingest → plan → generate → index → distribute → analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={syncWorkspace.isPending}
            onClick={() => syncWorkspace.mutate()}
          >
            {syncWorkspace.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync workspace
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/orbit/ifm">Intent Fusion Matrix</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/orbit/matrix">Scene matrix</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/orbit/routes/new">Create route</Link>
          </Button>
        </div>
      </div>

      {syncWorkspace.data ? (
        <p className="text-sm text-muted-foreground">
          Synced {syncWorkspace.data.routesCreated ?? 0} route(s) from{" "}
          {syncWorkspace.data.ingested ?? 0} ingested project(s).
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load routes. Admin access required.
          </CardContent>
        </Card>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No routes yet. Create one from a template to run the full growth pipeline.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {routes.map((route) => (
            <Card key={route.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{route.name}</CardTitle>
                    <CardDescription>
                      {route.sourceChannel}
                      {route.orbitProjectId ? ` · project ${route.orbitProjectId.slice(0, 8)}…` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{route.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {route.destinations
                    .sort((a, b) => a.order - b.order)
                    .map((d) => (
                      <Badge key={`${d.order}-${d.channel}`} variant="secondary" className="text-xs">
                        {d.order}. {d.channel}
                      </Badge>
                    ))}
                </div>
                {route.lastError ? (
                  <p className="text-sm text-destructive">{route.lastError}</p>
                ) : null}
                <Button asChild size="sm">
                  <Link href={`/dashboard/orbit/routes/${route.id}`}>Open route</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
