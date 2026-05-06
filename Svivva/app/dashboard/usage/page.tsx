"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Zap, Clock, TrendingUp, CheckCircle, XCircle } from "lucide-react";

interface UsageStats {
  apiCallsToday: number;
  avgResponseTime: number | null;
  successRate: number | null;
  tokensUsed: number;
}

interface RecentRequest {
  id: string;
  projectId: string;
  projectName: string;
  input: string | null;
  status: string;
  latencyMs: number | null;
  tokensUsed: number | null;
  createdAt: string;
}

interface UsageData {
  stats: UsageStats;
  recentRequests: RecentRequest[];
}

export default function UsagePage() {
  const { data, isLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
    queryFn: async () => {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
  });

  const statsData = data?.stats;
  const stats = [
    { 
      label: "API Calls Today", 
      value: isLoading ? null : String(statsData?.apiCallsToday || 0), 
      icon: Zap 
    },
    { 
      label: "Avg Response Time", 
      value: isLoading ? null : (statsData?.avgResponseTime ? `${statsData.avgResponseTime}ms` : "—"), 
      icon: Clock 
    },
    { 
      label: "Success Rate", 
      value: isLoading ? null : (statsData?.successRate !== null && statsData?.successRate !== undefined ? `${statsData.successRate}%` : "—"), 
      icon: TrendingUp 
    },
    { 
      label: "Tokens Used", 
      value: isLoading ? null : String(statsData?.tokensUsed || 0), 
      icon: BarChart3 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-usage-title">Usage</h1>
        <p className="text-muted-foreground">Monitor your API usage and performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your most recent API calls</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.recentRequests?.length ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No requests yet</h3>
              <p className="text-muted-foreground">
                Start making API calls to see your usage analytics
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`row-request-${request.id}`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{request.projectName}</span>
                      {request.status === "success" ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20" data-testid={`badge-status-${request.id}`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" data-testid={`badge-status-${request.id}`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {request.input ? request.input.substring(0, 100) : "No input"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    <div>{request.latencyMs ? `${request.latencyMs}ms` : "—"}</div>
                    <div>{new Date(request.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
