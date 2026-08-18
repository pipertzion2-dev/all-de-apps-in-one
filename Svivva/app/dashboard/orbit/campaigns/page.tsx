"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  status: string;
  phase: string;
  mode: string;
  objective: string;
  orbitProjectId: string;
  updatedAt: string;
  approvalPolicy?: Record<string, unknown> | null;
};

export default function OrbitCampaignsPage() {
  const { data, isLoading, error } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["orbit-campaigns"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/campaigns");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const campaigns = data?.campaigns || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/dashboard/orbit"
              className="inline-flex items-center hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Orbit Launchpad
            </Link>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="h-6 w-6" />
            Campaign approval
          </h1>
          <p className="text-muted-foreground">
            Review content assets and configure approval policies for Orbit growth campaigns.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Failed to load campaigns. Admin access required.
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No campaigns yet. Ingest a project and run{" "}
            <code className="text-xs">POST /api/orbit/projects/[id]/campaigns/plan</code> first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription>
                      {c.objective} · {c.phase} · project {c.orbitProjectId.slice(0, 8)}…
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{c.status}</Badge>
                    <Badge variant="secondary">{c.mode}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link href={`/dashboard/orbit/campaigns/${c.id}`}>Open approval queue</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
