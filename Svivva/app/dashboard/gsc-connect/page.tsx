"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch, parseAuthJsonResponse } from "@/hooks/use-auth";
import { parseGscOAuthCredentialsFromFields } from "@/lib/gsc-oauth-credentials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCodeForm } from "@/components/admin-code-form";
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
import { getPublicSiteUrl } from "@/lib/site-url-public";
import { gscOAuthConnectUrl, GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";
import { gscOAuthErrorMessage } from "@/lib/gsc-error-messages";
import { GscManualConnectPanel } from "@/components/gsc-manual-connect";
import { followOAuthLink } from "@/lib/follow-oauth-link";
import { useToast } from "@/hooks/use-toast";

const GscConnectOrb = dynamic(() => import("@/components/gsc-connect-orb"), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto rounded-full bg-muted/30 animate-pulse"
      style={{ width: 220, height: 220 }}
    />
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
  gscPropertyOk?: boolean;
  gscMatchedSite?: string | null;
  gscSitesSample?: string[];
};

const TEAL = "#5B8DA8";
const canonicalSite = getPublicSiteUrl();

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
  if (status === "fail") return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
}

const OAUTH_START = gscOAuthConnectUrl("/dashboard/gsc-connect");

export default function GscConnectPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [saJson, setSaJson] = useState("");
  const [oauthClientId, setOauthClientId] = useState("");
  const [oauthClientSecret, setOauthClientSecret] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState<boolean | null>(null);
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [needsOAuthSetup, setNeedsOAuthSetup] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setAdminUnlocked(!!d.isAdmin);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const startOAuth = useCallback(() => {
    if (adminUnlocked) {
      followOAuthLink(OAUTH_START);
      return;
    }
    setPendingOAuth(true);
    setShowAdminUnlock(true);
  }, [adminUnlocked]);

  const { data, isLoading, refetch, isFetching, isError, error } = useQuery<DiagResult>({
    queryKey: ["/api/gsc/diagnose"],
    queryFn: async () => {
      const r = await authFetch("/api/gsc/diagnose");
      if (r.status === 403) {
        throw new Error("admin_required");
      }
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (data?.oauthAvailable === true) setNeedsOAuthSetup(false);
    else if (data?.oauthAvailable === false) setNeedsOAuthSetup(true);
  }, [data?.oauthAvailable]);

  const showSaveFeedback = useCallback(
    (text: string, ok: boolean) => {
      setMsg({ text, ok });
      toast({
        title: ok ? "Saved" : "Could not save",
        description: text,
        variant: ok ? "default" : "destructive",
      });
      requestAnimationFrame(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [toast],
  );

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gsc_connected") === "1") {
      const setup = p.get("gsc_setup");
      const setupOk = setup === "ok";
      setMsg({
        ok: setupOk || !p.get("gsc_error"),
        text: setupOk
          ? "Google connected — matched your site, submitted sitemap, and requested indexing."
          : setup?.startsWith("Found")
            ? setup
            : setup ||
              "Google signed in — add your site in Search Console (Owner), then click Sync property.",
      });
      window.history.replaceState({}, "", "/dashboard/gsc-connect");
      void refetch();
    } else if (p.get("gsc_error")) {
      const err = p.get("gsc_error");
      setMsg({
        ok: false,
        text: gscOAuthErrorMessage(err),
      });
      if (err === "admin_required") {
        setShowAdminUnlock(true);
      }
      if (err === "oauth_invalid_client" || err === "oauth_not_configured") {
        setNeedsOAuthSetup(true);
      }
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
      const d = await parseAuthJsonResponse<{ error?: string; message?: string }>(r);
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (result, vars) => {
      const msgs: Record<string, string> = {
        fix_url: "Site URL updated.",
        save_service_account: "Service account saved.",
        submit_sitemap: "Sitemap pinged.",
        save_oauth_client:
          (result as { message?: string }).message ||
          "Google OAuth client saved — click Connect with Google.",
      };
      const text = msgs[vars.action] || "Saved.";
      showSaveFeedback(text, true);
      if (vars.action === "save_oauth_client") {
        void refetch().then((r) => {
          if (r.data?.oauthAvailable) setNeedsOAuthSetup(false);
        });
      } else {
        void refetch();
      }
    },
    onError: (e: Error) => showSaveFeedback(gscOAuthErrorMessage(e.message), false),
  });

  const parsedOAuth = useMemo(
    () => parseGscOAuthCredentialsFromFields(oauthClientId, oauthClientSecret),
    [oauthClientId, oauthClientSecret],
  );
  const canSaveOAuth = Boolean(
    parsedOAuth.clientId && parsedOAuth.clientSecret && !saveMutation.isPending,
  );

  const applyOAuthPaste = useCallback((value: string) => {
    if (!value.trim().startsWith("{")) return false;
    const { clientId, clientSecret } = parseGscOAuthCredentialsFromFields(value, value);
    if (clientId) setOauthClientId(clientId);
    if (clientSecret) setOauthClientSecret(clientSecret);
    return Boolean(clientId && clientSecret);
  }, []);

  const saveOAuthClient = useCallback(() => {
    const { clientId, clientSecret } = parseGscOAuthCredentialsFromFields(
      oauthClientId,
      oauthClientSecret,
    );
    if (!clientId || !clientSecret) {
      showSaveFeedback(
        "Paste Client ID + secret, or paste the full JSON from Google Cloud Console into either field.",
        false,
      );
      return;
    }
    if (clientId !== oauthClientId) setOauthClientId(clientId);
    if (clientSecret !== oauthClientSecret) setOauthClientSecret(clientSecret);
    if (!adminUnlocked) {
      setShowAdminUnlock(true);
      showSaveFeedback(gscOAuthErrorMessage("admin_required"), false);
      return;
    }
    saveMutation.mutate({
      action: "save_oauth_client",
      clientId,
      clientSecret,
    });
  }, [adminUnlocked, oauthClientId, oauthClientSecret, saveMutation, showSaveFeedback]);

  const syncProperty = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/gsc/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_property" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: (d) => {
      setMsg({
        ok: !!d.success,
        text: d.message || "GSC property synced.",
      });
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

  const needsAdmin =
    adminUnlocked === false ||
    (isError && error instanceof Error && error.message === "admin_required");
  const connected = !!data?.oauthConnected;
  const propertyOk = !!data?.gscPropertyOk;
  const oauthConfigured = data?.oauthAvailable === true;
  const oauthAvailable = oauthConfigured && !needsOAuthSetup;
  const showOAuthClientForm = !connected && (!oauthConfigured || needsOAuthSetup);
  const fullyReady = connected && propertyOk;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {needsAdmin && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Admin unlock required</p>
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit admin code before connecting Google Search Console or running health
              checks.
            </p>
            <AdminCodeForm
              title="Unlock Google Search Console"
              description="Use the same owner passcode as Orbit Admin."
              onSuccess={() => {
                setAdminUnlocked(true);
                setShowAdminUnlock(false);
                void queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                void refetch();
                if (pendingOAuth) {
                  setPendingOAuth(false);
                  followOAuthLink(OAUTH_START);
                }
              }}
            />
          </CardContent>
        </Card>
      )}
      {/* Hero: one-press camo orb to connect */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <GscConnectOrb connected={fullyReady} available={oauthAvailable} oauthUrl={OAUTH_START} />
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {fullyReady
            ? data?.oauthEmail
              ? `Ready · ${data.oauthEmail} · ${data.gscMatchedSite || data.siteUrl}`
              : "Google Search Console is connected and indexing is enabled."
            : connected
              ? data?.oauthEmail
                ? `Signed in as ${data.oauthEmail} — finish setup in Search Console, then Sync property.`
                : "Google signed in — verify your site property, then Sync property."
              : oauthAvailable
                ? "Press the orb to connect Google Search Console — AI does the rest."
                : "Connecting will be available shortly."}
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Search indexing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Google account once — Orbit uses AI to pick the right Search Console
          property, submit your sitemap, and request indexing automatically.
        </p>
      </div>

      {/* Primary CTA */}
      <Card className="border-2 border-[#5B8DA8]/40 bg-gradient-to-br from-[#5B8DA8]/10 to-transparent">
        <CardContent className="py-6 space-y-4">
          {fullyReady ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-foreground">Google indexing ready</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data?.oauthEmail ? `Signed in as ${data.oauthEmail}` : "Account linked"}
                  {data?.gscMatchedSite || data?.siteUrl
                    ? ` · Property: ${data.gscMatchedSite || data.siteUrl}`
                    : ""}
                </p>
              </div>
            </div>
          ) : connected ? (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-foreground">Google signed in — property needed</p>
                <p className="text-sm text-muted-foreground">
                  {data?.oauthEmail ? `${data.oauthEmail} is connected` : "OAuth linked"}, but
                  Search Console does not have an Owner/Full property for{" "}
                  <span className="font-medium text-foreground">{canonicalSite}</span> yet.
                </p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5 mt-2">
                  <li>
                    Open{" "}
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Search Console
                    </a>{" "}
                    as the same Google account
                  </li>
                  <li>
                    Add property{" "}
                    <code className="text-[10px] bg-muted px-1 rounded">
                      sc-domain:{new URL(canonicalSite).hostname.replace(/^www\./, "")}
                    </code>{" "}
                    or URL prefix{" "}
                    <code className="text-[10px] bg-muted px-1 rounded">{canonicalSite}/</code>
                  </li>
                  <li>Verify ownership and ensure you are Owner (not Restricted)</li>
                  <li>Click Sync property below — no need to sign in again</li>
                </ol>
                {data?.gscSitesSample && data.gscSitesSample.length > 0 && (
                  <p className="text-[10px] text-muted-foreground pt-1">
                    Properties on this account: {data.gscSitesSample.join(", ")}
                    {(data.gscSitesSample.length ?? 0) >= 8 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Sparkles className="w-8 h-8 shrink-0" style={{ color: TEAL }} />
              <div>
                <p className="font-bold text-foreground">One-click setup</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sign in as{" "}
                  <span className="font-medium text-foreground">{GSC_OAUTH_LOGIN_HINT}</span> → AI
                  matches your site → sitemap + indexing run automatically.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!connected &&
              oauthAvailable &&
              (adminUnlocked ? (
                <Button
                  asChild
                  className="text-white font-bold"
                  style={{ background: `linear-gradient(135deg,${TEAL},#6B2C4E)` }}
                  data-testid="btn-connect-google"
                >
                  <a href={OAUTH_START}>Connect with Google</a>
                </Button>
              ) : (
                <Button
                  className="text-white font-bold"
                  style={{ background: `linear-gradient(135deg,${TEAL},#6B2C4E)` }}
                  onClick={startOAuth}
                  data-testid="btn-connect-google"
                >
                  Connect with Google
                </Button>
              ))}
            {connected && !propertyOk && (
              <Button
                className="text-white font-bold"
                style={{ background: `linear-gradient(135deg,${TEAL},#6B2C4E)` }}
                onClick={() => syncProperty.mutate()}
                disabled={syncProperty.isPending}
                data-testid="btn-sync-gsc-property"
              >
                {syncProperty.isPending ? "Syncing…" : "Sync property"}
              </Button>
            )}
            {!connected && showOAuthClientForm && (
              <div className="w-full space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Google OAuth client not configured yet
                </p>
                {!adminUnlocked && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-2">
                    Enter the admin passcode above before saving OAuth credentials.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Create an OAuth 2.0 Web client in{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google Cloud Console
                  </a>
                  . Enable <strong>Search Console API</strong> and{" "}
                  <strong>Web Search Indexing API</strong>. Add redirect URI{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">
                    {canonicalSite}/api/gsc/oauth/callback
                  </code>
                  , then paste the client ID and secret below — or paste the{" "}
                  <strong>entire JSON</strong> from Google Cloud into either field (saved in the app
                  database, no Vercel redeploy needed).
                </p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="gsc-oauth-client-id" className="text-[11px]">
                      Client ID (or full JSON)
                    </Label>
                    <Input
                      id="gsc-oauth-client-id"
                      value={oauthClientId}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (applyOAuthPaste(v)) return;
                        setOauthClientId(v);
                      }}
                      onPaste={(e) => {
                        const v = e.clipboardData.getData("text");
                        if (applyOAuthPaste(v)) e.preventDefault();
                      }}
                      placeholder="123456789-abc.apps.googleusercontent.com — or paste full JSON"
                      className="h-8 text-xs font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gsc-oauth-client-secret" className="text-[11px]">
                      Client secret
                    </Label>
                    <Input
                      id="gsc-oauth-client-secret"
                      type="password"
                      value={oauthClientSecret}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (applyOAuthPaste(v)) return;
                        setOauthClientSecret(v);
                      }}
                      onPaste={(e) => {
                        const v = e.clipboardData.getData("text");
                        if (applyOAuthPaste(v)) e.preventDefault();
                      }}
                      placeholder="GOCSPX-… (auto-filled if you pasted JSON above)"
                      className="h-8 text-xs font-mono mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="text-white font-bold"
                    style={{ background: `linear-gradient(135deg,${TEAL},#6B2C4E)` }}
                    disabled={!canSaveOAuth}
                    onClick={saveOAuthClient}
                    data-testid="btn-save-oauth-client"
                  >
                    {saveMutation.isPending ? "Saving…" : "Save OAuth client"}
                  </Button>
                  {!oauthConfigured && canSaveOAuth && (
                    <p className="text-[10px] text-muted-foreground">
                      Save first, then use Connect with Google. Saving needs DATABASE_URL in Vercel
                      (hosted Postgres).
                    </p>
                  )}
                  {msg && (
                    <p
                      ref={feedbackRef}
                      className={`text-xs px-2.5 py-2 rounded-md border ${
                        msg.ok
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="border-[#5B8DA8]/40 text-[#5B8DA8]"
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
            on <span className="font-medium text-foreground">{GSC_OAUTH_LOGIN_HINT}</span> (Owner).
          </p>
        </CardContent>
      </Card>

      {!connected && (
        <GscManualConnectPanel
          adminUnlocked={adminUnlocked === true}
          onRequestAdminUnlock={() => setShowAdminUnlock(true)}
          onConnected={(text) => {
            setMsg({ ok: true, text });
            void refetch();
          }}
          onError={(text) => {
            if (text) setMsg({ ok: false, text });
          }}
        />
      )}

      {msg && !showOAuthClientForm && (
        <div
          ref={feedbackRef}
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
        Another option: connect with a Google service account (no browser sign-in)
      </button>

      {advancedOpen && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Service account JSON</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Skips OAuth entirely. Create a service account in Google Cloud, enable Search Console
              API + Indexing API, download the JSON key, and add the service account email as a user
              (Owner or Full) on your Search Console property.
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
              onClick={() => saveMutation.mutate({ action: "save_service_account", json: saJson })}
              data-testid="btn-save-service-account"
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
        <a
          href="https://search.google.com/search-console/sitemaps"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm">
            Open GSC <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </a>
      </div>

      <Dialog open={showAdminUnlock} onOpenChange={setShowAdminUnlock}>
        <DialogContent className="max-w-sm border-border/60 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Unlock admin to connect Google</DialogTitle>
            <DialogDescription>
              Enter the admin passcode to connect Google Search Console.
            </DialogDescription>
          </DialogHeader>
          <div className="p-2">
            <AdminCodeForm
              title="Unlock to connect Google"
              description="Enter the 6-digit admin code, then we'll open Google sign-in."
              onSuccess={() => {
                setAdminUnlocked(true);
                setShowAdminUnlock(false);
                void queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                void refetch();
                if (pendingOAuth) {
                  setPendingOAuth(false);
                  followOAuthLink(OAUTH_START);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
