"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { EASYPEASY_BASE_URL, EASYPEASY_DEFAULT_MODEL } from "@/lib/easypeasy/config";

type EasyPeasyStatus = {
  stored: {
    easypeasyApiKey: boolean;
    easypeasyBaseUrl: boolean;
  };
  easypeasy: {
    active: boolean;
    model: string;
    baseUrl: string;
  };
  effective: {
    openai: boolean;
    openaiBaseUrl: boolean;
  };
};

export function OrbitEasyPeasySetup() {
  const [status, setStatus] = useState<EasyPeasyStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(EASYPEASY_DEFAULT_MODEL);

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
      if (payload.easypeasy?.model) setModel(payload.easypeasy.model);
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
      if (!apiKey.trim()) {
        setMessage("Paste your EasyPeasy API key, then save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/platform-secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: apiKey.trim(),
          openaiBaseUrl: EASYPEASY_BASE_URL,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);

      setApiKey("");
      setMessage(
        "Saved — Orbit marketing AI now routes through EasyPeasy. Set EASYPEASY_MODEL or ORBIT_AI_MODEL in Vercel to change the model.",
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
          ...(model.trim() ? { model: model.trim() } : {}),
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
                {active ? "Connected" : "Not set up"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            OpenAI-compatible gateway for Orbit SEO copy, launch packs, and autopilot. Get an API key
            at{" "}
            <a
              href="https://easy-peasy.ai/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground inline-flex items-center gap-0.5"
            >
              EasyPeasy settings
              <ExternalLink className="h-3 w-3" />
            </a>
            . Orbit stores it as Platform Secrets and uses base URL{" "}
            <code className="text-[10px]">{EASYPEASY_BASE_URL}</code>.
          </p>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-1.5">
          {loadError}
        </p>
      )}

      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] space-y-1">
        <p className="font-semibold text-foreground">Vercel env (optional — overrides DB)</p>
        <p className="text-muted-foreground">
          <code className="text-[10px]">EASYPEASY_API_KEY</code> ·{" "}
          <code className="text-[10px]">EASYPEASY_MODEL</code> (default{" "}
          {EASYPEASY_DEFAULT_MODEL})
        </p>
      </div>

      <div className="space-y-3">
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
        <div className="space-y-1.5">
          <Label className="text-xs">Model (env override recommended)</Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={EASYPEASY_DEFAULT_MODEL}
            className="h-9 text-xs font-mono"
            data-testid="easypeasy-model"
          />
          <p className="text-[10px] text-muted-foreground">
            Used for the Test button. Production uses{" "}
            <code className="text-[10px]">EASYPEASY_MODEL</code> or{" "}
            <code className="text-[10px]">ORBIT_AI_MODEL</code> in Vercel when set.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          data-testid="easypeasy-save"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save EasyPeasy"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void test()}
          disabled={testing || (!apiKey.trim() && !status?.stored.easypeasyApiKey)}
          data-testid="easypeasy-test"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test connection"}
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
