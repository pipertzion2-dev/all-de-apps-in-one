"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch } from "lucide-react";

type RouteRow = {
  id: string;
  name: string;
  status: string;
  lastRunAt?: string | null;
  lastError?: string | null;
};

export function OrbitRoutesPanel() {
  const { data, isLoading } = useQuery<{ routes: RouteRow[] }>({
    queryKey: ["orbit-routes-panel"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/routes");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const routes = (data?.routes || []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          OaaS Routes
        </CardTitle>
        <CardDescription>Active patch-bay workflows across workspace apps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : routes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No routes yet.{" "}
            <Link href="/dashboard/orbit/routes/new" className="text-primary hover:underline">
              Create one
            </Link>{" "}
            or{" "}
            <Link href="/dashboard/orbit/routes" className="text-primary hover:underline">
              sync workspace
            </Link>
            .
          </p>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <Link href={`/dashboard/orbit/routes/${route.id}`} className="font-medium hover:underline">
                  {route.name}
                </Link>
                {route.lastError ? (
                  <p className="text-xs text-destructive">{route.lastError.slice(0, 80)}</p>
                ) : null}
              </div>
              <Badge variant="outline">{route.status}</Badge>
            </div>
          ))
        )}
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/orbit/routes">All routes</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/orbit/projects">Projects</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
