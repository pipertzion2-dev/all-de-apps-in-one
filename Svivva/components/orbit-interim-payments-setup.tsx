"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wallet, ExternalLink } from "lucide-react";

type InterimStatus = {
  stored: {
    interimStripePaymentLinkPro: boolean;
    interimStripePaymentLinkEnterprise: boolean;
    interimPaypalUrl: boolean;
    interimVenmoUrl: boolean;
  };
  interim: {
    active: boolean;
  };
};

export function OrbitInterimPaymentsSetup() {
  const [status, setStatus] = useState<InterimStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [stripeLinkPro, setStripeLinkPro] = useState("");
  const [stripeLinkEnterprise, setStripeLinkEnterprise] = useState("");
  const [paypalUrl, setPaypalUrl] = useState("");
  const [venmoUrl, setVenmoUrl] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus((await res.json()) as InterimStatus);
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
      if (stripeLinkPro.trim()) body.interimStripePaymentLinkPro = stripeLinkPro.trim();
      if (stripeLinkEnterprise.trim())
        body.interimStripePaymentLinkEnterprise = stripeLinkEnterprise.trim();
      if (paypalUrl.trim()) body.interimPaypalUrl = paypalUrl.trim();
      if (venmoUrl.trim()) body.interimVenmoUrl = venmoUrl.trim();
      if (note.trim()) body.interimPaymentNote = note.trim();

      if (Object.keys(body).length === 0) {
        setMessage("Paste at least one payment link, then save.");
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

      setStripeLinkPro("");
      setStripeLinkEnterprise("");
      setPaypalUrl("");
      setVenmoUrl("");
      setNote("");
      setMessage("Saved — customers see these on Billing while Stripe verifies.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const active = status?.interim.active;

  return (
    <div
      className="rounded-2xl border-2 border-amber-500/35 bg-gradient-to-br from-amber-500/8 to-transparent p-4 space-y-4"
      data-testid="orbit-interim-payments-setup"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Wallet className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">Get paid while Stripe verifies</h3>
            {status && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30"
                }`}
              >
                {active ? "Live on Billing" : "Not set up"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Stripe account still verifying? Create a{" "}
            <a
              href="https://dashboard.stripe.com/payment-links"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              Payment Link
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            for ZZAI Pro ($49/mo) — it often works before full verification. Add PayPal or Venmo
            too. After payment, grant Pro via access code on Billing.
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Stripe Payment Link — Pro ($49)</Label>
          <Input
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder={
              status?.stored.interimStripePaymentLinkPro
                ? "https://buy.stripe.com/… (saved — paste to replace)"
                : "https://buy.stripe.com/…"
            }
            value={stripeLinkPro}
            onChange={(e) => setStripeLinkPro(e.target.value)}
            className="h-9 text-xs font-mono"
            data-testid="interim-stripe-pro-link"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Stripe Payment Link — Enterprise (optional)</Label>
          <Input
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://buy.stripe.com/…"
            value={stripeLinkEnterprise}
            onChange={(e) => setStripeLinkEnterprise(e.target.value)}
            className="h-9 text-xs font-mono"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">PayPal link</Label>
            <Input
              type="url"
              inputMode="url"
              placeholder={
                status?.stored.interimPaypalUrl
                  ? "https://paypal.me/… (saved)"
                  : "https://paypal.me/yourname"
              }
              value={paypalUrl}
              onChange={(e) => setPaypalUrl(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Venmo link (optional)</Label>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://venmo.com/…"
              value={venmoUrl}
              onChange={(e) => setVenmoUrl(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Note shown to customers (optional)</Label>
          <Textarea
            rows={2}
            placeholder="After you pay, email receipt to hello@zzaizzai.com …"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          data-testid="interim-payments-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save payment links"}
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
