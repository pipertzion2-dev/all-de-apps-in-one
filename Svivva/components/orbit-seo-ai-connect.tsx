"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Search,
  Sparkles,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCodeForm } from "@/components/admin-code-form";
import { GscOAuthClientSavePanel } from "@/components/gsc-oauth-client-save-panel";
import {
  ORBIT_SEO_CONNECT_PATH,
  ORBIT_SEO_CONNECT_STEPS,
  orbitSeoConnectUrl,
} from "@/lib/orbit/seo-connect";

type SecretStatus = {
  stored: {
    openai?: boolean;
    openaiBaseUrl?: boolean;
    gemini?: boolean;
  };
  effective: {
    openai?: boolean;
    openaiBaseUrl?: boolean;
    gemini?: boolean;
  };
};

type EnsureAiResult = {
  ok?: boolean;
  provider?: string;
  providerLabel?: string;
  model?: string;
  marketingModel?: string;
  templateMode?: boolean;
  tested?: boolean;
  testReply?: string;
  warning?: string;
  error?: string;
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
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

/**
 * Admin desk: wire a real SaaS AI model + Search Console for Orbit SEO.
 * Shareable at /dashboard/orbit/connect
 */
export function OrbitSeoAiConnect() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [secrets, setSecrets] = useState<SecretStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<EnsureAiResult | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return ORBIT_SEO_CONNECT_PATH;
    return orbitSeoConnectUrl(window.location.origin);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      setIsAdmin(!!j.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const loadSecrets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/platform-secrets", { credentials: "include" });
      if (!res.ok) return;
      setSecrets(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const testAi = useCallback(async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/orbit/ensure-ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testConnection: true }),
      });
      const j = (await res.json().catch(() => ({}))) as EnsureAiResult;
      if (!res.ok) throw new Error(j.error || res.statusText);
      setAiStatus(j);
      if (j.templateMode) {
        setMessage(
          j.warning ||
            "Still on built-in templates — paste an OpenAI or Gemini key below and test again.",
        );
      } else {
        setMessage(
          `Live AI ready: ${j.providerLabel || j.provider} · ${j.marketingModel || j.model}`,
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadSecrets();
    void testAi();
  }, [isAdmin, loadSecrets, testAi]);

  const saveKeys = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, string> = {};
      if (openaiKey.trim()) {
        body.openaiApiKey = openaiKey.trim();
        // Clear EasyPeasy gateway base so we use direct OpenAI like other SaaS apps
        body.openaiBaseUrl = "";
      }
      if (geminiKey.trim()) body.geminiApiKey = geminiKey.trim();
      if (Object.keys(body).length === 0) {
        setMessage("Paste an OpenAI sk-… key and/or a Gemini key, then save.");
        return;
      }

      const res = await fetch("/api/admin/platform-secrets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);

      setOpenaiKey("");
      setGeminiKey("");
      setMessage("Keys saved. Testing live model…");
      await loadSecrets();
      await testAi();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage(`Copy this link: ${shareUrl}`);
    }
  };

  const liveAi = !!aiStatus && aiStatus.ok && !aiStatus.templateMode;
  const hasOpenai = !!(secrets?.effective.openai || secrets?.stored.openai);
  const hasGemini = !!(secrets?.effective.gemini || secrets?.stored.gemini);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking admin access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orbit SEO · admin unlock</CardTitle>
            <CardDescription>
              Enter the admin passcode to wire AI models and Search Console for this site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminCodeForm
              onSuccess={() => {
                void refreshMe();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B8DA8]">
            Orbit · SEO operator desk
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Connect AI + Search</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Same stack other SaaS products use: a live LLM for content, plus Google Search Console
            for indexing. Share this link with your SEO/dev person.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={copyLink}
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy admin link"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill
          ok={liveAi}
          label={liveAi ? `AI · ${aiStatus?.providerLabel || "live"}` : "AI · templates"}
        />
        <StatusPill ok={hasOpenai} label={hasOpenai ? "OpenAI key" : "No OpenAI key"} />
        <StatusPill ok={hasGemini} label={hasGemini ? "Gemini key" : "No Gemini key"} />
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {ORBIT_SEO_CONNECT_STEPS.map((step, i) => (
          <li key={step.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Step {i + 1}
            </p>
            <p className="mt-1 text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[#5B8DA8]" />1 · Live AI model
          </CardTitle>
          <CardDescription>
            Prefer a direct OpenAI <code className="text-[10px]">sk-…</code> key (SaaS default).
            Free Gemini works as a fallback. Keys are stored in platform secrets and hydrated on the
            server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="orbit-openai-key">OpenAI API key</Label>
              <Input
                id="orbit-openai-key"
                type="password"
                autoComplete="off"
                placeholder={hasOpenai ? "•••• saved — paste to replace" : "sk-…"}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                data-testid="input-orbit-connect-openai"
              />
              <p className="text-[10px] text-muted-foreground">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#5B8DA8] underline"
                >
                  platform.openai.com/api-keys <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orbit-gemini-key">Gemini API key (optional)</Label>
              <Input
                id="orbit-gemini-key"
                type="password"
                autoComplete="off"
                placeholder={hasGemini ? "•••• saved — paste to replace" : "AIza…"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                data-testid="input-orbit-connect-gemini"
              />
              <p className="text-[10px] text-muted-foreground">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#5B8DA8] underline"
                >
                  aistudio.google.com/apikey <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-1.5 bg-[#5B8DA8]"
              disabled={saving}
              onClick={() => void saveKeys()}
              data-testid="button-orbit-connect-save-ai"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Save keys
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              disabled={testing}
              onClick={() => void testAi()}
              data-testid="button-orbit-connect-test-ai"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Test live model
            </Button>
            <Link href="/dashboard/settings/runtime-keys">
              <Button type="button" variant="ghost" size="sm" className="gap-1">
                All runtime keys
              </Button>
            </Link>
          </div>

          {aiStatus && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                liveAi
                  ? "border-green-500/30 bg-green-500/5 text-green-800 dark:text-green-200"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100"
              }`}
              data-testid="orbit-connect-ai-status"
            >
              <p className="font-semibold">
                {liveAi ? "Using live AI" : "Using templates (no live model yet)"}
              </p>
              <p className="mt-0.5 opacity-90">
                Provider: {aiStatus.providerLabel || aiStatus.provider || "—"} · Model:{" "}
                {aiStatus.marketingModel || aiStatus.model || "—"}
                {aiStatus.testReply ? ` · Probe: “${aiStatus.testReply}”` : null}
              </p>
            </div>
          )}
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-[#5B8DA8]" />2 · Google Search Console
          </CardTitle>
          <CardDescription>
            Save OAuth client credentials, then connect Google so Orbit can request indexing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GscOAuthClientSavePanel connectReturnTo={ORBIT_SEO_CONNECT_PATH} />
          <Link href="/dashboard/gsc-connect">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              data-testid="link-orbit-connect-gsc"
            >
              Open full GSC connect
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3 · Run Orbit</CardTitle>
          <CardDescription>
            Once AI is live and GSC is connected, launch SEO pages + indexing from the Orbit desk.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/orbit?tab=seo">
            <Button
              type="button"
              className="gap-1.5 bg-[#5B8DA8]"
              data-testid="link-orbit-connect-run"
            >
              Open Orbit SEO
            </Button>
          </Link>
          <Link href="/dashboard/orbit?tab=autopilot">
            <Button type="button" variant="outline">
              Marketing autopilot
            </Button>
          </Link>
          <Link href="/dashboard/burns">
            <Button type="button" variant="ghost" size="sm">
              Burns scheduler
            </Button>
          </Link>
        </CardContent>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground">
        Admin link: <code className="rounded bg-muted px-1 py-0.5">{shareUrl}</code>
      </p>
    </div>
  );
}
