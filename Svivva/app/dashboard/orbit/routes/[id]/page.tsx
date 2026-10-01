"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Play } from "lucide-react";

type RouteDetail = {
  id: string;
  name: string;
  description?: string | null;
  orbitProjectId?: string | null;
  sourceChannel: string;
  sourceRef?: string | null;
  status: string;
  destinations: Array<{ channel: string; order: number; config?: Record<string, unknown> }>;
  lastRunAt?: string | null;
  lastRunResult?: { steps?: Array<{ channel: string; ok: boolean; error?: string }> } | null;
  lastError?: string | null;
};

export default function OrbitRouteDetailPage() {
  const params = useParams();
  const routeId = String(params.id);
  const qc = useQueryClient();

  const routeQuery = useQuery<{ route: RouteDetail }>({
    queryKey: ["orbit-route", routeId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/routes/${routeId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const runRoute = useMutation({
    mutationFn: async () => {
      const r = await authFetch(`/api/orbit/routes/${routeId}/run`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-route", routeId] });
      qc.invalidateQueries({ queryKey: ["orbit-routes"] });
    },
  });

  const route = routeQuery.data?.route;
  const lastSteps = route?.lastRunResult?.steps || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href="/dashboard/orbit/routes"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        All routes
      </Link>

      {routeQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : route ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{route.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{route.status}</Badge>
                <Badge variant="secondary">{route.sourceChannel}</Badge>
              </div>
              {route.description ? (
                <p className="mt-2 text-muted-foreground">{route.description}</p>
              ) : null}
            </div>
            <Button disabled={runRoute.isPending} onClick={() => runRoute.mutate()}>
              {runRoute.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run route
            </Button>
          </div>

          {route.orbitProjectId ? (
            <p className="text-sm">
              Project:{" "}
              <Link
                href={`/dashboard/orbit/projects/${route.orbitProjectId}/analytics`}
                className="text-primary hover:underline"
              >
                {route.orbitProjectId.slice(0, 8)}… analytics
              </Link>
            </p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline steps</CardTitle>
              <CardDescription>Executed in order when the route runs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {route.destinations
                .sort((a, b) => a.order - b.order)
                .map((d) => (
                  <div
                    key={`${d.order}-${d.channel}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {d.order}. {d.channel}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {(lastSteps.length > 0 || route.lastError) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last run</CardTitle>
                {route.lastRunAt ? (
                  <CardDescription>{new Date(route.lastRunAt).toLocaleString()}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {route.lastError ? (
                  <p className="text-sm text-destructive">{route.lastError}</p>
                ) : null}
                {lastSteps.map((step, i) => (
                  <div
                    key={`${step.channel}-${i}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{step.channel}</span>
                    <Badge variant={step.ok ? "secondary" : "destructive"}>
                      {step.ok ? "ok" : "failed"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {runRoute.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Run result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(runRoute.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-destructive">Route not found</CardContent>
        </Card>
      )}
    </div>
  );
}
