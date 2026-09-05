"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3 } from "lucide-react";

type Project = {
  id: string;
  name: string;
  status: string;
  sourceType: string;
  updatedAt: string;
};

export default function OrbitProjectsPage() {
  const { data, isLoading, error } = useQuery<{ projects: Project[] }>({
    queryKey: ["orbit-projects"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/projects");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const projects = data?.projects || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/orbit"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Orbit Launchpad
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <BarChart3 className="h-6 w-6" />
          Orbit projects
        </h1>
        <p className="text-muted-foreground">
          View analytics, event timelines, and recommendations per ingested project.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load projects. Admin access required.
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No projects yet. Ingest a site via{" "}
            <code className="text-xs">POST /api/orbit/ingest</code> first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>
                      {p.sourceType} · {p.id.slice(0, 8)}…
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link href={`/dashboard/orbit/projects/${p.id}/analytics`}>
                    Open analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
