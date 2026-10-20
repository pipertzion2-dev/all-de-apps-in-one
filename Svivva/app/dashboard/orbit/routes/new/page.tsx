"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

type Template = {
  id: string;
  name: string;
  description: string;
};

export default function NewOrbitRoutePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [templateId, setTemplateId] = useState("growth_pipeline");

  const templatesQuery = useQuery<{ templates: Template[] }>({
    queryKey: ["orbit-route-templates"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/routes?templates=1");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const createRoute = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          templateId,
          orbitProjectId: projectId.trim() || undefined,
          status: "active",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["orbit-routes"] });
      router.push(`/dashboard/orbit/routes/${data.route.id}`);
    },
  });

  const templates = templatesQuery.data?.templates || [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link
        href="/dashboard/orbit/routes"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        All routes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create OaaS route</CardTitle>
          <CardDescription>
            Pick a template and optionally bind to an existing ingested project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templatesQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="route-name">Name</Label>
                <Input
                  id="route-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My growth route"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-id">Project ID (optional)</Label>
                <Input
                  id="project-id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Skip ingest if project already exists"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <select
                  id="template"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <optgroup label="Core pipelines">
                    {templates
                      .filter((t) => !t.id.startsWith("hybrid:"))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Hybrid GTM scenes">
                    {templates
                      .filter((t) => t.id.startsWith("hybrid:"))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <p className="text-xs text-muted-foreground">
                  {templates.find((t) => t.id === templateId)?.description}
                </p>
              </div>
              <Button
                disabled={!name.trim() || createRoute.isPending}
                onClick={() => createRoute.mutate()}
              >
                {createRoute.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create route
              </Button>
              {createRoute.error ? (
                <p className="text-sm text-destructive">{String(createRoute.error)}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
