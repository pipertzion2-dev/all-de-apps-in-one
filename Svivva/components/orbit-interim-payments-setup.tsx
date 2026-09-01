"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wallet, ExternalLink } from "lucide-react";

type InterimStatus = {
  stored: {
    interimVenmoUrlStarter: boolean;
    interimVenmoUrlPro: boolean;
    interimVenmoUrl: boolean;
    interimCashAppUrlStarter: boolean;
    interimCashAppUrlPro: boolean;
    interimZelleContact: boolean;
  };
  interim: {
    active: boolean;
    directPayActive: boolean;
    venmoUrlStarter: boolean;
    venmoUrlPro: boolean;
    venmoUrl: boolean;
  };
  stripeReady: {
    checkoutReady: boolean;
    configured: boolean;
    detail: string;
  };
};

export function OrbitInterimPaymentsSetup() {
  const [status, setStatus] = useState<InterimStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [venmoStarter, setVenmoStarter] = useState("");
  const [venmoPro, setVenmoPro] = useState("");
  const [cashAppStarter, setCashAppStarter] = useState("");
  const [cashAppPro, setCashAppPro] = useState("");
  const [zelleContact, setZelleContact] = useState("");
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
      if (venmoStarter.trim()) body.interimVenmoUrlStarter = venmoStarter.trim();
      if (venmoPro.trim()) body.interimVenmoUrlPro = venmoPro.trim();
      if (cashAppStarter.trim()) body.interimCashAppUrlStarter = cashAppStarter.trim();
      if (cashAppPro.trim()) body.interimCashAppUrlPro = cashAppPro.trim();
      if (zelleContact.trim()) body.interimZelleContact = zelleContact.trim();
      if (note.trim()) body.interimPaymentNote = note.trim();

      if (Object.keys(body).length === 0) {
        setMessage("Paste at least one Venmo/Cash App link or Zelle contact, then save.");
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

      setVenmoStarter("");
      setVenmoPro("");
      setCashAppStarter("");
      setCashAppPro("");
      setZelleContact("");
      setNote("");
      setMessage("Saved — Billing page shows these while Stripe verifies.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const active = status?.interim.directPayActive ?? status?.interim.active;
  const stripePending = status?.stripeReady?.configured && !status?.stripeReady?.checkoutReady;

  return (
    <div
      className="rounded-2xl border-2 border-emerald-500/35 bg-gradient-to-br from-emerald-500/8 to-transparent p-4 space-y-4"
      data-testid="orbit-interim-payments-setup"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <Wallet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">Direct Pay — while Stripe verifies</h3>
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
            {stripePending
              ? "Your Stripe account isn't fully verified yet — customers can pay via Venmo or Cash App and redeem an access code."
              : "No card processor needed. Add Venmo or Cash App payment links for Starter ($20) and Pro ($50). After payment, send customers an access code."}{" "}
            <a
              href="https://venmo.com/account/sign-in"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              Venmo
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            ·{" "}
            <a
              href="https://cash.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              Cash App
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Venmo — Starter ($20/mo)</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder={
                status?.stored.interimVenmoUrlStarter || status?.stored.interimVenmoUrl
                  ? "https://venmo.com/… (saved — paste to replace)"
                  : "https://venmo.com/u/yourname"
              }
              value={venmoStarter}
              onChange={(e) => setVenmoStarter(e.target.value)}
              className="h-9 text-xs font-mono"
              data-testid="interim-venmo-starter"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Venmo — Pro ($50/mo)</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder={
                status?.stored.interimVenmoUrlPro
                  ? "https://venmo.com/… (saved)"
                  : "https://venmo.com/u/yourname"
              }
              value={venmoPro}
              onChange={(e) => setVenmoPro(e.target.value)}
              className="h-9 text-xs font-mono"
              data-testid="interim-venmo-pro"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cash App — Starter ($20/mo) optional</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder="https://cash.app/$yourtag/20"
              value={cashAppStarter}
              onChange={(e) => setCashAppStarter(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cash App — Pro ($50/mo) optional</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder="https://cash.app/$yourtag/50"
              value={cashAppPro}
              onChange={(e) => setCashAppPro(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Zelle email or phone (shown on Billing)</Label>
          <Input
            type="text"
            autoComplete="off"
            placeholder={
              status?.stored.interimZelleContact
                ? "Saved — paste to replace"
                : "you@email.com or +1 555…"
            }
            value={zelleContact}
            onChange={(e) => setZelleContact(e.target.value)}
            className="h-9 text-xs"
          />
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="interim-payments-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save direct pay links"}
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
