"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, CheckCircle2, Info } from "lucide-react";

type StatusPayload = {
  stored: {
    openai: boolean;
    openaiBaseUrl: boolean;
    stripeSecret: boolean;
    stripePublishable: boolean;
    stripeWebhook: boolean;
    siteUrl: boolean;
  };
  deploymentOverrides: Record<string, boolean>;
  effective: {
    openai: boolean;
    openaiBaseUrl: boolean;
    stripeSecret: boolean;
    stripePublishable: boolean;
    stripeWebhook: boolean;
    siteUrl: boolean;
  };
  updatedAt: string | null;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-muted-foreground/40"}`}
      title={ok ? "Yes" : "No"}
    />
  );
}

export default function RuntimeKeysPage() {
  const { data: me } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });

  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [nextPublicSiteUrl, setNextPublicSiteUrl] = useState("");

  const [clearOpenai, setClearOpenai] = useState(false);
  const [clearOpenaiBase, setClearOpenaiBase] = useState(false);
  const [clearStripeSecret, setClearStripeSecret] = useState(false);
  const [clearStripePublishable, setClearStripePublishable] = useState(false);
  const [clearStripeWebhook, setClearStripeWebhook] = useState(false);
  const [clearSiteUrl, setClearSiteUrl] = useState(false);

  const load = async () => {
    setLoadError(null);
    try {
      const res = await authFetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus(await res.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    if (me?.isAdmin) void load();
  }, [me?.isAdmin]);

  const submit = async () => {
    setSaveMessage(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (clearOpenai) body.openaiApiKey = "";
      else if (openaiApiKey.trim()) body.openaiApiKey = openaiApiKey.trim();

      if (clearOpenaiBase) body.openaiBaseUrl = "";
      else if (openaiBaseUrl.trim()) body.openaiBaseUrl = openaiBaseUrl.trim();

      if (clearStripeSecret) body.stripeSecretKey = "";
      else if (stripeSecretKey.trim()) body.stripeSecretKey = stripeSecretKey.trim();

      if (clearStripePublishable) body.stripePublishableKey = "";
      else if (stripePublishableKey.trim()) body.stripePublishableKey = stripePublishableKey.trim();

      if (clearStripeWebhook) body.stripeWebhookSecret = "";
      else if (stripeWebhookSecret.trim()) body.stripeWebhookSecret = stripeWebhookSecret.trim();

      if (clearSiteUrl) body.nextPublicSiteUrl = "";
      else if (nextPublicSiteUrl.trim()) body.nextPublicSiteUrl = nextPublicSiteUrl.trim();

      if (Object.keys(body).length === 0) {
        setSaveMessage("Change a field, or check a “clear” box, then save.");
        return;
      }

      const res = await authFetch("/api/admin/platform-secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);

      setOpenaiApiKey("");
      setOpenaiBaseUrl("");
      setStripeSecretKey("");
      setStripePublishableKey("");
      setStripeWebhookSecret("");
      setNextPublicSiteUrl("");
      setClearOpenai(false);
      setClearOpenaiBase(false);
      setClearStripeSecret(false);
      setClearStripePublishable(false);
      setClearStripeWebhook(false);
      setClearSiteUrl(false);
      setSaveMessage(
        "Saved. New server instances pick this up immediately; some hosts may need a moment to refresh.",
      );
      await load();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (me && !me.isAdmin) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-muted-foreground">You do not have access to this page.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to settings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Settings
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Runtime credentials</h1>
        <p className="text-muted-foreground">
          Store OpenAI, Stripe, and site URL in the database when you do not want to paste keys into
          your host’s environment panel.{" "}
          <strong className="text-foreground font-medium">Host env vars still win</strong> if they
          are set at deploy time.
        </p>
      </div>

      <Card className="border-blue-200/60 dark:border-blue-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            On server startup, keys from this page are loaded into the process only for slots that
            are <em>empty</em> in your deployment environment. Set{" "}
            <code className="text-xs">DATABASE_URL</code> on the host as usual; this feature cannot
            bootstrap the database connection itself.
          </p>
          <p>
            After saving, this instance reloads secrets immediately. Other serverless instances
            refresh on their next cold start (or when they load this page’s API again).
          </p>
        </CardContent>
      </Card>

      {!status && !loadError && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Stored = saved in Postgres. Effective = what the server is using after env + DB merge.
              Updated {status.updatedAt ? new Date(status.updatedAt).toLocaleString() : "never"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 max-w-md">
              <span />
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Stored</span>
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Live</span>
              <span>OpenAI key</span>
              <Dot ok={status.stored.openai} />
              <Dot ok={status.effective.openai} />
              <span>OpenAI base URL</span>
              <Dot ok={status.stored.openaiBaseUrl} />
              <Dot ok={status.effective.openaiBaseUrl} />
              <span>Stripe secret</span>
              <Dot ok={status.stored.stripeSecret} />
              <Dot ok={status.effective.stripeSecret} />
              <span>Stripe publishable</span>
              <Dot ok={status.stored.stripePublishable} />
              <Dot ok={status.effective.stripePublishable} />
              <span>Stripe webhook</span>
              <Dot ok={status.stored.stripeWebhook} />
              <Dot ok={status.effective.stripeWebhook} />
              <span>Site URL</span>
              <Dot ok={status.stored.siteUrl} />
              <Dot ok={status.effective.siteUrl} />
            </div>
          </CardContent>
        </Card>
      )}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Update secrets</CardTitle>
            <CardDescription>
              Leave inputs blank to leave saved values unchanged. Check “clear” to remove a value
              from app storage (only affects slots your host did not set at deploy).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>OpenAI API key</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={
                  status.stored.openai ? "•••••••• (saved — enter new to replace)" : "sk-…"
                }
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                disabled={clearOpenai || !!status.deploymentOverrides.openai}
              />
              {status.deploymentOverrides.openai && (
                <p className="text-xs text-muted-foreground">
                  Overridden by host environment — database value is ignored.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-openai"
                  checked={clearOpenai}
                  onCheckedChange={(v) => setClearOpenai(!!v)}
                  disabled={!!status.deploymentOverrides.openai}
                />
                <Label htmlFor="c-openai" className="font-normal text-muted-foreground">
                  Clear saved OpenAI key
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>OpenAI base URL (optional)</Label>
              <Input
                type="url"
                placeholder="https://…"
                value={openaiBaseUrl}
                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                disabled={clearOpenaiBase || !!status.deploymentOverrides.openaiBase}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-openai-base"
                  checked={clearOpenaiBase}
                  onCheckedChange={(v) => setClearOpenaiBase(!!v)}
                  disabled={!!status.deploymentOverrides.openaiBase}
                />
                <Label htmlFor="c-openai-base" className="font-normal text-muted-foreground">
                  Clear saved base URL
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Stripe secret key</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={status.stored.stripeSecret ? "••••••••" : "sk_live_… or sk_test_…"}
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                disabled={clearStripeSecret || !!status.deploymentOverrides.stripeSecret}
              />
              {status.deploymentOverrides.stripeSecret && (
                <p className="text-xs text-muted-foreground">Overridden by host environment.</p>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-stripe-sec"
                  checked={clearStripeSecret}
                  onCheckedChange={(v) => setClearStripeSecret(!!v)}
                  disabled={!!status.deploymentOverrides.stripeSecret}
                />
                <Label htmlFor="c-stripe-sec" className="font-normal text-muted-foreground">
                  Clear saved Stripe secret
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Stripe publishable key</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={
                  status.stored.stripePublishable ? "••••••••" : "pk_live_… or pk_test_…"
                }
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                disabled={clearStripePublishable || !!status.deploymentOverrides.stripePublishable}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-stripe-pub"
                  checked={clearStripePublishable}
                  onCheckedChange={(v) => setClearStripePublishable(!!v)}
                  disabled={!!status.deploymentOverrides.stripePublishable}
                />
                <Label htmlFor="c-stripe-pub" className="font-normal text-muted-foreground">
                  Clear saved publishable key
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Stripe webhook signing secret</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={status.stored.stripeWebhook ? "••••••••" : "whsec_…"}
                value={stripeWebhookSecret}
                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                disabled={clearStripeWebhook || !!status.deploymentOverrides.stripeWebhook}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-stripe-wh"
                  checked={clearStripeWebhook}
                  onCheckedChange={(v) => setClearStripeWebhook(!!v)}
                  disabled={!!status.deploymentOverrides.stripeWebhook}
                />
                <Label htmlFor="c-stripe-wh" className="font-normal text-muted-foreground">
                  Clear saved webhook secret
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Public site URL</Label>
              <Input
                type="url"
                placeholder="https://your-domain.com"
                value={nextPublicSiteUrl}
                onChange={(e) => setNextPublicSiteUrl(e.target.value)}
                disabled={clearSiteUrl || !!status.deploymentOverrides.siteUrl}
              />
              {status.deploymentOverrides.siteUrl && (
                <p className="text-xs text-muted-foreground">
                  Overridden by host — client bundles still use build-time{" "}
                  <code className="text-xs">NEXT_PUBLIC_SITE_URL</code> where applicable.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c-site"
                  checked={clearSiteUrl}
                  onCheckedChange={(v) => setClearSiteUrl(!!v)}
                  disabled={!!status.deploymentOverrides.siteUrl}
                />
                <Label htmlFor="c-site" className="font-normal text-muted-foreground">
                  Clear saved site URL
                </Label>
              </div>
            </div>

            {saveMessage && (
              <p
                className={`text-sm flex items-start gap-2 ${saveMessage.startsWith("Saved") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {saveMessage.startsWith("Saved") ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : null}
                {saveMessage}
              </p>
            )}

            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to database"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
