"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { EASYPEASY_BASE_URL } from "@/lib/easypeasy/constants";
import {
  EASYPEASY_SUBSCRIPTION_PLANS,
  EASYPEASY_TIERS,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";

type TierMeta = {
  id: EasyPeasyTierId;
  name: string;
  model: string;
  tagline: string;
  minEasyPeasyPlan: string;
  orbitUse: string;
};

type EasyPeasyStatus = {
  stored: {
    easypeasyApiKey: boolean;
    easypeasyBaseUrl: boolean;
    easypeasyTier: boolean;
  };
  easypeasy: {
    active: boolean;
    model: string;
    tierId: EasyPeasyTierId;
    baseUrl: string;
    tiers?: TierMeta[];
  };
};

export function OrbitEasyPeasySetup() {
  const [status, setStatus] = useState<EasyPeasyStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [tierId, setTierId] = useState<EasyPeasyTierId>("standard");

  const tiers = status?.easypeasy.tiers ?? EASYPEASY_TIERS;
  const selectedTier = tiers.find((t) => t.id === tierId) ?? tiers[0];

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      const payload = (await res.json()) as EasyPeasyStatus;
      setStatus(payload);
      if (payload.easypeasy?.tierId) setTierId(payload.easypeasy.tierId);
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
      const body: Record<string, string> = { easypeasyTier: tierId };
      if (apiKey.trim()) {
        body.openaiApiKey = apiKey.trim();
        body.openaiBaseUrl = EASYPEASY_BASE_URL;
      } else if (!status?.stored.easypeasyApiKey && !status?.easypeasy.active) {
        setMessage("Paste your EasyPeasy API key, pick a tier, then save.");
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
      setMessage(
        `Saved — Orbit marketing AI uses EasyPeasy ${selectedTier?.name ?? tierId} (${selectedTier?.model ?? "model"}).`,
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setMessage(null);
    setTesting(true);
    try {
      const res = await fetch("/api/easypeasy/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          model: selectedTier?.model,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        throw new Error(j.error || res.statusText);
      }
      setMessage(`Test OK — ${j.model} replied: “${j.reply}”`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  };

  const active = status?.easypeasy.active;

  return (
    <div
      className="rounded-2xl border-2 border-fuchsia-500/35 bg-gradient-to-br from-fuchsia-500/8 to-transparent p-4 space-y-4"
      data-testid="orbit-easypeasy-setup"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10">
          <Sparkles className="h-5 w-5 text-fuchsia-700 dark:text-fuchsia-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">EasyPeasy.AI (Orbit marketing LLM)</h3>
            {status && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-500/30"
                }`}
              >
                {active ? `${status.easypeasy.tierId} · ${status.easypeasy.model}` : "Not set up"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pick a quality tier for Orbit autopilot, then paste your API key from{" "}
            <a
              href="https://easy-peasy.ai/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              EasyPeasy settings
              <ExternalLink className="h-3 w-3" />
            </a>
            . API access requires the Unlimited plan ($16.50/mo yearly).
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Orbit AI tier</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {tiers.map((tier) => {
            const selected = tierId === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setTierId(tier.id)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  selected
                    ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-sm"
                    : "border-border bg-card/50 hover:border-fuchsia-500/40"
                }`}
                data-testid={`easypeasy-tier-${tier.id}`}
              >
                <p className="text-xs font-bold text-foreground">{tier.name}</p>
                <p className="text-[10px] font-mono text-fuchsia-700 dark:text-fuchsia-300 mt-0.5">
                  {tier.model}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  {tier.tagline}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1.5 leading-snug">
                  <span className="font-semibold text-foreground">Orbit:</span> {tier.orbitUse}
                </p>
                <p className="text-[9px] text-amber-700 dark:text-amber-300 mt-1 leading-snug">
                  {tier.minEasyPeasyPlan}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] space-y-2">
        <p className="font-semibold text-foreground">EasyPeasy subscription plans</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {EASYPEASY_SUBSCRIPTION_PLANS.map((plan) => (
            <a
              key={plan.id}
              href={plan.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border/50 bg-card/40 px-2 py-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold">{plan.name}</span>
                <span className="text-[9px] text-muted-foreground">{plan.price}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">
                {plan.highlight}
              </p>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">API key</Label>
        <Input
          type="password"
          autoComplete="off"
          placeholder={
            status?.stored.easypeasyApiKey ? "Saved — paste to replace" : "Your EasyPeasy API key"
          }
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="h-9 text-xs font-mono"
          data-testid="easypeasy-api-key"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          data-testid="easypeasy-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save tier & key"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void test()}
          disabled={testing || (!apiKey.trim() && !status?.stored.easypeasyApiKey)}
          data-testid="easypeasy-test"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Test ${selectedTier?.model}`}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a
            href="https://docs.easy-peasy.ai/api-reference/endpoint/chat-completions"
            target="_blank"
            rel="noopener noreferrer"
          >
            API docs
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
