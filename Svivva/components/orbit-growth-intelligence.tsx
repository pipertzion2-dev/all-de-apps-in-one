"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  Loader2,
  Radar,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { GrowthIntelligenceReport, GrowthOpportunity } from "@/lib/orbit/growth-intelligence";
import { GROWTH_INTEL_MIN_SCORE } from "@/lib/orbit/growth-intelligence";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const SYSTEM_LABELS: Record<string, string> = {
  pain_miner: "Pain Miner",
  competitor_radar: "Competitor Radar",
  question_engine: "Question Engine",
  content_arbitrage: "Content Arbitrage",
  community_gap: "Community Gap",
  free_tool_discovery: "Free Tool Discovery",
  trend_detector: "Trend Detector",
  geo_optimization: "GEO / AI Search",
};

function scoreColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 85) return TEAL;
  if (score >= 80) return "#f59e0b";
  return "#94a3b8";
}

function OpportunityRow({ item, rank }: { item: GrowthOpportunity; rank: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-card/80 px-3 py-2.5 space-y-1.5"
      data-testid={`growth-opp-${item.id}`}
    >
      <div className="flex items-start gap-2">
        <span
          className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white mt-0.5"
          style={{ background: scoreColor(item.score) }}
        >
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-foreground leading-snug">{item.title}</p>
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ background: scoreColor(item.score) }}
            >
              {item.score}
            </span>
            {item.priority === "P0" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 border border-red-500/30">
                P0
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {item.recommendedAction}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              {SYSTEM_LABELS[item.system] ?? item.system}
            </span>
            {item.trafficPotential && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300">
                {item.trafficPotential}
              </span>
            )}
            {item.competitor && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-200">
                vs {item.competitor}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  items: GrowthOpportunity[];
  accent: string;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
      <div
        className="px-4 py-2.5 flex items-center gap-2 border-b border-border"
        style={{ background: `${accent}08` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {items.map((item, i) => (
          <OpportunityRow key={item.id} item={item} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

export function OrbitGrowthIntelligence({
  onReportReady,
}: {
  onReportReady?: (summary: string) => void;
}) {
  const { toast } = useToast();
  const [report, setReport] = useState<GrowthIntelligenceReport | null>(null);
  const [source, setSource] = useState<"database" | "seed" | "generated" | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/orbit/growth-intelligence");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setReport(data.report);
      setSource(data.source);
      if (data.summary) onReportReady?.(data.summary);
    } catch (e) {
      toast({
        title: "Growth Intel load failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [onReportReady, toast]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await authFetch("/api/orbit/growth-intelligence", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setReport(data.report);
      setSource(data.source ?? "generated");
      if (data.summary) onReportReady?.(data.summary);
      toast({
        title: "Growth Intelligence refreshed",
        description: `${data.report?.stats?.aboveThreshold ?? 0} opportunities ≥ ${GROWTH_INTEL_MIN_SCORE}`,
      });
    } catch (e) {
      toast({
        title: "Refresh failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !report) {
    return (
      <div
        className="rounded-2xl border-2 border-violet-500/30 bg-violet-500/5 p-8 flex flex-col items-center gap-3"
        data-testid="growth-intel-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground">Loading Growth Intelligence…</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4" data-testid="orbit-growth-intelligence">
      {/* Header */}
      <div
        className="rounded-2xl border-2 p-4 space-y-3"
        style={{ borderColor: `${BURG}55`, background: `linear-gradient(135deg, ${BURG}12, ${TEAL}10)` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${BURG}25`, border: `2px solid ${BURG}40` }}
            >
              <Radar className="w-6 h-6" style={{ color: BURG }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-foreground">Growth Intelligence Agent</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "#16a34a" }}
                  data-testid="growth-intel-implemented-badge"
                >
                  IMPLEMENTED v{report.version}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                {report.executiveSignal}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Last run: {new Date(report.generatedAt).toLocaleString()} · Source: {source ?? "—"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="font-bold shrink-0"
            style={{ background: BURG }}
            data-testid="button-growth-intel-refresh"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Run Daily Scan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Opportunities ≥80", value: report.stats.aboveThreshold, icon: Target },
            { label: "Avg Score", value: report.stats.avgScore, icon: BarChart3 },
            { label: "P0 Queue", value: report.stats.p0Count, icon: Zap },
            { label: "Systems Active", value: report.systemsActive.length, icon: Activity },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card/90 px-3 py-2 flex items-center gap-2"
            >
              <s.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-lg font-black text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 8 Systems */}
        <div className="flex flex-wrap gap-1.5" data-testid="growth-intel-systems">
          {report.systemsActive.map((sys) => (
            <span
              key={sys}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200"
            >
              ✓ {SYSTEM_LABELS[sys] ?? sys}
            </span>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground font-mono">{report.scoringModel}</p>
      </div>

      {/* P0 Queue */}
      <div className="rounded-2xl border-2 border-red-500/25 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-black">P0 Priority Queue</h3>
        </div>
        <div className="space-y-2">
          {report.priorityQueue.map((item, i) => (
            <OpportunityRow key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Sections grid */}
      <div className="grid md:grid-cols-2 gap-3">
        <SectionBlock title="Top Pains" icon={Zap} items={report.topPains} accent="#ef4444" />
        <SectionBlock title="Top Questions" icon={Target} items={report.topQuestions} accent={TEAL} />
        <SectionBlock
          title="Competitor Weaknesses"
          icon={Activity}
          items={report.topCompetitorWeaknesses}
          accent={BURG}
        />
        <SectionBlock title="Content Opportunities" icon={BarChart3} items={report.topContent} accent="#8b5cf6" />
        <SectionBlock title="Free Tool Ideas" icon={Radar} items={report.topTools} accent="#0ea5e9" />
        <SectionBlock title="Emerging Trends" icon={TrendingUp} items={report.topTrends} accent="#f59e0b" />
      </div>
    </div>
  );
}
