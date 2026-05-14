"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CreditCard, ExternalLink } from "lucide-react";
import { getPublicSiteUrl } from "@/lib/site-url-public";

type StatusPayload = {
  stored: {
    stripeSecret: boolean;
    stripePublishable: boolean;
    stripeWebhook: boolean;
  };
  deploymentOverrides: {
    stripeSecret: boolean;
    stripePublishable: boolean;
    stripeWebhook: boolean;
  };
  effective: {
    stripeSecret: boolean;
    stripePublishable: boolean;
    stripeWebhook: boolean;
  };
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-muted-foreground/35"}`}
      title={ok ? "Configured" : "Missing"}
    />
  );
}

export function OrbitStripeSetup() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

  const [clearStripeSecret, setClearStripeSecret] = useState(false);
  const [clearStripePublishable, setClearStripePublishable] = useState(false);
  const [clearStripeWebhook, setClearStripeWebhook] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus(await res.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaveMessage(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (clearStripeSecret) body.stripeSecretKey = "";
      else if (stripeSecretKey.trim()) body.stripeSecretKey = stripeSecretKey.trim();

      if (clearStripePublishable) body.stripePublishableKey = "";
      else if (stripePublishableKey.trim()) body.stripePublishableKey = stripePublishableKey.trim();

      if (clearStripeWebhook) body.stripeWebhookSecret = "";
      else if (stripeWebhookSecret.trim()) body.stripeWebhookSecret = stripeWebhookSecret.trim();

      if (Object.keys(body).length === 0) {
        setSaveMessage("Enter a key or check a “clear” box, then save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/platform-secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);

      setStripeSecretKey("");
      setStripePublishableKey("");
      setStripeWebhookSecret("");
      setClearStripeSecret(false);
      setClearStripePublishable(false);
      setClearStripeWebhook(false);
      setSaveMessage("Saved. Billing and checkout can use Stripe on the next server load.");
      await load();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const site = getPublicSiteUrl();
  const webhookUrl = `${site}/api/stripe/webhook`;

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"
          aria-hidden
        >
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-bold text-sm tracking-tight">Stripe (checkout & billing)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Paste keys here so you do not need Cursor or host panels. Same storage as{" "}
            <Link href="/dashboard/settings/runtime-keys" className="underline text-foreground">
              Settings → Runtime keys
            </Link>
            . If your host already sets <code className="text-[10px]">STRIPE_*</code> env vars,
            those win and the fields below are ignored.
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      {status && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Dot ok={status.effective.stripeSecret} /> Secret (effective)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot ok={status.effective.stripePublishable} /> Publishable
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot ok={status.effective.stripeWebhook} /> Webhook secret
          </span>
        </div>
      )}

      <div className="rounded-lg bg-muted/30 border border-border px-2.5 py-2 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Webhook URL (Stripe Dashboard → Developers → Webhooks)
        </p>
        <code className="text-[10px] break-all block text-foreground">{webhookUrl}</code>
        <p className="text-[10px] text-muted-foreground">
          Events: <code className="text-[10px]">checkout.session.completed</code>,{" "}
          <code className="text-[10px]">customer.subscription.deleted</code>
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Stripe secret key</Label>
          <Input
            type="password"
            autoComplete="off"
            placeholder={
              status?.stored.stripeSecret ? "•••••••• (saved — enter to replace)" : "sk_live_…"
            }
            value={stripeSecretKey}
            onChange={(e) => setStripeSecretKey(e.target.value)}
            disabled={clearStripeSecret || !!status?.deploymentOverrides.stripeSecret}
            className="text-sm"
          />
          {status?.deploymentOverrides.stripeSecret && (
            <p className="text-[10px] text-muted-foreground">Overridden by host environment.</p>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="orbit-stripe-clear-sec"
              checked={clearStripeSecret}
              onCheckedChange={(v) => setClearStripeSecret(!!v)}
              disabled={!!status?.deploymentOverrides.stripeSecret}
            />
            <Label
              htmlFor="orbit-stripe-clear-sec"
              className="text-xs font-normal text-muted-foreground"
            >
              Clear saved secret
            </Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Stripe publishable key</Label>
          <Input
            type="password"
            autoComplete="off"
            placeholder={status?.stored.stripePublishable ? "••••••••" : "pk_live_…"}
            value={stripePublishableKey}
            onChange={(e) => setStripePublishableKey(e.target.value)}
            disabled={clearStripePublishable || !!status?.deploymentOverrides.stripePublishable}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="orbit-stripe-clear-pub"
              checked={clearStripePublishable}
              onCheckedChange={(v) => setClearStripePublishable(!!v)}
              disabled={!!status?.deploymentOverrides.stripePublishable}
            />
            <Label
              htmlFor="orbit-stripe-clear-pub"
              className="text-xs font-normal text-muted-foreground"
            >
              Clear saved publishable key
            </Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Webhook signing secret</Label>
          <Input
            type="password"
            autoComplete="off"
            placeholder={status?.stored.stripeWebhook ? "••••••••" : "whsec_…"}
            value={stripeWebhookSecret}
            onChange={(e) => setStripeWebhookSecret(e.target.value)}
            disabled={clearStripeWebhook || !!status?.deploymentOverrides.stripeWebhook}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="orbit-stripe-clear-wh"
              checked={clearStripeWebhook}
              onCheckedChange={(v) => setClearStripeWebhook(!!v)}
              disabled={!!status?.deploymentOverrides.stripeWebhook}
            />
            <Label
              htmlFor="orbit-stripe-clear-wh"
              className="text-xs font-normal text-muted-foreground"
            >
              Clear saved webhook secret
            </Label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void submit()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Stripe keys"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
            Stripe keys <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings/stripe">Connection status</Link>
        </Button>
      </div>

      {saveMessage && (
        <p
          className={`text-xs ${saveMessage.startsWith("Saved") ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
        >
          {saveMessage}
        </p>
      )}
    </div>
  );
}
