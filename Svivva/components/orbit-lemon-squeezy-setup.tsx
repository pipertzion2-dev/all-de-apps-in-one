"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, Citrus } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url-public";

type LemonStatus = {
  stored: {
    lemonSqueezyApiKey: boolean;
    lemonSqueezyStoreId: boolean;
    lemonSqueezyVariantIdPro: boolean;
    lemonSqueezyVariantIdEnterprise: boolean;
    lemonSqueezyWebhookSecret: boolean;
    lemonSqueezyCheckoutUrlPro: boolean;
    lemonSqueezyCheckoutUrlEnterprise: boolean;
  };
  lemonSqueezy: {
    active: boolean;
    pro: boolean;
    enterprise: boolean;
  };
};

export function OrbitLemonSqueezySetup() {
  const [status, setStatus] = useState<LemonStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [storeId, setStoreId] = useState("");
  const [variantIdPro, setVariantIdPro] = useState("");
  const [variantIdEnterprise, setVariantIdEnterprise] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [checkoutUrlPro, setCheckoutUrlPro] = useState("");
  const [checkoutUrlEnterprise, setCheckoutUrlEnterprise] = useState("");

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/lemonsqueezy/webhook`
      : `${getSiteUrl()}/api/lemonsqueezy/webhook`;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus((await res.json()) as LemonStatus);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (apiKey.trim()) body.lemonSqueezyApiKey = apiKey.trim();
      if (storeId.trim()) body.lemonSqueezyStoreId = storeId.trim();
      if (variantIdPro.trim()) body.lemonSqueezyVariantIdPro = variantIdPro.trim();
      if (variantIdEnterprise.trim())
        body.lemonSqueezyVariantIdEnterprise = variantIdEnterprise.trim();
      if (webhookSecret.trim()) body.lemonSqueezyWebhookSecret = webhookSecret.trim();
      if (checkoutUrlPro.trim()) body.lemonSqueezyCheckoutUrlPro = checkoutUrlPro.trim();
      if (checkoutUrlEnterprise.trim())
        body.lemonSqueezyCheckoutUrlEnterprise = checkoutUrlEnterprise.trim();

      if (Object.keys(body).length === 0) {
        setMessage("Paste at least one field (checkout URL or API + store + variant), then save.");
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

      setApiKey("");
      setStoreId("");
      setVariantIdPro("");
      setVariantIdEnterprise("");
      setWebhookSecret("");
      setCheckoutUrlPro("");
      setCheckoutUrlEnterprise("");
      setMessage("Saved — Lemon Squeezy checkout is live on Billing when Stripe is not verified.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const active = status?.lemonSqueezy.active;

  return (
    <div
      className="rounded-2xl border-2 border-lime-500/35 bg-gradient-to-br from-lime-500/8 to-transparent p-4 space-y-4"
      data-testid="orbit-lemon-squeezy-setup"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-500/30 bg-lime-500/10">
          <Citrus className="h-5 w-5 text-lime-700 dark:text-lime-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">Lemon Squeezy subscriptions</h3>
            {status && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-lime-500/10 text-lime-800 dark:text-lime-200 border-lime-500/30"
                }`}
              >
                {active ? "Live on Billing" : "Not set up"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use Lemon Squeezy while Stripe verifies — merchant-of-record handles tax/VAT and
            subscriptions auto-activate via webhook. Create a store + $49/mo Pro product at{" "}
            <a
              href="https://app.lemonsqueezy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              Lemon Squeezy
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] space-y-1">
        <p className="font-semibold text-foreground">Webhook URL (paste in Lemon Squeezy → Settings → Webhooks)</p>
        <code className="block break-all text-[10px]">{webhookUrl}</code>
        <p className="text-muted-foreground">
          Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Quick setup — Pro checkout URL (easiest)</Label>
          <Input
            type="url"
            placeholder={
              status?.stored.lemonSqueezyCheckoutUrlPro
                ? "https://yourstore.lemonsqueezy.com/checkout/… (saved)"
                : "https://yourstore.lemonsqueezy.com/checkout/buy/…"
            }
            value={checkoutUrlPro}
            onChange={(e) => setCheckoutUrlPro(e.target.value)}
            className="h-9 text-xs font-mono"
            data-testid="lemon-checkout-url-pro"
          />
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-foreground">API setup (auto checkout URLs)</summary>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">API key</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={status?.stored.lemonSqueezyApiKey ? "Saved — paste to replace" : "eyJ…"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Store ID</Label>
                <Input
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  placeholder={status?.stored.lemonSqueezyStoreId ? "Saved" : "12345"}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pro variant ID ($49/mo)</Label>
                <Input
                  value={variantIdPro}
                  onChange={(e) => setVariantIdPro(e.target.value)}
                  placeholder={status?.stored.lemonSqueezyVariantIdPro ? "Saved" : "67890"}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Webhook signing secret</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={status?.stored.lemonSqueezyWebhookSecret ? "Saved" : "whsec_…"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="bg-lime-600 hover:bg-lime-700 text-white"
          data-testid="lemon-squeezy-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Lemon Squeezy"}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href="/dashboard/billing" target="_blank" rel="noopener noreferrer">
            Preview Billing
          </a>
        </Button>
      </div>

      {message && (
        <p className="text-xs text-muted-foreground border border-border rounded-lg px-2 py-1.5">
          {message}
        </p>
      )}
    </div>
  );
}
