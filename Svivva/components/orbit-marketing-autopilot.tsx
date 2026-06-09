"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import {
  MARKETING_CREDENTIAL_FIELDS,
  type AutopilotTaskResult,
  type MarketingAutopilotRunResult,
} from "@/lib/orbit/marketing-autopilot-types";
import { OrbitSubmissionWorkbench } from "@/components/orbit-submission-workbench";

const TEAL = "#5BA8A0";
const PINK = "#db2777";

type AutopilotData = {
  credentials: Record<string, string>;
  status: {
    configured: Record<string, boolean>;
    google: { serviceAccount: boolean; siteUrl: boolean; indexNow: boolean };
  };
  lastRun: MarketingAutopilotRunResult | null;
  gscConnectUrl: string;
};

function statusColor(s: string) {
  if (s === "posted" || s === "done") return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  if (s === "prepared") return "text-amber-600 bg-amber-500/10 border-amber-500/20";
  if (s === "failed") return "text-red-600 bg-red-500/10 border-red-500/20";
  if (s === "needs_credentials") return "text-violet-600 bg-violet-500/10 border-violet-500/20";
  return "text-muted-foreground bg-muted/30 border-border";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "posted" || status === "done")
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  if (status === "needs_credentials")
    return <KeyRound className="w-3.5 h-3.5 text-violet-500 shrink-0" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
}

export function OrbitMarketingAutopilot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [showCreds, setShowCreds] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Manual Publishing");
  const [lastLog, setLastLog] = useState<string | null>(null);

  const { data, isLoading } = useQuery<AutopilotData>({
    queryKey: ["/api/orbit/marketing-autopilot"],
    queryFn: async () => {
      const r = await authFetch("/api/orbit/marketing-autopilot");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const r = await authFetch("/api/orbit/marketing-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", credentials }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orbit/marketing-autopilot"] });
      toast({ title: "Credentials saved" });
    },
  });

  const runMutation = useMutation({
    mutationFn: async (opts?: { skipOnSite?: boolean }) => {
      const credPayload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v && !v.startsWith("••••")),
      );
      const r = await authFetch("/api/orbit/marketing-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: Object.keys(credPayload).length ? "save_and_run" : "run",
          credentials: credPayload,
          skipOnSite: opts?.skipOnSite,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      return json as MarketingAutopilotRunResult;
    },
    onSuccess: (result) => {
      setLastLog(result.summary);
      queryClient.invalidateQueries({ queryKey: ["/api/orbit/marketing-autopilot"] });
      toast({
        title: "Marketing Autopilot complete",
        description: `${result.stats.posted} posted · ${result.stats.prepared} prepared · ${result.stats.done} done`,
        duration: 12000,
      });
    },
    onError: (e) => {
      toast({ title: "Autopilot failed", description: String(e), variant: "destructive" });
    },
  });

  const lastRun = data?.lastRun;
  const tasks: AutopilotTaskResult[] = lastRun?.tasks ?? [];

  const groupedTasks = useMemo(() => {
    const map = new Map<string, AutopilotTaskResult[]>();
    for (const t of tasks) {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    }
    return map;
  }, [tasks]);

  const googleOk =
    data?.status.google.serviceAccount && data?.status.google.siteUrl && data?.status.google.indexNow;

  const busy = runMutation.isPending || saveMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="rounded-2xl border-2 p-5 space-y-3"
        style={{ borderColor: `${PINK}40`, background: `linear-gradient(135deg, ${PINK}08, ${TEAL}08)` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${PINK}, ${TEAL})` }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-foreground">Marketing Autopilot</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add API credentials once. AI generates every checklist item and posts wherever APIs
              allow — Dev.to, Hashnode, Twitter/X, Reddit, email pitches, plus full on-site SEO +
              Google indexing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => runMutation.mutate({})}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${PINK}, #a21caf)` }}
          >
            {runMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            Run full marketing autopilot
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runMutation.mutate({ skipOnSite: true })}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted/40 disabled:opacity-60"
          >
            Publishing only (skip on-site)
          </button>
        </div>

        {lastRun && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline" className="bg-emerald-500/10">
              {lastRun.stats.posted} posted
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10">
              {lastRun.stats.prepared} prepared to paste
            </Badge>
            <Badge variant="outline">{lastRun.stats.done} done</Badge>
            {lastRun.stats.needsCredentials > 0 && (
              <Badge variant="outline" className="bg-violet-500/10 text-violet-700">
                {lastRun.stats.needsCredentials} need credentials
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Inline submission forms — directories, publishing, accounts */}
      <OrbitSubmissionWorkbench />

      {/* Google (existing flow) */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Google Search (existing)
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant={data?.status.google.indexNow ? "default" : "outline"}>
            IndexNow {data?.status.google.indexNow ? "✓" : "—"}
          </Badge>
          <Badge variant={data?.status.google.serviceAccount ? "default" : "outline"}>
            GSC service account {data?.status.google.serviceAccount ? "✓" : "—"}
          </Badge>
          <Badge variant={data?.status.google.siteUrl ? "default" : "outline"}>
            Site URL {data?.status.google.siteUrl ? "✓" : "—"}
          </Badge>
          {!googleOk && (
            <Link
              href={data?.gscConnectUrl ?? "/dashboard/gsc-connect"}
              className="inline-flex items-center gap-1 text-teal-600 font-semibold hover:underline"
            >
              Connect Google <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCreds((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
        >
          <span className="text-sm font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4" style={{ color: TEAL }} />
            Platform credentials
          </span>
          {showCreds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCreds && (
          <div className="px-4 pb-4 space-y-4 border-t border-border">
            {(["publishing", "social", "email"] as const).map((group) => (
              <div key={group} className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                  {group}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MARKETING_CREDENTIAL_FIELDS.filter((f) => f.group === group).map((field) => {
                    const configured = data?.status.configured[field.key];
                    const serverVal = data?.credentials[field.key] ?? "";
                    const val = form[field.key] ?? serverVal;
                    return (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[11px] font-semibold flex items-center gap-1.5">
                          {field.label}
                          {configured && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          )}
                        </label>
                        <Input
                          type={field.secret ? "password" : "text"}
                          placeholder={field.hint}
                          value={val}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                const credPayload = Object.fromEntries(
                  Object.entries({ ...data?.credentials, ...form }).filter(
                    ([, v]) => v && !String(v).startsWith("••••"),
                  ),
                );
                saveMutation.mutate(credPayload);
              }}
            >
              Save credentials
            </Button>
          </div>
        )}
      </div>

      {/* Task results */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading autopilot state…
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Last run — every checklist item
          </p>
          {[...groupedTasks.entries()].map(([group, groupTasks]) => (
            <div key={group} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/30"
              >
                <span className="text-xs font-bold">{group}</span>
                <span className="text-[10px] text-muted-foreground">
                  {groupTasks.filter((t) => t.status === "posted" || t.status === "done").length}/
                  {groupTasks.length}
                </span>
              </button>
              {expandedGroup === group && (
                <div className="border-t border-border divide-y divide-border/50">
                  {groupTasks.map((t) => (
                    <div key={t.id} className="px-3 py-2 flex items-start gap-2 text-xs">
                      <StatusIcon status={t.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{t.label}</span>
                          <Badge variant="outline" className={`text-[9px] ${statusColor(t.status)}`}>
                            {t.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5 leading-snug">{t.message}</p>
                        {t.url && (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline inline-flex items-center gap-0.5 mt-1"
                          >
                            View post <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No autopilot run yet — click <strong>Run full marketing autopilot</strong> above.
        </p>
      )}

      {lastLog && (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Run log</p>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigator.clipboard.writeText(lastLog)}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-muted-foreground">
            {lastLog}
          </pre>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <strong>Honest limits:</strong> Medium, Product Hunt, Show HN, and most directories have no
        public post APIs — autopilot generates copy and saves it to Growth Content for one-click
        paste. With credentials, Dev.to, Hashnode, Twitter/X, Reddit, and Resend email pitches post
        automatically.
      </p>
    </div>
  );
}
