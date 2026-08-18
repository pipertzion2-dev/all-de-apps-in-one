"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Grid3X3, Loader2, Play } from "lucide-react";
import { useState } from "react";

type MatrixInfo = {
  id: string;
  name: string;
  description: string;
  sceneCount: number;
  scenes: Array<{ id: string; label: string }>;
};

export default function OrbitMatrixPage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");

  const matricesQuery = useQuery<{ matrices: MatrixInfo[] }>({
    queryKey: ["orbit-scene-matrices"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/matrix/run");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const runMatrix = useMutation({
    mutationFn: async (opts: { runRoutes: boolean }) => {
      if (!projectId.trim()) throw new Error("Project ID required");
      const r = await authFetch("/api/orbit/matrix/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.trim(),
          matrixId: "oaas_growth_matrix",
          createMissing: true,
          runRoutes: opts.runRoutes,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-routes"] });
    },
  });

  const matrix = matricesQuery.data?.matrices[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/orbit/routes"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          OaaS Routes
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Grid3X3 className="h-6 w-6" />
          OaaS Scene Matrix
        </h1>
        <p className="text-muted-foreground">
          Orchestrate IFM, hybrid GTM, and growth pipeline routes as one matrix run.
        </p>
      </div>

      {matricesQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : matrix ? (
        <Card>
          <CardHeader>
            <CardTitle>{matrix.name}</CardTitle>
            <CardDescription>{matrix.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {matrix.scenes.map((s) => (
                <li key={s.id}>{s.label}</li>
              ))}
            </ol>
            <div className="space-y-1">
              <Label htmlFor="matrix-project">Orbit project ID</Label>
              <Input
                id="matrix-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Required"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!projectId.trim() || runMatrix.isPending}
                onClick={() => runMatrix.mutate({ runRoutes: false })}
              >
                Create matrix routes
              </Button>
              <Button
                disabled={!projectId.trim() || runMatrix.isPending}
                onClick={() => runMatrix.mutate({ runRoutes: true })}
              >
                {runMatrix.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Create & run matrix
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {runMatrix.data ? (
        <Card>
          <CardContent className="py-4 text-sm">
            Created {runMatrix.data.routesCreated} route(s), ran {runMatrix.data.routesRun}.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
