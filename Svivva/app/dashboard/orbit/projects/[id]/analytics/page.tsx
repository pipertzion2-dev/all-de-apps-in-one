"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, RefreshCw, Sparkles, X, Bot } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AnalyticsSummary = {
  projectId: string;
  totalEvents: number;
  byEventType: Record<string, number>;
  bySource: Record<string, number>;
  distribution: { succeeded: number; failed: number; manualReady: number };
  indexing: { submitted: number; indexed: number; failed: number; stuckSubmitted: number };
  content: { validationPassed: number; validationFailed: number };
  openRecommendations: number;
};

type TimelineEvent = {
  id: string;
  eventType: string;
  source: string;
  occurredAt: string;
  dimensions?: Record<string, unknown>;
};

type Recommendation = {
  id: string;
  kind: string;
  priority: string;
  title: string;
  rationale: string;
  orbitCampaignId?: string | null;
};

type AutopilotStatus = {
  projectId: string;
  config: { enabled: boolean; maxActionsPerRun: number; defaultMode: string };
  lastRun: {
    id: string;
    status: string;
    recommendationsApplied: number;
    recommendationsSkipped: number;
    completedAt: string | null;
  } | null;
};

export default function OrbitProjectAnalyticsPage() {
  const params = useParams();
  const projectId = String(params.id);
  const qc = useQueryClient();

  const projectQuery = useQuery<{ project: { id: string; name: string } }>({
    queryKey: ["orbit-project", projectId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const summaryQuery = useQuery<{ summary: AnalyticsSummary }>({
    queryKey: ["orbit-analytics-summary", projectId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId}/analytics/summary`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const timelineQuery = useQuery<{ events: TimelineEvent[] }>({
    queryKey: ["orbit-analytics-timeline", projectId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId}/analytics/timeline?limit=50`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const recommendationsQuery = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["orbit-recommendations", projectId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId}/recommendations`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const autopilotQuery = useQuery<AutopilotStatus>({
    queryKey: ["orbit-autopilot", projectId],
    queryFn: async () => {
      const r = await authFetch(`/api/orbit/projects/${projectId}/autopilot`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const refreshAnalytics = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/orbit/analytics/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-analytics-summary", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-analytics-timeline", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-recommendations", projectId] });
    },
  });

  const applyRecommendation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "apply" | "dismiss" }) => {
      const r = await authFetch(`/api/orbit/recommendations/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-recommendations", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-analytics-summary", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-analytics-timeline", projectId] });
    },
  });

  const toggleAutopilot = useMutation({
    mutationFn: async (enabled: boolean) => {
      const r = await authFetch(`/api/orbit/projects/${projectId}/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-autopilot", projectId] });
    },
  });

  const runAutopilot = useMutation({
    mutationFn: async (force?: boolean) => {
      const r = await authFetch("/api/orbit/analytics/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, force: force ?? false }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orbit-autopilot", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-recommendations", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-analytics-summary", projectId] });
      qc.invalidateQueries({ queryKey: ["orbit-analytics-timeline", projectId] });
    },
  });

  const loading =
    projectQuery.isLoading ||
    summaryQuery.isLoading ||
    timelineQuery.isLoading ||
    recommendationsQuery.isLoading;

  const summary = summaryQuery.data?.summary;
  const events = timelineQuery.data?.events || [];
  const recommendations = recommendationsQuery.data?.recommendations || [];
  const projectName = projectQuery.data?.project?.name || projectId.slice(0, 8);
  const autopilot = autopilotQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/orbit/projects"
            className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            All projects
          </Link>
          {loading ? (
            <Skeleton className="h-10 w-2/3" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{projectName} — Analytics</h1>
              <p className="text-muted-foreground">
                Normalized outcomes from distribution, indexing, and content validation.
              </p>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshAnalytics.isPending}
          onClick={() => refreshAnalytics.mutate()}
        >
          {refreshAnalytics.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh insights
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribution</CardTitle>
              <CardDescription>Publish outcomes (30d)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Succeeded</span>
                <span className="font-medium text-green-600">{summary.distribution.succeeded}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed</span>
                <span className="font-medium text-destructive">{summary.distribution.failed}</span>
              </div>
              <div className="flex justify-between">
                <span>Manual ready</span>
                <span className="font-medium">{summary.distribution.manualReady}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Indexing</CardTitle>
              <CardDescription>Crawl & index signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Submitted</span>
                <span className="font-medium">{summary.indexing.submitted}</span>
              </div>
              <div className="flex justify-between">
                <span>Indexed</span>
                <span className="font-medium text-green-600">{summary.indexing.indexed}</span>
              </div>
              <div className="flex justify-between">
                <span>Stuck submitted</span>
                <span className="font-medium text-amber-600">{summary.indexing.stuckSubmitted}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content</CardTitle>
              <CardDescription>Validation outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Passed</span>
                <span className="font-medium text-green-600">{summary.content.validationPassed}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed</span>
                <span className="font-medium text-destructive">{summary.content.validationFailed}</span>
              </div>
              <div className="flex justify-between">
                <span>Open recommendations</span>
                <span className="font-medium">{summary.openRecommendations}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" />
            Autopilot
          </CardTitle>
          <CardDescription>
            Closed-loop execution: auto-apply safe recommendations for assisted/autonomous
            campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {autopilotQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : autopilot ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="autopilot-enabled"
                    checked={autopilot.config.enabled}
                    disabled={toggleAutopilot.isPending}
                    onCheckedChange={(checked) => toggleAutopilot.mutate(checked)}
                  />
                  <Label htmlFor="autopilot-enabled">
                    {autopilot.config.enabled ? "Autopilot enabled" : "Autopilot disabled"}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={runAutopilot.isPending}
                    onClick={() => runAutopilot.mutate(true)}
                  >
                    {runAutopilot.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Run now
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Default mode: {autopilot.config.defaultMode} · Max actions per run:{" "}
                {autopilot.config.maxActionsPerRun}
              </p>
              {autopilot.lastRun ? (
                <p className="text-sm">
                  Last run:{" "}
                  <Badge variant="outline">{autopilot.lastRun.status}</Badge> — applied{" "}
                  {autopilot.lastRun.recommendationsApplied}, skipped{" "}
                  {autopilot.lastRun.recommendationsSkipped}
                  {autopilot.lastRun.completedAt
                    ? ` · ${new Date(autopilot.lastRun.completedAt).toLocaleString()}`
                    : null}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No autopilot runs yet.</p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>Rule-based next actions from recent graph outcomes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open recommendations. Run &quot;Refresh insights&quot; to backfill events and
              regenerate suggestions.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{rec.title}</span>
                      <Badge variant="outline">{rec.kind}</Badge>
                      <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={applyRecommendation.isPending}
                      onClick={() => applyRecommendation.mutate({ id: rec.id, action: "apply" })}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={applyRecommendation.isPending}
                      onClick={() => applyRecommendation.mutate({ id: rec.id, action: "dismiss" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event timeline</CardTitle>
          <CardDescription>Most recent normalized events for this project.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{ev.eventType}</Badge>
                    <span className="text-muted-foreground">{ev.source}</span>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(ev.occurredAt).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
