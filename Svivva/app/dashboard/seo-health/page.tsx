"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink, RefreshCw, Send } from "lucide-react";
import Link from "next/link";

type Check = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "info";
  detail: string;
  value?: string | number;
  link?: { label: string; href: string };
};

type HealthData = {
  site: string;
  score: number;
  summary: { ok: number; warn: number; fail: number; total: number };
  checks: Check[];
  liveLinks: { label: string; href: string }[];
  checkedAt: string;
};

const STATUS_META = {
  ok: { Icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Healthy" },
  warn: { Icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Attention" },
  fail: { Icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "Broken" },
  info: { Icon: Info, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/30", label: "Info" },
} as const;

export default function SeoHealthPage() {
  const qc = useQueryClient();
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { data, isLoading, isFetching, error } = useQuery<HealthData>({
    queryKey: ["/api/seo/health"],
    queryFn: async () => {
      const r = await authFetch("/api/seo/health");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const indexNowMutation = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/indexnow/submit", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (d) => {
      setSubmitMsg({ text: `Submitted ${d.urlCount} URLs to ${d.submittedTo?.join(" + ") ?? "IndexNow"}.`, ok: true });
      qc.invalidateQueries({ queryKey: ["/api/seo/health"] });
    },
    onError: (e: Error) => setSubmitMsg({ text: e.message, ok: false }),
  });

  return (
    <div className="container max-w-6xl py-8 space-y-6" data-testid="page-seo-health">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Search Engine Health</h1>
          <p className="text-muted-foreground mt-1">
            Live signals telling you whether Google, Bing, and friends can find — and trust — your site.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => { setSubmitMsg(null); indexNowMutation.mutate(); }}
            disabled={indexNowMutation.isPending}
            data-testid="btn-indexnow-submit"
          >
            <Send className={`w-4 h-4 mr-2 ${indexNowMutation.isPending ? "animate-pulse" : ""}`} />
            {indexNowMutation.isPending ? "Submitting…" : "Resubmit IndexNow"}
          </Button>
          <Button
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ["/api/seo/health"] })}
            disabled={isFetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* IndexNow submission feedback */}
      {submitMsg && (
        <div
          className={`text-sm px-4 py-3 rounded-lg border ${submitMsg.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"}`}
          data-testid="text-indexnow-msg"
        >
          {submitMsg.text}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-rose-500 font-medium">Couldn't load health data.</p>
            <p className="text-sm text-muted-foreground mt-1">
              You may not be signed in as admin. {String((error as Error).message)}
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {/* Overall score */}
          <Card className="overflow-hidden" data-testid="card-score">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Overall</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span
                      className={`text-5xl font-bold tabular-nums ${
                        data.score >= 85 ? "text-emerald-500" : data.score >= 60 ? "text-amber-500" : "text-rose-500"
                      }`}
                      data-testid="text-score"
                    >
                      {data.score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last checked {new Date(data.checkedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-500" data-testid="badge-ok">
                    {data.summary.ok} healthy
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500" data-testid="badge-warn">
                    {data.summary.warn} need attention
                  </Badge>
                  <Badge variant="outline" className="border-rose-500/40 text-rose-500" data-testid="badge-fail">
                    {data.summary.fail} broken
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.checks.map((c) => {
              const meta = STATUS_META[c.status];
              const Icon = meta.Icon;
              return (
                <Card key={c.id} className={`border ${meta.border}`} data-testid={`card-check-${c.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span className={`p-1.5 rounded-md ${meta.bg}`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </span>
                        {c.label}
                      </CardTitle>
                      {c.value !== undefined && (
                        <span className="text-xs font-mono text-muted-foreground" data-testid={`value-${c.id}`}>
                          {c.value}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`detail-${c.id}`}>
                      {c.detail}
                    </p>
                    {c.link && (
                      <Link href={c.link.href}>
                        <Button variant="ghost" size="sm" className="px-0 mt-2 h-auto text-[#5BA8A0] hover:text-[#5BA8A0]/80 hover:bg-transparent" data-testid={`link-${c.id}`}>
                          {c.link.label} →
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* External tools */}
          <Card data-testid="card-external">
            <CardHeader>
              <CardTitle>Verify in the wild</CardTitle>
              <CardDescription>
                These open in the official tools — what they show is the ground truth, not our guess.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.liveLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-md border hover-elevate active-elevate-2"
                    data-testid={`link-external-${l.label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                  >
                    <span className="text-sm font-medium">{l.label}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
