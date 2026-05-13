"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Rocket,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VERCEL_ENV = `NEXT_PUBLIC_SITE_URL=https://svivva.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
NEXTAUTH_SECRET=generate-a-strong-random-secret
ISSUER_URL=your-auth-issuer-url
OIDC_CLIENT_ID=your-auth-client-id
ADMIN_USER_ID=your-admin-user-id
ORBIT_INTERNAL_SECRET=generate-a-strong-random-secret
CRON_SECRET=generate-a-strong-random-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...`;

type HealthPayload = {
  status?: string;
  siteUrl?: string;
  database?: { connected?: boolean; error?: string };
  environment?: {
    hasOpenAI?: boolean;
    hasStripe?: boolean;
    hasStripeWebhook?: boolean;
    orbitInternalSecret?: boolean;
    cronSecret?: boolean;
  };
  stripe?: { connected?: boolean; webhookConfigured?: boolean };
};

type SecretStatus = {
  stored: Record<string, boolean>;
  deploymentOverrides: Record<string, boolean>;
  effective: Record<string, boolean>;
  updatedAt: string | null;
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
        ok
          ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function SetupStep({
  number,
  title,
  detail,
  ok,
  href,
  external,
}: {
  number: number;
  title: string;
  detail: string;
  ok: boolean;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 active:scale-[0.99] transition">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          ok ? "bg-green-500 text-white" : "bg-amber-500 text-white"
        }`}
      >
        {ok ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold leading-tight">{title}</h3>
          {href ? <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{detail}</p>
      </div>
    </div>
  );

  if (!href) return body;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    );
  }
  return <Link href={href}>{body}</Link>;
}

export default function FinishSetupPage() {
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [autopilotMessage, setAutopilotMessage] = useState<string | null>(null);

  const { data: me } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });

  const { data: secrets } = useQuery<SecretStatus>({
    queryKey: ["/api/admin/platform-secrets"],
    queryFn: async () => {
      const res = await authFetch("/api/admin/platform-secrets");
      if (!res.ok) throw new Error("Runtime key status is not available yet.");
      return res.json();
    },
    enabled: !!me?.isAdmin,
    retry: false,
  });

  const loadHealth = async () => {
    setHealthError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setHealth(json);
    } catch (e) {
      setHealthError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  const checks = useMemo(() => {
    const siteOk = health?.siteUrl === "https://svivva.com";
    const dbOk = !!health?.database?.connected;
    const stripeOk = !!(health?.environment?.hasStripe || secrets?.effective?.stripeSecret);
    const webhookOk = !!(
      health?.environment?.hasStripeWebhook || secrets?.effective?.stripeWebhook
    );
    const openaiOk = !!(health?.environment?.hasOpenAI || secrets?.effective?.openai);
    const internalOk = !!health?.environment?.orbitInternalSecret;
    const cronOk = !!health?.environment?.cronSecret;
    return { siteOk, dbOk, stripeOk, webhookOk, openaiOk, internalOk, cronOk };
  }, [health, secrets]);

  const readyCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.values(checks).length;

  const copyEnv = async () => {
    await navigator.clipboard.writeText(VERCEL_ENV);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const runAutopilot = async () => {
    setAutopilotActive(true);
    setAutopilotMessage(null);
    try {
      const res = await authFetch("/api/orbit/workspace-autopilot", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Autopilot failed.");
      setAutopilotMessage(json.summary || "Autopilot completed.");
      await loadHealth();
    } catch (e) {
      setAutopilotMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setAutopilotActive(false);
    }
  };

  if (me && !me.isAdmin) {
    return <p className="text-muted-foreground">You do not have access to this page.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-5 text-white shadow-xl">
        <div className="flex items-center gap-2 text-amber-200">
          <Smartphone className="h-5 w-5" />
          <span className="text-sm font-bold uppercase tracking-wide">iPhone admin setup</span>
        </div>
        <h1 className="mt-3 text-3xl font-black leading-tight">Finish Svivva from your phone</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          This page tells you exactly what is missing, gives you copy/paste production variables,
          and links to Orbit, Stripe, Vercel, and runtime keys.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill ok={readyCount === totalCount} label={`${readyCount}/${totalCount} ready`} />
          <StatusPill
            ok={health?.status === "ok"}
            label={health?.status === "ok" ? "Healthy" : "Needs setup"}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Live status
          </CardTitle>
          <CardDescription>
            Refresh this after changing Vercel env vars or app runtime keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <StatusPill ok={checks.siteOk} label="svivva.com URL" />
            <StatusPill ok={checks.dbOk} label="Database" />
            <StatusPill ok={checks.stripeOk} label="Stripe keys" />
            <StatusPill ok={checks.webhookOk} label="Stripe webhook" />
            <StatusPill ok={checks.openaiOk} label="OpenAI" />
            <StatusPill ok={checks.internalOk && checks.cronOk} label="Automation secrets" />
          </div>
          {healthError ? <p className="text-sm text-destructive">{healthError}</p> : null}
          {health?.database?.error ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              Database issue: {health.database.error}
            </p>
          ) : null}
          <Button variant="outline" className="w-full" onClick={() => void loadHealth()}>
            Refresh status
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <SetupStep
          number={1}
          title="Fix Vercel production env"
          detail="Required first: set DATABASE_URL and NEXT_PUBLIC_SITE_URL in Vercel, then redeploy."
          ok={checks.dbOk && checks.siteOk}
          href="https://vercel.com/dashboard"
          external
        />
        <SetupStep
          number={2}
          title="Save app runtime keys"
          detail="After database works, save Stripe/OpenAI/site URL keys directly in Svivva from your iPhone."
          ok={checks.stripeOk && checks.webhookOk && checks.openaiOk}
          href="/dashboard/settings/runtime-keys"
        />
        <SetupStep
          number={3}
          title="Connect Stripe"
          detail="Copy live API keys and add webhook URL https://svivva.com/api/stripe/webhook."
          ok={checks.stripeOk && checks.webhookOk}
          href="https://dashboard.stripe.com/apikeys"
          external
        />
        <SetupStep
          number={4}
          title="Run Orbit Traffic Autopilot"
          detail="Checks connections, app health, sitemap/robots, and unpublishes broken AI/tool pages."
          ok={health?.status === "ok"}
          href="/dashboard/launchpad"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Vercel copy/paste block
          </CardTitle>
          <CardDescription>
            Use this on iPhone in Vercel → Project → Settings → Environment Variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-muted p-3 text-xs leading-relaxed">
            {VERCEL_ENV}
          </pre>
          <Button className="w-full" onClick={() => void copyEnv()}>
            <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy env checklist"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="h-auto justify-start gap-3 rounded-2xl p-4">
          <Link href="/dashboard/settings/runtime-keys">
            <KeyRound className="h-5 w-5" />
            <span className="text-left">
              <span className="block font-black">Runtime keys</span>
              <span className="block text-xs opacity-80">Stripe + OpenAI</span>
            </span>
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto justify-start gap-3 rounded-2xl p-4"
        >
          <Link href="/dashboard/launchpad">
            <Rocket className="h-5 w-5" />
            <span className="text-left">
              <span className="block font-black">Orbit</span>
              <span className="block text-xs opacity-80">Traffic autopilot</span>
            </span>
          </Link>
        </Button>
      </div>

      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> One-tap autopilot
          </CardTitle>
          <CardDescription>
            Use after the database and admin login work on production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => void runAutopilot()} disabled={autopilotActive}>
            {autopilotActive ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Connect + check everything
          </Button>
          {autopilotMessage ? (
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-muted p-3 text-xs">
              {autopilotMessage}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
