"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Search,
  TrendingUp,
  BookOpen,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SeoWeeklyRoutineResult, WeeklyTaskResult } from "@/lib/orbit/seo-weekly-routine";
import type { SeoLearningRoadmap } from "@/lib/orbit/seo-learning-roadmap";

const TEAL = "#5B8DA8";

type RoutineData = {
  result: SeoWeeklyRoutineResult | null;
  roadmap: SeoLearningRoadmap;
  summary: string | null;
  lastRunAt: string | null;
};

function statusIcon(status: WeeklyTaskResult["status"]) {
  if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  if (status === "needs_credentials")
    return <KeyRound className="w-3.5 h-3.5 text-violet-500 shrink-0" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
}

function statusBadge(status: WeeklyTaskResult["status"]) {
  const map: Record<string, string> = {
    done: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    partial: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    skipped: "text-muted-foreground bg-muted/30 border-border",
    needs_credentials: "text-violet-600 bg-violet-500/10 border-violet-500/20",
    failed: "text-red-600 bg-red-500/10 border-red-500/20",
  };
  return map[status] ?? map.skipped;
}

export function OrbitSeoWeeklyRoutine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGsc, setShowGsc] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [lastLog, setLastLog] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RoutineData>({
    queryKey: ["/api/orbit/seo-weekly-routine"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/seo-weekly-routine");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: async (opts?: { skipContent?: boolean }) => {
      const r = await authFetch("/api/orbit/seo-weekly-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipContentGeneration: opts?.skipContent }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      return json as SeoWeeklyRoutineResult;
    },
    onSuccess: (result) => {
      setLastLog(result.summary);
      queryClient.invalidateQueries({ queryKey: ["/api/orbit/seo-weekly-routine"] });
      toast({
        title: "SEO Weekly Routine complete",
        description: `${result.stats.done}/14 tasks done · roadmap ${result.roadmap.overallPercent}%`,
        duration: 12000,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Routine failed", description: e.message, variant: "destructive" });
    },
  });

  const result = data?.result;
  const roadmap = data?.roadmap;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border-2 p-4 space-y-3"
        style={{
          borderColor: `${TEAL}55`,
          background: `linear-gradient(135deg, ${TEAL}08, transparent)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Search className="w-4 h-4" style={{ color: TEAL }} />
              SEO Weekly Routine — fully automated
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Runs all 14 weekly SEO steps: GSC insights, keyword opportunities, page improvements,
              internal links, content gaps, indexing health, and technical checks. Scheduled every
              Monday via cron — or run now.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => runMutation.mutate(undefined)}
              disabled={runMutation.isPending}
              data-testid="seo-weekly-run-full"
            >
              {runMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Run full routine
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runMutation.mutate({ skipContent: true })}
              disabled={runMutation.isPending}
              data-testid="seo-weekly-run-audit"
            >
              Audit only
            </Button>
          </div>
        </div>

        {data?.lastRunAt && (
          <p className="text-[10px] text-muted-foreground">
            Last run: {new Date(data.lastRunAt).toLocaleString()}
            {result?.stats && (
              <>
                {" "}
                · {result.stats.done} done · {result.stats.partial} partial ·{" "}
                {result.stats.needsCredentials} need GSC
              </>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-[10px]">
          <Link
            href="/dashboard/gsc-connect"
            className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Connect GSC
          </Link>
          <Link
            href="/dashboard/seo-health"
            className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> SEO health
          </Link>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Search Console
          </a>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading routine status…
        </div>
      )}

      {/* Learning roadmap */}
      {roadmap && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20"
            onClick={() => setShowRoadmap(!showRoadmap)}
          >
            <span className="text-xs font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500" />
              SEO Learning Roadmap — Week {roadmap.currentWeek} · {roadmap.overallPercent}% complete
            </span>
            {showRoadmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showRoadmap && (
            <div className="border-t border-border px-4 py-3 grid gap-3 sm:grid-cols-2">
              {roadmap.weeks.map((w) => (
                <div key={w.week} className="rounded-lg border border-border/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">
                      Week {w.week}: {w.title}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {w.percent}%
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {w.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-1.5 text-[10px]">
                        {item.done ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={item.done ? "text-muted-foreground" : "text-foreground"}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GSC insights */}
      {result?.gsc && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20"
            onClick={() => setShowGsc(!showGsc)}
          >
            <span className="text-xs font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              GSC Performance ({result.gsc.startDate} → {result.gsc.endDate})
            </span>
            {showGsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showGsc && (
            <div className="border-t border-border px-4 py-3 space-y-3 text-[11px]">
              {result.gsc.nearPageOne.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">Keywords near page 1 (pos 5–20)</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {result.gsc.nearPageOne.slice(0, 8).map((q, i) => (
                      <li key={i}>
                        {q.keys[0]} — pos {q.position.toFixed(1)}, {q.impressions} imp
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.gsc.lowCtrPages.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">High impressions, low CTR</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {result.gsc.lowCtrPages.slice(0, 5).map((p, i) => (
                      <li key={i}>
                        {p.keys[0]?.replace(/^https?:\/\/[^/]+/, "")} — {(p.ctr * 100).toFixed(1)}%
                        CTR, {p.impressions} imp
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.gsc.newQueries.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">New / rising queries</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {result.gsc.newQueries.slice(0, 8).map((q, i) => (
                      <li key={i}>
                        {q.keys[0]} — {q.impressions} imp
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 14 tasks */}
      {(result?.tasks || lastLog) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            14 weekly SEO tasks
          </p>
          <div className="space-y-1.5">
            {(result?.tasks ?? []).map((t) => (
              <div
                key={t.id}
                className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[11px] ${statusBadge(t.status)}`}
              >
                {statusIcon(t.status)}
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{t.label}</span>
                  <p className="text-muted-foreground mt-0.5">{t.message}</p>
                </div>
              </div>
            ))}
          </div>
          {(lastLog || result?.summary) && (
            <pre className="mt-3 text-[10px] bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48">
              {lastLog || result?.summary}
            </pre>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No routine run yet. Click <strong>Run full routine</strong> to automate your weekly SEO
          checklist — or wait for Monday&apos;s cron.
        </p>
      )}
    </div>
  );
}
