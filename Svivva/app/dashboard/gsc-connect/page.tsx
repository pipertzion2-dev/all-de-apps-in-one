"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type StepStatus = "ok" | "warn" | "fail" | "skip";

type DiagStep = {
  id: string;
  label: string;
  status: StepStatus;
  detail: string;
  fix?: string;
};

type DiagResult = {
  steps: DiagStep[];
  score: number;
  siteUrl: string;
  serviceAccountEmail: string | null;
};

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
  if (status === "fail") return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
}

function StatusBadge({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, { label: string; class: string }> = {
    ok: { label: "Pass", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    warn: { label: "Warning", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    fail: { label: "Fail", class: "bg-red-500/10 text-red-600 border-red-500/20" },
    skip: { label: "Optional", class: "bg-muted/30 text-muted-foreground border-border" },
  };
  const { label, class: cls } = map[status];
  return <Badge variant="outline" className={`text-xs font-medium ${cls}`}>{label}</Badge>;
}

export default function GscConnectPage() {
  const [saJson, setSaJson] = useState("");
  const [saJsonOpen, setSaJsonOpen] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<DiagResult>({
    queryKey: ["/api/gsc/diagnose"],
    queryFn: async () => {
      const r = await authFetch("/api/gsc/diagnose");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const r = await authFetch("/api/gsc/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (_, vars) => {
      const msgs: Record<string, string> = {
        fix_url: "Site URL updated.",
        save_service_account: "Service account saved and verified.",
        submit_sitemap: "Sitemap pinged to Google and Bing.",
      };
      setMsg({ text: msgs[vars.action] || "Saved.", ok: true });
      if (vars.action === "save_service_account") { setSaJson(""); setSaJsonOpen(false); }
      refetch();
    },
    onError: (e: Error) => { setMsg({ text: e.message, ok: false }); },
  });

  const urlStep = data?.steps.find((s) => s.id === "site_url");
  const saStep = data?.steps.find((s) => s.id === "service_account");

  const score = data?.score ?? 0;
  const scoreColor = score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Search Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live diagnostics for your GSC connection. Hit Re-check at any time.
        </p>
      </div>

      {/* Score */}
      <Card className="border-border/50">
        <CardContent className="py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Connection health</p>
            <p className={`text-4xl font-bold mt-0.5 tabular-nums ${scoreColor}`} data-testid="text-gsc-score">
              {isLoading ? "—" : `${score}%`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="btn-refresh-gsc">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Checking…" : "Re-check"}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback message */}
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${msg.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"}`} data-testid="text-gsc-msg">
          {msg.text}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          : data?.steps.map((step) => (
              <Card key={step.id} className="border-border/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={step.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{step.label}</span>
                        <StatusBadge status={step.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.detail}</p>

                      {/* Auto-fix URL */}
                      {step.id === "site_url" && step.fix && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
                          onClick={() => saveMutation.mutate({ action: "fix_url", siteUrl: step.fix! })}
                          disabled={saveMutation.isPending}
                          data-testid="btn-fix-url"
                        >
                          Fix → set to {step.fix}
                        </Button>
                      )}

                      {/* Ping sitemap */}
                      {step.id === "sitemap_accessible" && step.status !== "ok" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
                          onClick={() => saveMutation.mutate({ action: "submit_sitemap" })}
                          disabled={saveMutation.isPending}
                          data-testid="btn-submit-sitemap"
                        >
                          Ping Google &amp; Bing now
                        </Button>
                      )}

                      {/* Expand SA paste when service_account step is shown */}
                      {step.id === "service_account" && step.status === "skip" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
                          onClick={() => setSaJsonOpen((o) => !o)}
                          data-testid="btn-add-sa"
                        >
                          Add service account JSON
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Service account JSON paste — shown when open */}
      {(saJsonOpen || saStep?.status === "ok" || saStep?.status === "warn") && (
        <Card className={`border ${saStep?.status === "ok" ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#5BA8A0]/30 bg-[#5BA8A0]/5"}`} data-testid="card-sa-json">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold">
                  {saStep?.status === "ok" ? "Service account connected" : "Add service account JSON (optional)"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {saStep?.status === "ok"
                    ? `Connected as ${data?.serviceAccountEmail}. Paste a new JSON below to replace it.`
                    : "Enables GSC analytics API (impressions, clicks). Not required for sitemap submission."}
                </CardDescription>
              </div>
              {saJsonOpen && (
                <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" onClick={() => setSaJsonOpen(false)} data-testid="btn-close-sa-json">
                  <ChevronUp className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-5 pt-1 space-y-3">
            {saStep?.status !== "ok" && (
              <>
                <Textarea
                  placeholder='{"type":"service_account","project_id":"…","private_key":"…","client_email":"…"}'
                  value={saJson}
                  onChange={(e) => setSaJson(e.target.value)}
                  className="font-mono text-xs h-36 resize-none"
                  data-testid="textarea-sa-json"
                />
                <Button
                  size="sm"
                  className="bg-[#5BA8A0] hover:bg-[#5BA8A0]/90 text-white"
                  onClick={() => saveMutation.mutate({ action: "save_service_account", json: saJson })}
                  disabled={saveMutation.isPending || !saJson.trim()}
                  data-testid="btn-save-sa-json"
                >
                  {saveMutation.isPending ? "Verifying…" : "Save & verify"}
                </Button>
                {saveMutation.isSuccess && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400" data-testid="text-sa-save-success">
                    Saved and verified.
                  </p>
                )}
                {saveMutation.isError && (
                  <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-sa-save-error">
                    {(saveMutation.error as Error).message}
                  </p>
                )}
              </>
            )}
            {saStep?.status === "ok" && data?.serviceAccountEmail && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ {data.serviceAccountEmail}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ping sitemap button — always available */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
          onClick={() => saveMutation.mutate({ action: "submit_sitemap" })}
          disabled={saveMutation.isPending}
          data-testid="btn-ping-sitemap"
        >
          Ping sitemap to Google &amp; Bing
        </Button>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick links</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Search Console", href: "https://search.google.com/search-console", desc: "Main dashboard" },
            { label: "Sitemaps", href: "https://search.google.com/search-console/sitemaps", desc: "View submitted sitemaps" },
            { label: "URL Inspection", href: "https://search.google.com/search-console/inspect", desc: "Request indexing" },
            { label: "Coverage report", href: "https://search.google.com/search-console/index", desc: "Indexed pages" },
          ].map((l) => (
            <Link key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" data-testid={`link-gsc-${l.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
                <div>
                  <p className="text-xs font-semibold">{l.label}</p>
                  <p className="text-[11px] text-muted-foreground">{l.desc}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
