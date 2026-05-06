"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Clock,
  BarChart3,
  Shield,
  Cpu,
  Loader2,
} from "lucide-react";

type PulseItem = {
  type: "insight" | "opportunity" | "risk" | "action";
  icon: string;
  title: string;
  body: string;
  action: string;
};

type PulseData = {
  snapshot: {
    projectCount: number;
    calls24h: number;
    calls7d: number;
    calls30d: number;
    avgLatency: number | null;
    tokens30d: number;
    successRate: number | null;
    evalPassRate: number | null;
    projects: { id: string; name: string; status: string; calls7d: number; calls30d: number }[];
  };
  insights: {
    headline: string;
    items: PulseItem[];
  };
};

const typeConfig: Record<string, { label: string; color: string; Icon: typeof Zap }> = {
  insight: { label: "Insight", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", Icon: Activity },
  opportunity: { label: "Opportunity", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", Icon: TrendingUp },
  risk: { label: "Risk", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", Icon: AlertTriangle },
  action: { label: "Action", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", Icon: Lightbulb },
};

export default function PulsePage() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { data, isLoading, isRefetching, refetch, isError } = useQuery<PulseData>({
    queryKey: ["/api/pulse"],
    queryFn: async () => {
      const r = await authFetch("/api/pulse");
      if (!r.ok) throw new Error(`Pulse API returned ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  function handleRefresh() {
    setLastRefresh(new Date());
    refetch();
  }

  const snap = data?.snapshot;
  const insights = data?.insights;
  const loading = isLoading || isRefetching;

  const statCards = [
    { label: "APIs Live", value: snap?.projectCount ?? "—", icon: Cpu, color: "text-primary" },
    { label: "Calls (24h)", value: snap?.calls24h ?? "—", icon: Zap, color: "text-amber-400" },
    { label: "Calls (7d)", value: snap?.calls7d ?? "—", icon: BarChart3, color: "text-blue-400" },
    { label: "Avg Latency", value: snap?.avgLatency != null ? `${snap.avgLatency}ms` : "—", icon: Clock, color: "text-emerald-400" },
    { label: "Success Rate", value: snap?.successRate != null ? `${snap.successRate}%` : "—", icon: Shield, color: "text-green-400" },
    { label: "Eval Score", value: snap?.evalPassRate != null ? `${snap.evalPassRate}%` : "—", icon: Activity, color: "text-purple-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="page-pulse">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pulse</h1>
            <p className="text-muted-foreground text-sm">Automated intelligence for your account</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRefresh}
          disabled={loading}
          data-testid="button-refresh-pulse"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {isError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm font-medium">Couldn't load Pulse data</p>
            <p className="text-xs text-muted-foreground">Something went wrong. Try refreshing.</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2" data-testid="button-retry-pulse">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-20 rounded-xl" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((s) => (
              <Card key={s.label} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {insights?.headline && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <CardContent className="py-5 px-6 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Pulse Summary</p>
                  <p className="text-sm font-medium" data-testid="text-pulse-headline">{insights.headline}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {insights?.items && insights.items.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-muted-foreground">Intelligence Briefing</h2>
              {insights.items.map((item, i) => {
                const config = typeConfig[item.type] || typeConfig.insight;
                const TypeIcon = config.Icon;
                return (
                  <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-colors">
                    <CardContent className="py-5 px-6">
                      <div className="flex items-start gap-4">
                        <div className="pt-0.5 shrink-0">
                          <span className="text-2xl" role="img">{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <h3 className="text-sm font-semibold">{item.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="text-sm text-primary font-medium">{item.action}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {snap && snap.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Project Breakdown
                </CardTitle>
                <CardDescription className="text-xs">API call volume by project (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {snap.projects.map((p) => {
                    const maxCalls = Math.max(...snap.projects.map((pr) => pr.calls30d), 1);
                    const pct = Math.round((p.calls30d / maxCalls) * 100);
                    return (
                      <div key={p.id} className="space-y-1.5" data-testid={`project-row-${p.id}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{p.name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {p.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                            <span>{p.calls7d.toLocaleString()} / 7d</span>
                            <span className="font-medium text-foreground">{p.calls30d.toLocaleString()} / 30d</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {lastRefresh && (
            <p className="text-xs text-muted-foreground text-center">
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
