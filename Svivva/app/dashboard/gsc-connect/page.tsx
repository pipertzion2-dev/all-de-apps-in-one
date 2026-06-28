"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const GscConnectOrb = dynamic(() => import("@/components/gsc-connect-orb"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto rounded-full bg-muted/30 animate-pulse" style={{ width: 220, height: 220 }} />
  ),
});

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
  oauthConnected?: boolean;
  oauthEmail?: string | null;
  oauthAvailable?: boolean;
};

const TEAL = "#5BA8A0";

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
  if (status === "fail") return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
}

export default function GscConnectPage() {
  const [saJson, setSaJson] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gsc_connected") === "1") {
      const setup = p.get("gsc_setup");
      setMsg({
        ok: setup === "ok" || !p.get("gsc_error"),
        text:
          setup === "ok"
            ? "Google connected — AI matched your site, submitted sitemap, and requested indexing."
            : setup || "Google connected.",
      });
      window.history.replaceState({}, "", "/dashboard/gsc-connect");
      void refetch();
    } else if (p.get("gsc_error")) {
      setMsg({ ok: false, text: `Google sign-in failed: ${p.get("gsc_error")}` });
      window.history.replaceState({}, "", "/dashboard/gsc-connect");
    }
  }, [refetch]);

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const r = await authFetch("/api/gsc/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (_, vars) => {
      const msgs: Record<string, string> = {
        fix_url: "Site URL updated.",
        save_service_account: "Service account saved.",
        submit_sitemap: "Sitemap pinged.",
      };
      setMsg({ text: msgs[vars.action] || "Saved.", ok: true });
      refetch();
    },
    onError: (e: Error) => setMsg({ text: e.message, ok: false }),
  });

  const runIndexing = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/gsc/run-indexing", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (d) => {
      const gi = d.indexing?.googleIndexing?.submitted ?? 0;
      setMsg({
        ok: !!d.ok,
        text: d.message || `Indexing complete — ${gi} URLs notified to Google.`,
      });
      refetch();
    },
    onError: (e: Error) => setMsg({ text: e.message, ok: false }),
  });

  const connected = !!data?.oauthConnected;
  const oauthAvailable = data?.oauthAvailable !== false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Hero: one-press camo orb to connect */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <GscConnectOrb
          connected={connected}
          available={oauthAvailable}
          oauthUrl="/api/gsc/oauth/start?return=/dashboard/gsc-connect"
        />
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {connected
            ? data?.oauthEmail
              ? `Signed in as ${data.oauthEmail}`
              : "Google account linked."
            : oauthAvailable
              ? "Press the orb to connect Google Search Console — AI does the rest."
              : "Connecting will be available shortly."}
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Search indexing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Google account once — Orbit uses AI to pick the right Search Console property,
          submit your sitemap, and request indexing automatically.
        </p>
      </div>

      {/* Primary CTA */}
      <Card className="border-2 border-[#5BA8A0]/40 bg-gradient-to-br from-[#5BA8A0]/10 to-transparent">
        <CardContent className="py-6 space-y-4">
          {connected ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-foreground">Google connected</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data?.oauthEmail ? `Signed in as ${data.oauthEmail}` : "Account linked"}
                  {data?.siteUrl ? ` · Property: ${data.siteUrl}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Sparkles className="w-8 h-8 shrink-0" style={{ color: TEAL }} />
              <div>
                <p className="font-bold text-foreground">One-click setup</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sign in with Google → AI matches your site → sitemap + indexing run automatically.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!connected && oauthAvailable && (
              <a href="/api/gsc/oauth/start?return=/dashboard/gsc-connect">
                <Button
                  className="text-white font-bold"
                  style={{ background: `linear-gradient(135deg,${TEAL},#6B2C4A)` }}
                  data-testid="btn-connect-google"
                >
                  Connect with Google
                </Button>
              </a>
            )}
            {!connected && !oauthAvailable && (
              <p className="text-xs text-amber-500">
                Server needs GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET in Vercel env.
              </p>
            )}
            <Button
              variant="outline"
              className="border-[#5BA8A0]/40 text-[#5BA8A0]"
              onClick={() => runIndexing.mutate()}
              disabled={runIndexing.isPending || (!connected && !data?.serviceAccountEmail)}
              data-testid="btn-run-indexing"
            >
              {runIndexing.isPending ? "Running…" : "Run Google indexing now"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Requires the site to be verified in{" "}
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Search Console
            </a>{" "}
            on the same Google account you connect.
          </p>
        </CardContent>
      </Card>

      {msg && (
        <div
          className={`text-sm px-4 py-3 rounded-lg border ${msg.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"}`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Health checks
        </p>
        <span className="text-sm font-bold tabular-nums">
          {isLoading ? "—" : `${data?.score ?? 0}%`}
        </span>
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          : data?.steps.map((step) => (
              <Card key={step.id} className="border-border/50">
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <StatusIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                    {step.id === "site_url" && step.fix && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs"
                        onClick={() =>
                          saveMutation.mutate({ action: "fix_url", siteUrl: step.fix! })
                        }
                      >
                        Fix URL → {step.fix}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Advanced: service account JSON (optional)
      </button>

      {advancedOpen && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Service account JSON</CardTitle>
            <CardDescription className="text-xs">
              Legacy option — Connect with Google above is easier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder='{"type":"service_account",...}'
              value={saJson}
              onChange={(e) => setSaJson(e.target.value)}
              className="font-mono text-xs h-28"
            />
            <Button
              size="sm"
              disabled={!saJson.trim() || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({ action: "save_service_account", json: saJson })
              }
            >
              Save service account
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Link href="/dashboard/launchpad">
          <Button variant="outline" size="sm">
            ← Back to Orbit launchpad
          </Button>
        </Link>
        <a href="https://search.google.com/search-console/sitemaps" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            Open GSC <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </a>
      </div>
    </div>
  );
}
