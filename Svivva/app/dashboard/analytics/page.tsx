"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface AnalyticsData {
  project: { id: string; name: string };
  range: string;
  interval: string;
  summary: {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    totalTokens: number;
    totalCost: number;
    errorRate: number;
    successRate: number;
  };
  latencyPercentiles: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  timeSeriesData: Array<{
    hour: string;
    calls: number;
    avgLatency: number;
    errors: number;
  }>;
  recentCalls: Array<{
    id: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    tokensUsed: number;
    cost: number;
    createdAt: string;
  }>;
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function SimpleBarChart({ data, height = 100 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;

  return (
    <div className="flex items-end gap-1 h-24" style={{ height }}>
      {data.map((value, i) => (
        <div
          key={i}
          className="bg-primary/80 hover:bg-primary rounded-t transition-colors"
          style={{
            width: `${barWidth}%`,
            height: `${(value / max) * 100}%`,
            minHeight: value > 0 ? 4 : 0,
          }}
          title={`${value} calls`}
        />
      ))}
    </div>
  );
}

function LatencyChart({
  p50,
  p95,
  p99,
  avg,
}: {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
}) {
  const max = Math.max(p50, p95, p99, avg, 1);
  const bars = [
    { label: "P50", value: p50, color: "bg-green-500" },
    { label: "Avg", value: avg, color: "bg-blue-500" },
    { label: "P95", value: p95, color: "bg-yellow-500" },
    { label: "P99", value: p99, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-8">{bar.label}</span>
          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${bar.color} rounded-full transition-all`}
              style={{ width: `${(bar.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono w-16 text-right">{bar.value}ms</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [range, setRange] = useState("7d");

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projectId = selectedProject || projects?.[0]?.id;

  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch,
  } = useQuery<AnalyticsData>({
    queryKey: ["/api/projects", projectId, "analytics", range],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/analytics?range=${range}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  const isLoading = projectsLoading || analyticsLoading;
  const summary = analytics?.summary;
  const latency = analytics?.latencyPercentiles;
  const timeSeries = analytics?.timeSeriesData || [];

  const callsData = timeSeries.map((t) => t.calls);
  const latencyData = timeSeries.map((t) => t.avgLatency);
  const errorsData = timeSeries.map((t) => t.errors);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-muted-foreground">Real-time metrics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject || projectId || ""} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48" data-testid="select-project">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32" data-testid="select-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!projectId && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground">Create a project to start seeing analytics</p>
          </CardContent>
        </Card>
      )}

      {projectId && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-calls">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Calls
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(summary?.totalCalls || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-success-rate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
                {summary && summary.successRate >= 99 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{summary?.successRate || 100}%</span>
                    {summary && summary.failedCalls > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {summary.failedCalls} errors
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-avg-latency">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Latency
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.avgLatency || 0}ms</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-total-cost">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cost
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatCost(summary?.totalCost || 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(summary?.totalTokens || 0)} tokens
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-call-volume">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Call Volume
                </CardTitle>
                <CardDescription>API calls over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : callsData.length > 0 ? (
                  <SimpleBarChart data={callsData} />
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-latency-percentiles">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Latency Percentiles
                </CardTitle>
                <CardDescription>Response time distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : latency ? (
                  <LatencyChart {...latency} />
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-recent-calls">
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Latest API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !analytics?.recentCalls?.length ? (
                <div className="text-center py-8">
                  <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No API calls yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.recentCalls.slice(0, 10).map((call) => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`row-call-${call.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {call.statusCode === 200 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <span className="font-mono text-sm">{call.endpoint}</span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(call.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{call.latencyMs}ms</span>
                        <span>{call.tokensUsed} tokens</span>
                        <span>{formatCost(call.cost || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
