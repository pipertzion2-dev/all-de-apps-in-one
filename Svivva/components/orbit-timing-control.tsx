"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Clock, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/use-auth";
import type { TimingPlanStep } from "@/lib/orbit/timing-plan";

type TimingPayload = {
  steps: TimingPlanStep[];
  state: {
    completedStepIds: string[];
    lastCompletedAt: string | null;
    lastMaintenanceAt?: string | null;
    logs: { stepId: string; at: string; ok: boolean; summary: string }[];
  };
  nextStep: TimingPlanStep | null;
  planComplete?: boolean;
  maintenanceDue?: boolean;
  canRunNext: boolean;
  blockReason: string | null;
  completedCount: number;
  totalSteps: number;
};

function TimingSwirlOrb({
  active,
  onClick,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex flex-col items-center gap-2 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-full"
      aria-label="Timing — automated growth plan"
      data-testid="timing-swirl-button"
    >
      <span
        className={`relative flex h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 items-center justify-center rounded-full shadow-[0_0_28px_rgba(212,175,55,0.45)] ${active ? "animate-[spin_2.4s_linear_infinite]" : ""}`}
        style={{
          background:
            "conic-gradient(from 0deg, #1a1008, #d4af37, #f5e6a8, #b8860b, #d4af37, #1a1008)",
        }}
      >
        <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#1a1008] via-[#2a2010] to-[#1a1008] flex items-center justify-center border border-[#d4af37]/40">
          <Clock className="h-7 w-7 text-[#d4af37]" aria-hidden />
        </span>
      </span>
      <span className="text-xs font-black uppercase tracking-[0.35em] text-[#d4af37]">Timing</span>
    </button>
  );
}

export function OrbitTimingControl() {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<TimingPayload | null>(null);
  const [lastLog, setLastLog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/orbit/timing");
      const json = (await res.json()) as TimingPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
    } catch (e) {
      toast({
        title: "Could not load Timing plan",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, string>) => {
    setRunning(true);
    setLastLog(null);
    try {
      const res = await authFetch("/api/orbit/timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok && !json.manual) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (json.result?.summary) setLastLog(json.result.summary);
      if (json.state) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                state: json.state,
                nextStep: json.nextStep ?? prev.nextStep,
                canRunNext: json.nextStep ? !json.blockReason : false,
                blockReason: json.blockReason ?? null,
                completedCount: json.state.completedStepIds.length,
              }
            : prev,
        );
      }
      await load();
      toast({
        title: json.ok ? "Timing step complete" : "Timing step needs attention",
        description: json.result?.summary?.slice(0, 120) || json.error,
        duration: 10000,
      });
    } catch (e) {
      toast({ title: "Timing failed", description: String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const next = data?.nextStep;
  const progress = data ? Math.round((data.completedCount / data.totalSteps) * 100) : 0;

  return (
    <div
      className="rounded-2xl border-4 border-[#d4af37]/80 bg-gradient-to-br from-[#d4af37]/15 via-card to-[#1a1008]/50 p-4 sm:p-5 shadow-[0_0_32px_rgba(212,175,55,0.25)]"
      data-testid="orbit-timing-control"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
        <TimingSwirlOrb active={running} onClick={() => setOpen((o) => !o)} disabled={loading} />

        <div className="flex-1 min-w-0 w-full space-y-3 text-center sm:text-left">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#b8860b]">
              One step at a time
            </p>
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              Professional SEO Timing — small batches, long waits
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              Sitemap once, 48h crawl settle, then ~45 IndexNow URLs per step (and ~35 Indexing API
              only on later steps). Replaces “run everything now.” Press the gold{" "}
              <strong className="text-foreground">Timing</strong> orb for the checklist.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="h-2 flex-1 min-w-[120px] max-w-xs rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full bg-[#d4af37] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {data?.completedCount ?? 0}/{data?.totalSteps ?? 12} steps
              {data?.planComplete ? " · plan complete" : ""}
            </span>
          </div>

          {next && !open && (
            <p className="text-xs text-foreground/80">
              Next: <strong>{next.title}</strong>
              {!data?.canRunNext && data?.blockReason ? (
                <span className="text-muted-foreground"> — {data.blockReason}</span>
              ) : null}
            </p>
          )}
        </div>

        <button
          type="button"
          className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Collapse" : "Expand"}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4 border-t border-[#d4af37]/25 pt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading plan…
            </p>
          ) : (
            <>
              {next && (
                <div className="rounded-xl border border-[#d4af37]/30 bg-black/20 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#d4af37]">
                    Current step
                  </p>
                  <p className="font-bold text-foreground">{next.title}</p>
                  <p className="text-xs text-muted-foreground">{next.subtitle}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Success looks like: {next.successLooksLike}
                  </p>
                  {next.id === "crawl-settle" && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Do not run bulk indexing during this wait — let GSC discover URLs from the
                      sitemap.
                    </p>
                  )}
                  {next.id === "foundation-gsc" && (
                    <Button size="sm" variant="outline" asChild className="mt-1">
                      <Link href="/dashboard/gsc-connect">Open GSC connect</Link>
                    </Button>
                  )}
                  {next.id === "adsense-verify" && (
                    <Button size="sm" variant="outline" asChild className="mt-1">
                      <a
                        href="https://www.google.com/adsense/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open AdSense
                      </a>
                    </Button>
                  )}
                  {!data?.canRunNext && data?.blockReason && (
                    <p className="text-xs text-amber-700 dark:text-amber-200">{data.blockReason}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {next.kind === "automated" ? (
                      <Button
                        size="sm"
                        className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] font-bold"
                        disabled={running || !data?.canRunNext}
                        onClick={() =>
                          void post({
                            action:
                              data?.planComplete || next.id === "index-weekly-maintain"
                                ? "run_maintenance"
                                : "run_next",
                          })
                        }
                        data-testid="timing-run-next"
                      >
                        {running ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        {data?.planComplete || next.id === "index-weekly-maintain"
                          ? "Run weekly maintenance"
                          : "Run today's step"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a] font-bold"
                        disabled={running || !data?.canRunNext}
                        onClick={() => void post({ action: "complete_manual" })}
                        data-testid="timing-mark-manual"
                      >
                        Mark done — I finished this in Google
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {data?.steps.map((step) => {
                  const done = data.state.completedStepIds.includes(step.id);
                  const current = next?.id === step.id;
                  return (
                    <li
                      key={step.id}
                      className={`flex gap-2 text-xs rounded-lg px-2 py-1.5 ${
                        current ? "bg-[#d4af37]/15 border border-[#d4af37]/25" : ""
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span>
                        <span className="font-medium">{step.title}</span>
                        {step.minHoursAfterPrevious > 0 && !done && (
                          <span className="text-muted-foreground">
                            {" "}
                            · wait {step.minHoursAfterPrevious}h after previous
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {lastLog && (
                <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono max-h-36 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
                  {lastLog}
                </pre>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  disabled={running}
                  onClick={() => void post({ action: "reset" })}
                >
                  Reset plan
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => void load()}
                >
                  Refresh
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Do not use <strong>Start traffic now</strong> or <strong>Run Everything</strong> in
                the same week — they bypass Timing waits. AdSense pays via{" "}
                <a
                  href="https://www.google.com/adsense/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AdSense
                </a>
                ; search rankings live in{" "}
                <a
                  href="https://search.google.com/search-console"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search Console
                </a>
                .
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
