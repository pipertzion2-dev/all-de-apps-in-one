"use client";

/**
 * Orbit Mission Control
 * ─────────────────────
 * Single-screen admin UI for the entire marketing funnel:
 *   1. One-click run (fires full backend engine)
 *   2. "Done for you" — everything Orbit handled automatically
 *   3. "Needs you" — inline action cards (copy text + open link + add key → auto forever)
 *   4. Credential quick-save for the 4 platforms that become fully automatic with a key
 *
 * No tabs, no step lists, no chunked phases.
 */

import { useEffect, useRef, useState } from "react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";

const GscConnectOrb = nextDynamic(() => import("@/components/gsc-connect-orb"), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto rounded-full bg-muted/30 animate-pulse"
      style={{ width: 150, height: 150 }}
    />
  ),
});
import {
  Rocket,
  Loader2,
  CheckCircle2,
  Sparkles,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  KeyRound,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Activity,
  CreditCard,
  Search,
  ExternalLink,
} from "lucide-react";
import { stepsForTask } from "@/lib/orbit/orbit-setup-providers";
import { isAutomatedSuccess, partitionAutopilotTasks } from "@/lib/orbit/marketing-task-buckets";
import type { MarketingIndexingSummary } from "@/lib/orbit/marketing-autopilot-types";
import { OrbitPaidServicesHub } from "@/components/orbit-paid-services-hub";
import { OrbitAgentModeCard } from "@/components/orbit-agent-mode-card";
import { OrbitSubscribeQuickStrip } from "@/components/orbit-subscribe-quick-strip";
import { GscOAuthClientSavePanel } from "@/components/gsc-oauth-client-save-panel";
import { gscOAuthConnectUrl } from "@/lib/gsc-oauth-connect-url";
import {
  PINK_CAMO_BUTTON_ACTIVE_STYLE,
  PINK_CAMO_BUTTON_CLASS,
  PINK_CAMO_BUTTON_STYLE,
  URRTHANG_LABEL,
} from "@/lib/ui-pink-camo-button";
import { dedupeErrorMessages, formatOrbitRunError } from "@/lib/orbit/orbit-error-messages";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus =
  | "posted"
  | "done"
  | "prepared"
  | "failed"
  | "needs_credentials"
  | "skipped"
  | "running";

type Task = {
  id: string;
  label: string;
  group: string;
  status: TaskStatus;
  message: string;
  copyText?: string;
  url?: string;
  at?: string;
};

type RunResult = {
  ok: boolean;
  finishedAt?: string;
  tasks: Task[];
  summary: string;
  indexing?: MarketingIndexingSummary;
  stats: {
    posted: number;
    prepared: number;
    done: number;
    failed: number;
    needsCredentials: number;
  };
};

type StatusData = {
  seoPages?: number;
  blogPosts?: number;
  seedMarketing?: number;
  aeoPages?: number;
  comparisons?: number;
  indexNowSubmitted?: boolean;
};

// ─── "Needs you" action card metadata ────────────────────────────────────────

type ActionMeta = {
  id: string;
  icon: string;
  openUrl?: string;
  credKey?: string;
  credLabel?: string;
  credHint?: string;
  copyLabel?: string;
};

const ACTION_META: ActionMeta[] = [
  {
    id: "auto-n8n-webhook",
    icon: "🔗",
    openUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    credKey: "n8nWebhookUrl",
    credLabel: "n8n webhook URL",
    credHint: "n8n → Webhook node → Production URL (recommended funnel automation)",
  },
  {
    id: "manual-devto",
    icon: "📝",
    openUrl: "https://dev.to/new",
    credKey: "devtoApiKey",
    credLabel: "Dev.to API key",
    credHint: "dev.to/settings/extensions → Generate API Key",
    copyLabel: "Copy article",
  },
  {
    id: "manual-hashnode",
    icon: "⚡",
    openUrl: "https://hashnode.com",
    credKey: "hashnodeApiKey",
    credLabel: "Hashnode API key",
    credHint: "hashnode.com/settings/developer",
    copyLabel: "Copy article",
  },
  {
    id: "manual-medium",
    icon: "📖",
    openUrl: "https://medium.com/new-story",
    copyLabel: "Copy article",
  },
  {
    id: "manual-reddit-sideproject",
    icon: "🔴",
    openUrl: "https://reddit.com/r/SideProject/submit",
    credKey: "redditClientId",
    credLabel: "Reddit client ID",
    credHint: "reddit.com/prefs/apps → create app",
    copyLabel: "Copy post",
  },
  {
    id: "manual-twitter-thread",
    icon: "𝕏",
    openUrl: "https://x.com/compose/tweet",
    credKey: "ayrshareApiKey",
    credLabel: "Ayrshare API key",
    credHint: "app.ayrshare.com → connect X → API key (best) — or OmniSocials / n8n",
    copyLabel: "Copy thread",
  },
  {
    id: "manual-linkedin",
    icon: "💼",
    openUrl: "https://www.linkedin.com/post/new",
    credKey: "ayrshareApiKey",
    credLabel: "Ayrshare API key",
    credHint: "app.ayrshare.com → connect LinkedIn → API key (best) — or OmniSocials / n8n",
    copyLabel: "Copy post",
  },
  {
    id: "manual-showhn",
    icon: "🔶",
    openUrl: "https://news.ycombinator.com/submit",
    copyLabel: "Copy HN post",
  },
  {
    id: "manual-producthunt",
    icon: "🐱",
    openUrl: "https://www.producthunt.com/posts/new",
    copyLabel: "Copy PH listing",
  },
  {
    id: "manual-newsletters",
    icon: "📧",
    credKey: "resendApiKey",
    credLabel: "Resend API key",
    credHint: "resend.com/api-keys",
    copyLabel: "Copy pitch email",
  },
  {
    id: "manual-podcasts",
    icon: "🎙️",
    copyLabel: "Copy pitch",
  },
  {
    id: "manual-indiehackers",
    icon: "🛠️",
    openUrl: "https://www.indiehackers.com/post",
    copyLabel: "Copy post",
  },
  {
    id: "dir-producthunt",
    icon: "🐱",
    openUrl: "https://www.producthunt.com/posts/new",
    copyLabel: "Copy listing",
  },
  {
    id: "dir-futurepedia",
    icon: "📁",
    openUrl: "https://www.futurepedia.io/submit-tool",
    copyLabel: "Copy listing",
  },
  {
    id: "dir-taaft",
    icon: "📁",
    openUrl: "https://theresanaiforthat.com/submit/",
    copyLabel: "Copy listing",
  },
  {
    id: "dir-g2",
    icon: "📁",
    openUrl: "https://sell.g2.com/list-your-product",
    copyLabel: "Copy listing",
  },
  {
    id: "dir-alternativeto",
    icon: "📁",
    openUrl: "https://alternativeto.net/manage/add-product/",
    copyLabel: "Copy listing",
  },
  {
    id: "dir-crunchbase",
    icon: "📁",
    openUrl: "https://www.crunchbase.com/add-company",
    copyLabel: "Copy listing",
  },
  {
    id: "tech-rich-results",
    icon: "🔍",
    openUrl: "https://search.google.com/test/rich-results",
    copyLabel: "Copy site URL",
  },
  {
    id: "manual-gsc-indexing",
    icon: "🔍",
    openUrl: "/dashboard/gsc-connect",
    copyLabel: "Open GSC setup",
  },
];

function metaFor(id: string): ActionMeta {
  return ACTION_META.find((a) => a.id === id) ?? { id, icon: "🔗" };
}

// ─── Running phases ───────────────────────────────────────────────────────────

const PHASES = [
  { label: "Loading content engine (AI or built-in templates — no key required)" },
  { label: "Building SEO pages, blog, comparisons & tool pages" },
  { label: "Submitting URLs to Google (GSC + Indexing API), Bing & IndexNow" },
  { label: "Generating launch copy & auto-posting where APIs allow" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onComplete?: () => void;
  /** Live DB status for the live-count bar */
  orbitStatus?: StatusData | null;
  /** When true, scroll into view and run autopilot once on mount (e.g. ?autorun=1). */
  autoRun?: boolean;
  /** Open Orbit Stripe setup (keys form). */
  onOpenStripeSetup?: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OrbitOneClickLaunch({
  onComplete,
  orbitStatus,
  autoRun,
  onOpenStripeSetup,
}: Props) {
  const { data: meData } = useQuery<{ isAdmin?: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });

  const canRunUrrthang = Boolean(meData?.isAdmin);

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credInputs, setCredInputs] = useState<Record<string, string>>({});
  const [savingCred, setSavingCred] = useState<string | null>(null);
  const [savedCreds, setSavedCreds] = useState<string[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [templateMode, setTemplateMode] = useState(true);
  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(
    "Built-in templates (no API key)",
  );
  const [marketingModel, setMarketingModel] = useState<string | null>(null);
  const [easypeasyTier, setEasypeasyTier] = useState<string | null>(null);
  const [easypeasyLive, setEasypeasyLive] = useState<{
    loading: boolean;
    active: boolean;
    tierId: string | null;
    model: string | null;
    migratedFromPremium: boolean;
  }>({ loading: true, active: false, tierId: null, model: null, migratedFromPremium: false });
  const [copyOnlyMode, setCopyOnlyMode] = useState(true);
  const [configuredKeys, setConfiguredKeys] = useState<Record<string, boolean>>({});
  const [manualDoneIds, setManualDoneIds] = useState<Set<string>>(() => new Set());
  const [gsc, setGsc] = useState<{
    connected: boolean;
    available: boolean;
    email: string | null;
    propertyOk: boolean;
    matchedSite: string | null;
  }>({
    connected: false,
    available: false,
    email: null,
    propertyOk: false,
    matchedSite: null,
  });

  type HealthSnapshot = {
    totalUrls: number;
    submitted: number;
    confirmed: number;
    stale: number;
    lastRunAt: string | null;
    lastScore: number | null;
  };
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  type QuickStartResult = {
    ok: boolean;
    summary: string;
    message?: string;
    indexing?: MarketingIndexingSummary;
    stripe?: {
      allOk: boolean;
      checks: { label: string; ok: boolean; action: string; liveVerified?: boolean }[];
    };
  };
  const [quickStartRunning, setQuickStartRunning] = useState(false);
  const [quickStartResult, setQuickStartResult] = useState<QuickStartResult | null>(null);
  const [quickStartError, setQuickStartError] = useState<string | null>(null);

  const refreshGscStatus = async () => {
    try {
      const r = await authFetch("/api/gsc/diagnose");
      if (r.ok) {
        const d = await r.json();
        setGsc({
          connected: !!d.oauthConnected,
          available: d.oauthAvailable === true,
          email: d.oauthEmail ?? null,
          propertyOk: !!d.gscPropertyOk,
          matchedSite: d.gscMatchedSite ?? null,
        });
      }
    } catch {
      /* best-effort */
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await authFetch("/api/gsc/diagnose");
        if (r.ok) {
          const d = await r.json();
          if (alive)
            setGsc({
              connected: !!d.oauthConnected,
              available: d.oauthAvailable === true,
              email: d.oauthEmail ?? null,
              propertyOk: !!d.gscPropertyOk,
              matchedSite: d.gscMatchedSite ?? null,
            });
        }
      } catch {
        /* best-effort */
      }
      try {
        const hr = await authFetch("/api/orbit/index-health");
        if (hr.ok) {
          const hd = await hr.json();
          if (alive && hd.snapshot) setHealth(hd.snapshot as HealthSnapshot);
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      const r = await authFetch("/api/orbit/index-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resubmit: true }),
      });
      if (r.ok) {
        const d = await r.json();
        const h = d.health;
        if (h) {
          setHealth((prev) => ({
            totalUrls: h.totalUrls ?? h.sampled ?? prev?.totalUrls ?? 0,
            submitted: prev?.submitted ?? 0,
            confirmed: h.indexable ?? prev?.confirmed ?? 0,
            stale: h.staleUrls ?? prev?.stale ?? 0,
            lastRunAt: new Date().toISOString(),
            lastScore: typeof h.score === "number" ? h.score : (prev?.lastScore ?? null),
          }));
        }
        // refresh the fast snapshot for accurate coverage numbers
        const hr = await authFetch("/api/orbit/index-health");
        if (hr.ok) {
          const hd = await hr.json();
          if (hd.snapshot) setHealth(hd.snapshot as HealthSnapshot);
        }
      }
    } catch {
      /* best-effort */
    } finally {
      setHealthChecking(false);
    }
  };
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoRunStarted = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const urrthangButtonRef = useRef<HTMLButtonElement>(null);
  const [urrthangPinned, setUrrthangPinned] = useState(false);

  // Load last run + setup state on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await authFetch("/api/orbit/marketing-autopilot");
        if (!r.ok || cancelled) return;
        const json = (await r.json()) as {
          lastRun?: RunResult | null;
          ai?: { configured?: boolean; providerLabel?: string; marketingModel?: string };
          easypeasy?: {
            active?: boolean;
            tierId?: string;
            model?: string;
            migratedFromPremium?: boolean;
          };
          copyOnlyMode?: boolean;
          status?: { configured?: Record<string, boolean> };
        };
        if (json.lastRun && !cancelled) setResult(json.lastRun);
        if (json.ai?.configured) {
          setAiConfigured(true);
          setTemplateMode(false);
        } else if (!cancelled) {
          setAiConfigured(true);
          setTemplateMode(true);
          setAiProviderLabel("Built-in templates (no API key)");
          setMarketingModel("template-v1");
        }
        if (json.ai?.providerLabel) setAiProviderLabel(json.ai.providerLabel);
        if (json.ai?.marketingModel) setMarketingModel(json.ai.marketingModel);
        if (typeof json.copyOnlyMode === "boolean") setCopyOnlyMode(json.copyOnlyMode);
        if (json.status?.configured) setConfiguredKeys(json.status.configured);
        if (json.easypeasy && !cancelled) {
          setEasypeasyLive({
            loading: false,
            active: !!json.easypeasy.active,
            tierId: json.easypeasy.tierId ?? null,
            model: json.easypeasy.model ?? null,
            migratedFromPremium: !!json.easypeasy.migratedFromPremium,
          });
          if (json.easypeasy.tierId) setEasypeasyTier(json.easypeasy.tierId);
          if (json.easypeasy.model) setMarketingModel(json.easypeasy.model);
          if (json.easypeasy.active) setAiConfigured(true);
        } else if (!cancelled) {
          setEasypeasyLive((prev) => ({
            ...prev,
            loading: false,
            active: true,
            model: "template-v1",
          }));
          setTemplateMode(true);
        }
      } catch {
        // non-blocking
      }
    })();
    try {
      const raw = localStorage.getItem("orbit-manual-done");
      if (raw) setManualDoneIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
      phaseTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const el = urrthangButtonRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setUrrthangPinned(!entry.isIntersecting),
      { root: null, threshold: 0.15, rootMargin: "-8px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function runQuickStart() {
    setQuickStartRunning(true);
    setQuickStartError(null);
    setQuickStartResult(null);
    try {
      const r = await authFetch("/api/orbit/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await r.json()) as QuickStartResult & { error?: string };
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setQuickStartResult(json);
      if (json.indexing) {
        await refreshGscStatus();
      }
      onComplete?.();
    } catch (e) {
      setQuickStartError(String(e instanceof Error ? e.message : e));
    } finally {
      setQuickStartRunning(false);
    }
  }

  function handleUrrthangClick() {
    if (!canRunUrrthang) return;
    void run();
  }

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    setPhase(0);
    setShowDone(false);
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = PHASES.map((_, i) => setTimeout(() => setPhase(i), i * 9_000));
    try {
      async function ensureOrbitAi() {
        const res = await authFetch("/api/orbit/ensure-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testConnection: true }),
        });
        return {
          res,
          json: (await res.json()) as {
            ok?: boolean;
            error?: string;
            provider?: string;
            providerLabel?: string;
            marketingModel?: string;
            model?: string;
            usedFallback?: boolean;
            alternatives?: { name: string; why: string; setupHref: string }[];
          },
        };
      }

      let { json: ensureJson } = await ensureOrbitAi();
      setAiConfigured(true);
      setTemplateMode(!!ensureJson.templateMode);
      if (ensureJson.providerLabel) setAiProviderLabel(ensureJson.providerLabel);
      if (ensureJson.marketingModel || ensureJson.model) {
        setMarketingModel(ensureJson.marketingModel ?? ensureJson.model ?? null);
      }
      if (ensureJson.provider === "easypeasy") setEasypeasyTier("standard");
      setEasypeasyLive((prev) => ({
        loading: false,
        active: true,
        tierId: ensureJson.provider === "easypeasy" ? "standard" : null,
        model: ensureJson.model ?? ensureJson.marketingModel ?? "template-v1",
        migratedFromPremium: prev.migratedFromPremium,
      }));

      const r = await authFetch("/api/orbit/marketing-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setResult(json as RunResult);
      if (
        (json as { ai?: { providerLabel?: string; marketingModel?: string } }).ai?.providerLabel
      ) {
        setAiProviderLabel((json as { ai: { providerLabel: string } }).ai.providerLabel);
      }
      if ((json as { ai?: { marketingModel?: string } }).ai?.marketingModel) {
        setMarketingModel((json as { ai: { marketingModel: string } }).ai.marketingModel);
      }
      if (
        (json as { easypeasy?: { tierId?: string; model?: string; active?: boolean } }).easypeasy
      ) {
        const ep = (json as { easypeasy: { tierId?: string; model?: string; active?: boolean } })
          .easypeasy;
        if (ep.tierId) setEasypeasyTier(ep.tierId);
        setEasypeasyLive((prev) => ({
          loading: false,
          active: !!ep.active,
          tierId: ep.tierId ?? null,
          model: ep.model ?? null,
          migratedFromPremium: prev.migratedFromPremium,
        }));
      }
      onComplete?.();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      phaseTimers.current.forEach(clearTimeout);
      setRunning(false);
      setPhase(PHASES.length);
    }
  }

  useEffect(() => {
    if (!autoRun || autoRunStarted.current) return;
    autoRunStarted.current = true;
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const timer = setTimeout(() => {
      void run();
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when autoRun is enabled
  }, [autoRun]);

  async function saveCred(key: string) {
    const val = credInputs[key];
    if (!val?.trim()) return;
    setSavingCred(key);
    try {
      await authFetch("/api/orbit/marketing-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", credentials: { [key]: val } }),
      });
      setSavedCreds((prev) => [...prev, key]);
      setConfiguredKeys((prev) => ({ ...prev, [key]: true }));
      setCredInputs((prev) => ({ ...prev, [key]: "" }));
    } catch {
      // ignore
    } finally {
      setSavingCred(null);
    }
  }

  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2200);
  }

  function copyAndOpen(text: string, id: string, url?: string) {
    copyText(text, id);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function markTaskDone(taskId: string) {
    setManualDoneIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      try {
        localStorage.setItem("orbit-manual-done", JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Partition: automated (AI + APIs + indexing) vs manual paste-only
  const partitioned = result
    ? partitionAutopilotTasks(result.tasks)
    : { automated: [], manual: [] };
  const automatedDone = partitioned.automated.filter((t) => isAutomatedSuccess(t.status));
  const automatedNeedsKey = partitioned.automated.filter(
    (t) => t.status === "needs_credentials" && !manualDoneIds.has(t.id),
  );
  const automatedFailed = partitioned.automated.filter((t) => t.status === "failed");
  const manualPending = partitioned.manual.filter(
    (t) =>
      (t.status === "prepared" || t.status === "needs_credentials") && !manualDoneIds.has(t.id),
  );

  const hasRun = !!result;
  const autoCount = automatedDone.length;

  const livePages =
    (orbitStatus?.seoPages ?? 0) +
    (orbitStatus?.blogPosts ?? 0) +
    (orbitStatus?.aeoPages ?? 0) +
    (orbitStatus?.comparisons ?? 0) +
    (orbitStatus?.seedMarketing ?? 0);

  return (
    <div
      ref={rootRef}
      id="orbit-one-click"
      className="rounded-2xl border-2 overflow-hidden pink-camo-panel"
      style={{
        borderColor: running ? "#ff69b4" : "rgba(255, 105, 180, 0.55)",
        background: running
          ? `linear-gradient(135deg, rgba(255,105,180,0.14), rgba(219,112,147,0.08))`
          : `linear-gradient(135deg, rgba(255,182,193,0.12), rgba(255,105,180,0.06))`,
      }}
    >
      {/* ── Hero header ── */}
      <div className="px-4 sm:px-5 pt-5 pb-4 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg pink-camo-btn"
            style={{ animation: "none", minWidth: 48, minHeight: 48 }}
          >
            {running ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : hasRun ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-black text-foreground leading-tight">
              {running
                ? `Running ${URRTHANG_LABEL}${marketingModel ? ` (${marketingModel})` : ""}…`
                : hasRun
                  ? `${URRTHANG_LABEL} complete`
                  : aiProviderLabel
                    ? `${URRTHANG_LABEL} — one button (${aiProviderLabel})`
                    : `${URRTHANG_LABEL} — one button (no API key)`}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {running
                ? "Orbit runs on built-in templates or AI if configured. Google/Bing indexing runs automatically."
                : hasRun
                  ? copyOnlyMode
                    ? "Fully automated: pages, indexing, launch copy. Optional social/email copy saved in Growth Content."
                    : "Everything automatable ran below. Manual paste tasks are in their own section."
                  : "One press: SEO pages, Google & Bing indexing, and launch copy — works with zero API keys via built-in templates."}
            </p>
            {easypeasyTier && !running && (
              <p className="text-[10px] text-fuchsia-700 dark:text-fuchsia-300 mt-1 sr-only">
                AI tier: <strong>{easypeasyTier}</strong>
                {marketingModel ? ` · ${marketingModel}` : ""}
              </p>
            )}
            {aiConfigured && (marketingModel || aiProviderLabel) && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold sr-only">
                AI: {aiProviderLabel || marketingModel}
              </p>
            )}
          </div>
        </div>

        {/* Orbit AI live status */}
        <div
          data-testid="orbit-ai-live-status"
          className={`rounded-xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 flex items-start gap-3 ${
            easypeasyLive.loading
              ? "border-border/60 bg-muted/30"
              : easypeasyLive.active
                ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
                : "border-amber-500/45 bg-amber-500/10"
          }`}
        >
          {easypeasyLive.loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Checking Orbit AI…</p>
                <p className="text-xs text-muted-foreground">Templates first — AI optional upgrade</p>
              </div>
            </>
          ) : easypeasyLive.active ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  {aiProviderLabel ?? "Orbit ready"}
                  {templateMode ? " — no API key" : ""}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {easypeasyLive.model ?? marketingModel ?? "template-v1"}
                  {templateMode ? " · SEO pages, social copy, outreach" : ""}
                </p>
                {easypeasyLive.migratedFromPremium && (
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1.5 font-medium">
                    Switched from Premium → Standard. Paid word limits no longer apply.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Built-in templates ready
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5">
                  No API key needed — Orbit generates SEO pages and launch copy from templates.
                </p>
              </div>
            </>
          )}
        </div>

        <OrbitAgentModeCard />

        {/* urrthang — owner Orbit admin only (Launchpad is admin-gated) */}
        <button
          ref={urrthangButtonRef}
          type="button"
          onClick={handleUrrthangClick}
          disabled={running || quickStartRunning || !canRunUrrthang}
          data-testid="orbit-one-click-launch"
          data-urrthang="true"
          aria-label={`${URRTHANG_LABEL} — run all Orbit marketing and indexing`}
          className={`w-full flex items-center justify-center gap-2.5 py-5 sm:py-6 rounded-xl text-lg sm:text-xl min-h-[88px] ${PINK_CAMO_BUTTON_CLASS}`}
          style={running ? PINK_CAMO_BUTTON_ACTIVE_STYLE : PINK_CAMO_BUTTON_STYLE}
        >
          {running ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Working…
            </>
          ) : hasRun ? (
            <>
              <RefreshCw className="w-6 h-6" /> {URRTHANG_LABEL} again
            </>
          ) : (
            <>
              <Rocket className="w-6 h-6" /> {URRTHANG_LABEL}
            </>
          )}
        </button>

        {running && (
          <div className="rounded-xl bg-black/20 border border-pink-300/25 p-3 space-y-2.5">
            {PHASES.map((p, i) => {
              const st = i < phase ? "done" : i === phase ? "active" : "pending";
              return (
                <div
                  key={p.label}
                  className={`flex items-center gap-2.5 text-xs ${st === "pending" ? "opacity-40" : ""}`}
                >
                  {st === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  ) : st === "active" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-300 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={st === "active" ? "font-bold text-foreground" : ""}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error from urrthang run */}
        {error &&
          !running &&
          (() => {
            const formatted = formatOrbitRunError(error, {
              tierId: easypeasyLive.tierId,
              model: easypeasyLive.model,
            });
            return (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-100">{formatted.title}</p>
                    <p className="mt-1 leading-relaxed">{formatted.detail}</p>
                  </div>
                </div>
                {formatted.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    {formatted.actions.map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-md border border-red-400/40 text-red-100 hover:bg-red-500/15"
                      >
                        {a.label} →
                      </Link>
                    ))}
                  </div>
                )}
                {formatted.alternatives && formatted.alternatives.length > 0 && (
                  <div className="pl-6 pt-1 space-y-1">
                    <p className="text-[10px] font-bold text-red-100 uppercase tracking-wide">
                      Try instead
                    </p>
                    {formatted.alternatives.map((alt) => (
                      <Link
                        key={alt.href}
                        href={alt.href}
                        className="block text-[10px] text-red-100/90 hover:text-red-50"
                      >
                        <span className="font-bold">{alt.name}</span> — {alt.why}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

        {/* Index Google — separate from free setup (indexing + Stripe check only) */}
        <div className="rounded-xl border-2 border-[#5B8DA8]/35 bg-[#5B8DA8]/8 p-3 space-y-2">
          <div>
            <p className="text-[11px] font-black text-[#5B8DA8] uppercase tracking-wide">
              Quick index
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Sitemap + Google Indexing API + Stripe key check — no SEO pages or AI copy.
            </p>
          </div>
          <button
            type="button"
            onClick={runQuickStart}
            disabled={running || quickStartRunning}
            data-testid="orbit-quick-start"
            className="w-full sm:w-auto sm:min-w-[14rem] flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-foreground border-2 transition-all active:scale-[0.98] disabled:opacity-70 bg-card/80"
            style={{ borderColor: `${TEAL}88` }}
            title="Submit sitemap + Indexing API to Google and verify Stripe keys — no content generation"
          >
            {quickStartRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Indexing…
              </>
            ) : (
              <>
                <Search className="w-4 h-4 flex-shrink-0" />
                Index Google + check Stripe
              </>
            )}
          </button>
        </div>

        {/* Free tier API keys — separate card, not bundled with Index Google */}
        <OrbitSubscribeQuickStrip
          className="w-full"
          configuredKeys={configuredKeys}
          aiConfigured={aiConfigured}
          onPasteKey={(key) => {
            const el = document.getElementById(`cred-${key}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
            document.getElementById("orbit-paid-services")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        />

        <OrbitPaidServicesHub
          defaultExpanded={!aiConfigured}
          copyOnlyMode={copyOnlyMode}
          configuredKeys={configuredKeys}
          aiConfigured={aiConfigured}
          aiProviderLabel={aiProviderLabel}
          gscConnected={gsc.connected}
          gscPropertyOk={gsc.propertyOk}
          indexNowActive={!!orbitStatus?.indexNowSubmitted}
          onPasteKey={(key) => {
            const el = document.getElementById(`cred-${key}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />

        {!configuredKeys.n8nWebhookUrl && (
          <div
            id="cred-n8nWebhookUrl"
            className="rounded-xl border border-teal-500/35 bg-teal-500/8 px-3 py-2.5 space-y-2"
          >
            <p className="text-[11px] font-bold text-teal-200">n8n webhook (recommended)</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Orbit POSTs your full marketing pack to n8n after each run — wire LinkedIn, email, and
              CRM in one workflow instead of separate OmniSocials + Resend keys.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://your-n8n.app/webhook/..."
                value={credInputs.n8nWebhookUrl ?? ""}
                onChange={(e) =>
                  setCredInputs((prev) => ({ ...prev, n8nWebhookUrl: e.target.value }))
                }
                className="flex-1 h-8 text-xs px-2.5 rounded-lg border border-border/60 bg-card/80 focus:outline-none focus:border-teal-400 text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                disabled={!credInputs.n8nWebhookUrl?.trim() || savingCred === "n8nWebhookUrl"}
                onClick={() => saveCred("n8nWebhookUrl")}
                className="h-8 px-3 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                style={{ background: TEAL }}
              >
                {savingCred === "n8nWebhookUrl" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* One-press Google Search Console connect — camo orb */}
        <div className="flex flex-col items-center gap-2 py-1">
          <GscConnectOrb
            connected={gsc.connected}
            available={gsc.available}
            oauthUrl={gscOAuthConnectUrl("/dashboard/launchpad")}
            size={170}
          />
          <p className="text-[11px] text-center text-muted-foreground max-w-xs">
            {gsc.connected
              ? gsc.email
                ? gsc.propertyOk
                  ? `Google connected · ${gsc.email}`
                  : `Google signed in · add zzaizzai.com in Search Console (Owner)`
                : gsc.propertyOk
                  ? "Google Search Console connected."
                  : "Google connected — verify zzaizzai.com property in Search Console."
              : gsc.available
                ? "Press the camo orb to connect Google Search Console — AI handles the rest."
                : "Paste your Google OAuth client ID + secret to enable one-click connect."}
          </p>
          {!gsc.connected && (
            <GscOAuthClientSavePanel
              compact
              oauthReady={gsc.available}
              connectReturnTo="/dashboard/launchpad"
              onSaved={() => void refreshGscStatus()}
            />
          )}
          {!gsc.connected && gsc.available && (
            <Link
              href="/dashboard/gsc-connect"
              className="text-[11px] font-bold underline text-[#5B8DA8]"
            >
              Advanced GSC setup →
            </Link>
          )}
        </div>

        {/* Live marketing health — always visible, reflects work already done */}
        <MarketingHealthPanel
          health={health}
          livePages={livePages}
          indexNowDone={!!orbitStatus?.indexNowSubmitted || (health?.submitted ?? 0) > 0}
          gscConnected={gsc.connected && gsc.propertyOk}
          gscSignedIn={gsc.connected}
          checking={healthChecking}
          onCheck={runHealthCheck}
        />

        {/* Live status bar — visible before first run */}
        {!running && (
          <div className="flex flex-wrap gap-1.5">
            <StatusPill
              icon="📄"
              label={livePages > 0 ? `${livePages} pages live` : "No pages yet"}
              ok={livePages > 0}
            />
            <StatusPill
              icon="🔍"
              label={orbitStatus?.indexNowSubmitted ? "IndexNow ✓" : "IndexNow pending"}
              ok={!!orbitStatus?.indexNowSubmitted}
            />
            <StatusPill icon="🔄" label="Weekly autopilot: ON" ok teal />
            {aiConfigured && aiProviderLabel ? (
              <StatusPill icon="🤖" label={`Marketing AI: ${aiProviderLabel}`} ok />
            ) : null}
            {result && (
              <StatusPill
                icon="⚡"
                label={`Last run: ${new Date(result.finishedAt ?? "").toLocaleDateString()}`}
                ok
              />
            )}
          </div>
        )}

        {quickStartError && !quickStartRunning && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {quickStartError}
          </div>
        )}

        {quickStartResult && !quickStartRunning && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0"
                style={{ color: quickStartResult.ok ? TEAL : "#fbbf24" }}
              />
              <p className="text-xs font-bold text-foreground">
                {quickStartResult.message || "Quick start complete"}
              </p>
            </div>

            {quickStartResult.stripe && (
              <div className="rounded-lg border border-border/40 bg-card/40 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-black text-foreground">Stripe</p>
                  <span
                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                      quickStartResult.stripe.allOk
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {quickStartResult.stripe.allOk ? "Ready" : "Needs setup"}
                  </span>
                </div>
                <ul className="space-y-1">
                  {quickStartResult.stripe.checks.map((c) => (
                    <li key={c.label} className="text-[10px] text-muted-foreground flex gap-1.5">
                      <span className={c.ok ? "text-emerald-400" : "text-amber-400"}>
                        {c.ok ? "✓" : "•"}
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{c.label}</span>
                        {" — "}
                        {c.action}
                      </span>
                    </li>
                  ))}
                </ul>
                {!quickStartResult.stripe.allOk && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenStripeSetup) onOpenStripeSetup();
                      else
                        document.getElementById("orbit-stripe-setup")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className="text-[10px] font-bold underline text-foreground"
                  >
                    Jump to Stripe setup
                  </button>
                )}
              </div>
            )}

            {quickStartResult.indexing && (
              <GoogleIndexingCard
                indexing={quickStartResult.indexing}
                gscConnected={gsc.connected && gsc.propertyOk}
                oauthReady={gsc.available}
                onGscSaved={() => void refreshGscStatus()}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && !running && (
        <div className="border-t border-border/50 divide-y divide-border/40">
          {/* Google & search indexing */}
          {result.indexing && (
            <div className="px-4 sm:px-5 py-4">
              <GoogleIndexingCard
                indexing={result.indexing}
                gscConnected={gsc.connected && gsc.propertyOk}
                oauthReady={gsc.available}
                onGscSaved={() => void refreshGscStatus()}
              />
            </div>
          )}

          {/* ── Automated (AI + APIs + indexing) ── */}
          {(automatedDone.length > 0 ||
            automatedNeedsKey.length > 0 ||
            automatedFailed.length > 0) && (
            <div className="px-4 sm:px-5 py-4 border-l-4 border-emerald-500/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-black text-emerald-400">Ran automatically</span>
                <span className="text-[11px] rounded-full px-2 py-0.5 font-bold bg-emerald-500/15 text-emerald-400">
                  {automatedDone.length}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniStat value={autoCount} label="automated" color="#34d399" />
                <MiniStat value={result.stats.posted} label="posted live" color={TEAL} />
                <MiniStat value={manualPending.length} label="manual left" color="#fbbf24" />
              </div>

              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="text-[10px] text-muted-foreground hover:text-foreground mb-2"
              >
                {showDone ? "Hide details" : `Show all ${automatedDone.length} automated steps`}
              </button>

              {showDone && (
                <ul className="space-y-1.5 mb-3">
                  {automatedDone.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-emerald-500" />
                      <span>
                        <span className="font-semibold text-foreground">{t.label}</span>
                        {t.message && <span className="text-muted-foreground"> — {t.message}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {automatedFailed.length > 0 && (
                <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-2.5 mb-3 space-y-1">
                  <p className="text-[10px] font-bold text-red-400">Needs attention</p>
                  {automatedFailed.map((t) => (
                    <p key={t.id} className="text-[10px] text-muted-foreground">
                      {t.label}: {t.message}
                    </p>
                  ))}
                </div>
              )}

              {automatedNeedsKey.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-violet-400">
                    Add API keys once — these become automatic forever
                  </p>
                  {automatedNeedsKey.map((t) => {
                    const meta = metaFor(t.id);
                    const isCredSaved = meta.credKey ? savedCreds.includes(meta.credKey) : false;
                    return (
                      <ActionCard
                        key={t.id}
                        task={t}
                        meta={meta}
                        needsKey={!!meta.credKey}
                        isCredSaved={isCredSaved}
                        credValue={credInputs[meta.credKey ?? ""] ?? ""}
                        onCredChange={(v) =>
                          setCredInputs((prev) => ({ ...prev, [meta.credKey!]: v }))
                        }
                        savingCred={savingCred === meta.credKey}
                        copiedId={copiedId}
                        onCopy={(text) => copyText(text, t.id)}
                        onCopyAndOpen={(text) => copyAndOpen(text, t.id, meta.openUrl)}
                        onSaveCred={() => meta.credKey && saveCred(meta.credKey)}
                        onMarkDone={() => markTaskDone(t.id)}
                        compact
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Manual only (no API exists) ── */}
          {manualPending.length > 0 && (
            <div className="px-4 sm:px-5 py-4 border-l-4 border-amber-500/50 bg-amber-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-amber-400">
                  Manual — paste on these sites
                </span>
                <span className="text-[11px] rounded-full px-2 py-0.5 font-bold bg-amber-500/15 text-amber-400">
                  {manualPending.length}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                No public API for these platforms. AI wrote the copy — use Copy &amp; Open, paste,
                publish, Done.
              </p>

              <div className="space-y-2">
                {manualPending.map((t) => {
                  const meta = metaFor(t.id);
                  return (
                    <ActionCard
                      key={t.id}
                      task={t}
                      meta={meta}
                      needsKey={false}
                      isCredSaved={false}
                      credValue=""
                      onCredChange={() => {}}
                      savingCred={false}
                      copiedId={copiedId}
                      onCopy={(text) => copyText(text, t.id)}
                      onCopyAndOpen={(text) => copyAndOpen(text, t.id, meta.openUrl)}
                      onSaveCred={() => {}}
                      onMarkDone={() => markTaskDone(t.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer: weekly hint ── */}
      {!running && (
        <div className="px-4 sm:px-5 py-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>
            Weekly cron runs every Monday 8am — re-submits all URLs and fills content gaps
            automatically.
          </span>
        </div>
      )}

      {urrthangPinned && !running && (
        <div className="sticky bottom-3 z-20 px-4 sm:px-5 pb-1">
          <button
            type="button"
            onClick={handleUrrthangClick}
            disabled={quickStartRunning}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm shadow-lg ${PINK_CAMO_BUTTON_CLASS}`}
            style={PINK_CAMO_BUTTON_STYLE}
            aria-label={`${URRTHANG_LABEL} — scroll back up or tap to run`}
          >
            <Rocket className="w-4 h-4" /> {URRTHANG_LABEL}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MarketingHealthPanel({
  health,
  livePages,
  indexNowDone,
  gscConnected,
  gscSignedIn = false,
  checking,
  onCheck,
}: {
  health: {
    totalUrls: number;
    submitted: number;
    confirmed: number;
    stale: number;
    lastRunAt: string | null;
    lastScore: number | null;
  } | null;
  livePages: number;
  indexNowDone: boolean;
  gscConnected: boolean;
  gscSignedIn?: boolean;
  checking: boolean;
  onCheck: () => void;
}) {
  const total = health?.totalUrls ?? 0;
  const submitted = health?.submitted ?? 0;
  const coverage = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const score = health?.lastScore;
  const scoreColor =
    score == null ? "#6b7280" : score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#fb7185";
  const covColor = coverage >= 80 ? "#34d399" : coverage >= 50 ? "#fbbf24" : "#fb7185";

  return (
    <div
      className="rounded-xl border p-3 space-y-2.5"
      style={{ borderColor: `${TEAL}33`, background: `${TEAL}08` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" style={{ color: TEAL }} />
          Marketing health
        </p>
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border disabled:opacity-60"
          style={{ borderColor: `${TEAL}55`, color: TEAL }}
        >
          {checking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Checking…
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3" /> Run health check
            </>
          )}
        </button>
      </div>

      {/* big metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card/50 border border-border/40 px-2 py-2 text-center">
          <p className="text-lg font-black tabular-nums" style={{ color: scoreColor }}>
            {score == null ? "—" : `${score}`}
          </p>
          <p className="text-[9px] text-muted-foreground font-semibold">Index score</p>
        </div>
        <div className="rounded-lg bg-card/50 border border-border/40 px-2 py-2 text-center">
          <p className="text-lg font-black tabular-nums" style={{ color: covColor }}>
            {coverage}%
          </p>
          <p className="text-[9px] text-muted-foreground font-semibold">Coverage</p>
        </div>
        <div className="rounded-lg bg-card/50 border border-border/40 px-2 py-2 text-center">
          <p className="text-lg font-black tabular-nums text-foreground">{total || livePages}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">URLs live</p>
        </div>
      </div>

      {/* sub-line */}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {total > 0 ? (
          <>
            <span className="text-foreground font-semibold">{submitted}</span> of {total} submitted
            {health && health.confirmed > 0 ? (
              <>
                {" · "}
                <span className="text-emerald-400 font-semibold">{health.confirmed}</span> confirmed
              </>
            ) : null}
            {health && health.stale > 0 ? (
              <>
                {" · "}
                <span className="text-amber-400 font-semibold">{health.stale}</span> stale (auto
                re-submitting)
              </>
            ) : null}
          </>
        ) : (
          "Run a health check to crawl your live pages and score indexability."
        )}
      </p>

      {/* channel chips */}
      <div className="flex flex-wrap gap-1.5">
        <StatusPill
          icon="📄"
          label={`${livePages || total} pages live`}
          ok={(livePages || total) > 0}
        />
        <StatusPill
          icon="🔍"
          label={indexNowDone ? "IndexNow ✓" : "IndexNow pending"}
          ok={indexNowDone}
        />
        <StatusPill icon="🤖" label="llms.txt ✓ (AI search)" ok teal />
        <StatusPill
          icon="🟢"
          label={
            gscConnected
              ? "Google ✓"
              : gscSignedIn
                ? "Google: verify property"
                : "Google: connect ↑"
          }
          ok={gscConnected}
        />
      </div>

      {health?.lastRunAt && (
        <p className="text-[9px] text-muted-foreground/70">
          Last health check: {new Date(health.lastRunAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function StatusPill({
  icon,
  label,
  ok,
  teal,
}: {
  icon: string;
  label: string;
  ok: boolean;
  teal?: boolean;
}) {
  const color = teal ? TEAL : ok ? "#34d399" : "#6b7280";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}12`,
      }}
    >
      {icon} {label}
    </span>
  );
}

function GoogleIndexingCard({
  indexing,
  gscConnected: gscConnectedProp,
  oauthReady = false,
  onGscSaved,
}: {
  indexing: MarketingIndexingSummary;
  gscConnected?: boolean;
  oauthReady?: boolean;
  onGscSaved?: () => void;
}) {
  const gscConnected = gscConnectedProp ?? indexing.gscConnected;
  const gscOk = gscConnected && indexing.googleSitemap.ok;
  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-black text-sky-300">Google &amp; search indexing</p>
        <div className="flex gap-1.5">
          <a
            href="/dashboard/gsc-connect"
            className="px-2 py-1 rounded-lg text-[10px] font-bold border border-sky-500/40 text-sky-300"
          >
            GSC setup
          </a>
        </div>
      </div>
      {!gscConnected && (
        <GscOAuthClientSavePanel
          compact
          oauthReady={oauthReady}
          connectReturnTo="/dashboard/launchpad"
          onSaved={onGscSaved}
          data-testid="google-indexing-connect-bro"
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <IndexStat
          label="IndexNow"
          ok={indexing.indexNow.ok}
          detail={`${indexing.indexNow.submitted}/${indexing.indexNow.total}`}
        />
        <IndexStat
          label="Bing ping"
          ok={indexing.bingPing.ok}
          detail={indexing.bingPing.ok ? "OK" : "—"}
        />
        <IndexStat
          label="GSC sitemap"
          ok={gscOk}
          detail={
            gscConnected ? (indexing.googleSitemap.ok ? "Submitted" : "Failed") : "Not connected"
          }
        />
        <IndexStat
          label="Google Index API"
          ok={indexing.googleIndexing.submitted > 0}
          detail={
            indexing.googleIndexing.attempted
              ? `${indexing.googleIndexing.submitted} URLs`
              : "Skipped"
          }
        />
      </div>
      {indexing.health && (
        <div className="rounded-lg border border-border/40 bg-card/40 px-2.5 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black text-foreground">
              Index health{" "}
              <span
                className={
                  indexing.health.score >= 80
                    ? "text-emerald-400"
                    : indexing.health.score >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                }
              >
                {indexing.health.score}/100
              </span>
            </p>
            <p className="text-[9px] text-muted-foreground tabular-nums">
              {indexing.health.coveragePct}% coverage · {indexing.health.staleUrls} stale
            </p>
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {indexing.health.indexable}/{indexing.health.sampled} sampled URLs live &amp; indexable.
            Progress is tracked across runs — slow week-long crawls keep getting re-submitted.
          </p>
          {indexing.health.problems.length > 0 && (
            <p className="text-[9px] text-amber-400/90 leading-relaxed">
              Needs attention:{" "}
              {indexing.health.problems
                .slice(0, 2)
                .map((p) => `${p.url} (${p.notes})`)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
      {!gscConnected && (
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Tap <strong className="text-sky-300">Connect bro</strong> — one sign-in. Orbit submits
          your sitemap and requests indexing via Search Console (not via an LLM).
        </p>
      )}
      {indexing.googleIndexing.errorsSample.length > 0 && (
        <p className="text-[9px] text-amber-400/90 leading-relaxed">
          {dedupeErrorMessages(indexing.googleIndexing.errorsSample).slice(0, 1).join(" ")}
        </p>
      )}
    </div>
  );
}

function IndexStat({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 px-2 py-1.5 text-center">
      <p className={`text-[9px] font-bold ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-[10px] font-black text-foreground tabular-nums">{detail}</p>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 py-2 text-center">
      <p className="text-lg font-black tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function ActionCard({
  task,
  meta,
  needsKey,
  isCredSaved,
  credValue,
  onCredChange,
  savingCred,
  copiedId,
  onCopy,
  onCopyAndOpen,
  onSaveCred,
  onMarkDone,
  compact,
}: {
  task: Task;
  meta: ActionMeta;
  needsKey: boolean;
  isCredSaved: boolean;
  credValue: string;
  onCredChange: (v: string) => void;
  savingCred: boolean;
  copiedId: string | null;
  onCopy: (text: string) => void;
  onCopyAndOpen: (text: string) => void;
  onSaveCred: () => void;
  onMarkDone: () => void;
  compact?: boolean;
}) {
  const [showKey, setShowKey] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const isCopied = copiedId === task.id;
  const pasteText = task.copyText || task.message;
  const steps = stepsForTask(task.id);

  return (
    <div
      className="rounded-xl border border-border/50 bg-card/40 overflow-hidden"
      id={meta.credKey ? `cred-${meta.credKey}` : undefined}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <span className="text-base flex-shrink-0 mt-0.5">{meta.icon}</span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <p className="text-xs font-bold text-foreground">{task.label}</p>
            <p className="text-[10px] text-muted-foreground leading-snug">{task.message}</p>
          </div>

          <ol className="flex flex-wrap gap-x-2 gap-y-0.5">
            {!compact &&
              steps.map((s, i) => (
                <li key={s} className="text-[9px] text-muted-foreground/90 list-none">
                  <span className="text-amber-500/80 font-bold">{i + 1}.</span> {s}
                  {i < steps.length - 1 && <span className="mx-1 opacity-30">→</span>}
                </li>
              ))}
          </ol>

          {pasteText && pasteText !== task.message && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-[9px] text-violet-400 hover:text-violet-300"
            >
              {showPreview ? "Hide preview" : "Preview copy"}
            </button>
          )}
          {showPreview && (
            <pre className="text-[9px] text-muted-foreground bg-black/20 rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap border border-border/30">
              {pasteText.slice(0, 600)}
              {pasteText.length > 600 ? "…" : ""}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {meta.openUrl ? (
            <button
              type="button"
              onClick={() => onCopyAndOpen(pasteText)}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-black text-white min-w-[88px]"
              style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy & Open
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCopy(pasteText)}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-bold border border-border/60 bg-card/60"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy
            </button>
          )}

          {!compact && (
            <button
              type="button"
              onClick={onMarkDone}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle2 className="w-3 h-3" /> Done
            </button>
          )}

          {needsKey && !isCredSaved && meta.credKey && (
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-violet-500/40 text-violet-400"
            >
              <KeyRound className="w-3 h-3" /> Key
            </button>
          )}
          {isCredSaved && (
            <span className="text-center text-[9px] font-bold text-emerald-400">Auto ✓</span>
          )}
        </div>
      </div>

      {showKey && !isCredSaved && meta.credKey && meta.credLabel && (
        <div className="px-3 pb-3 pt-0 border-t border-border/40 bg-violet-500/5">
          <p className="text-[10px] text-muted-foreground mt-2 mb-1.5">
            {meta.credHint ?? `Add your ${meta.credLabel}`} — saved once, auto-posts forever.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder={meta.credLabel}
              value={credValue}
              onChange={(e) => onCredChange(e.target.value)}
              className="flex-1 h-8 text-xs px-2.5 rounded-lg border border-border/60 bg-card/80 focus:outline-none focus:border-violet-400 text-foreground placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              disabled={!credValue.trim() || savingCred}
              onClick={onSaveCred}
              className="h-8 px-3 rounded-lg text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1"
              style={{ background: savingCred ? "#6b7280" : TEAL }}
            >
              {savingCred ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
