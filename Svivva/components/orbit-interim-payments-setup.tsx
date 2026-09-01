"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink } from "lucide-react";

type CashAppPlansStatus = {
  stored: {
    interimCashAppUrlStarter: boolean;
    interimCashAppUrlPro: boolean;
  };
  interim: {
    active: boolean;
    cashAppTag?: string;
  };
};

/** Orbit admin — Cash App plan links ($20 Starter / $50 Pro). */
export function OrbitInterimPaymentsSetup() {
  const [status, setStatus] = useState<CashAppPlansStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [cashAppStarter, setCashAppStarter] = useState("");
  const [cashAppPro, setCashAppPro] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setStatus((await res.json()) as CashAppPlansStatus);
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
      if (cashAppStarter.trim()) body.interimCashAppUrlStarter = cashAppStarter.trim();
      if (cashAppPro.trim()) body.interimCashAppUrlPro = cashAppPro.trim();
      if (note.trim()) body.interimPaymentNote = note.trim();

      if (Object.keys(body).length === 0) {
        setMessage("Paste at least one Cash App plan link, then save.");
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

      setCashAppStarter("");
      setCashAppPro("");
      setNote("");
      setMessage("Saved — Billing and urrthang use these Cash App plans.");
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
      className="rounded-2xl border-2 border-[#00D632]/40 bg-gradient-to-br from-[#00D632]/10 to-transparent p-4 space-y-4"
      data-testid="orbit-cashapp-plans-setup"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00D632]/40 bg-[#00D632]/15 text-lg font-black">
          $
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">Cash App plans</h3>
            {status && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30"
                }`}
              >
                {active ? "Live on Billing" : "Using defaults"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Default: <strong className="text-foreground">$pipertzion</strong> — Starter $20/mo, Pro
            $50/mo. Override links below if needed.{" "}
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
            <Label className="text-xs">Starter plan — $20/mo</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder={
                status?.stored.interimCashAppUrlStarter
                  ? "https://cash.app/$pipertzion/20 (saved)"
                  : "https://cash.app/$pipertzion/20"
              }
              value={cashAppStarter}
              onChange={(e) => setCashAppStarter(e.target.value)}
              className="h-9 text-xs font-mono"
              data-testid="cashapp-plan-starter"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pro plan — $50/mo</Label>
            <Input
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder={
                status?.stored.interimCashAppUrlPro
                  ? "https://cash.app/$pipertzion/50 (saved)"
                  : "https://cash.app/$pipertzion/50"
              }
              value={cashAppPro}
              onChange={(e) => setCashAppPro(e.target.value)}
              className="h-9 text-xs font-mono"
              data-testid="cashapp-plan-pro"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Note shown on Billing (optional)</Label>
          <Textarea
            rows={2}
            placeholder="After you pay on Cash App, enter your access code…"
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
          className="bg-[#00D632] hover:bg-[#00bd2d] text-black font-bold"
          data-testid="cashapp-plans-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Cash App plans"}
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
