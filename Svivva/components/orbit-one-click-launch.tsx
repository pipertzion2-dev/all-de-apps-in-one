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
import { authFetch } from "@/hooks/use-auth";

const GscConnectOrb = nextDynamic(() => import("@/components/gsc-connect-orb"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto rounded-full bg-muted/30 animate-pulse" style={{ width: 150, height: 150 }} />
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
  CreditCard,
  Circle,
  Activity,
} from "lucide-react";
import { stepsForTask } from "@/lib/orbit/orbit-setup-providers";
import type { OrbitSetupProvider } from "@/lib/orbit/orbit-setup-providers";
import {
  isAutomatedSuccess,
  partitionAutopilotTasks,
} from "@/lib/orbit/marketing-task-buckets";
import type { MarketingIndexingSummary } from "@/lib/orbit/marketing-autopilot-types";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "posted" | "done" | "prepared" | "failed" | "needs_credentials" | "skipped" | "running";

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
    credKey: "omnisocialsApiKey",
    credLabel: "OmniSocials API key",
    credHint: "omnisocials.com → connect X → Settings → API (replaces $100/mo X API)",
    copyLabel: "Copy thread",
  },
  {
    id: "manual-linkedin",
    icon: "💼",
    openUrl: "https://www.linkedin.com/post/new",
    credKey: "omnisocialsApiKey",
    credLabel: "OmniSocials API key",
    credHint: "omnisocials.com → connect LinkedIn → Settings → API",
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
  { label: "Building SEO pages, blog, comparisons & tool pages" },
  { label: "Submitting URLs to Google (GSC + Indexing API), Bing & IndexNow" },
  { label: "Generating AI launch copy & auto-posting where APIs allow" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onComplete?: () => void;
  /** Live DB status for the live-count bar */
  orbitStatus?: StatusData | null;
  /** When true, scroll into view and run autopilot once on mount (e.g. ?autorun=1). */
  autoRun?: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OrbitOneClickLaunch({ onComplete, orbitStatus, autoRun }: Props) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credInputs, setCredInputs] = useState<Record<string, string>>({});
  const [savingCred, setSavingCred] = useState<string | null>(null);
  const [savedCreds, setSavedCreds] = useState<string[]>([]);
  const [setupProviders, setSetupProviders] = useState<OrbitSetupProvider[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [configuredKeys, setConfiguredKeys] = useState<Record<string, boolean>>({});
  const [manualDoneIds, setManualDoneIds] = useState<Set<string>>(() => new Set());
  const [showSetup, setShowSetup] = useState(true);
  const [gsc, setGsc] = useState<{
    connected: boolean;
    available: boolean;
    email: string | null;
    propertyOk: boolean;
    matchedSite: string | null;
  }>({
    connected: false,
    available: true,
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
              available: d.oauthAvailable !== false,
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

  // Load last run + setup state on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await authFetch("/api/orbit/marketing-autopilot");
        if (!r.ok || cancelled) return;
        const json = (await r.json()) as {
          lastRun?: RunResult | null;
          setupProviders?: OrbitSetupProvider[];
          ai?: { configured?: boolean };
          status?: { configured?: Record<string, boolean> };
        };
        if (json.lastRun && !cancelled) setResult(json.lastRun);
        if (json.setupProviders) setSetupProviders(json.setupProviders);
        if (json.ai?.configured) setAiConfigured(true);
        if (json.status?.configured) setConfiguredKeys(json.status.configured);
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

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    setPhase(0);
    setShowDone(false);
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = PHASES.map((_, i) => setTimeout(() => setPhase(i), i * 9_000));
    try {
      const r = await authFetch("/api/orbit/marketing-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setResult(json as RunResult);
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

  function isProviderReady(p: OrbitSetupProvider): boolean {
    if (p.envKey === "OPENAI_API_KEY" || p.envKey === "GEMINI_API_KEY") return aiConfigured;
    if (p.credentialKey) return !!configuredKeys[p.credentialKey] || savedCreds.includes(p.credentialKey);
    return false;
  }

  // Partition: automated (AI + APIs + indexing) vs manual paste-only
  const partitioned = result ? partitionAutopilotTasks(result.tasks) : { automated: [], manual: [] };
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
      className="rounded-2xl border-2 overflow-hidden"
      style={{
        borderColor: running ? TEAL : hasRun ? `${TEAL}55` : `${BURG}55`,
        background: running
          ? `linear-gradient(135deg,${TEAL}12,${BURG}08)`
          : `linear-gradient(135deg,${BURG}08,${TEAL}06)`,
      }}
    >
      {/* ── Hero header ── */}
      <div className="px-4 sm:px-5 pt-5 pb-4 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg"
            style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
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
                ? "Running AI marketing…"
                : hasRun
                  ? "AI marketing complete"
                  : "AI marketing — one button"}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {running
                ? "Orbit is building pages, indexing Google/Bing, writing copy, and auto-posting. Leave this page open."
                : hasRun
                  ? "Everything automatable ran below. Manual paste tasks are in their own section."
                  : "One press: AI builds all on-site SEO, submits to Google & Bing, generates copy, and posts via API."}
            </p>
          </div>
        </div>

        {/* One-press Google Search Console connect — camo orb */}
        <div className="flex flex-col items-center gap-2 py-1">
          <GscConnectOrb
            connected={gsc.connected}
            available={gsc.available}
            oauthUrl="/api/gsc/oauth/start?return=/dashboard/launchpad"
            size={170}
          />
          <p className="text-[11px] text-center text-muted-foreground max-w-xs">
            {gsc.connected
              ? gsc.email
                ? gsc.propertyOk
                  ? `Google connected · ${gsc.email}`
                  : `Google signed in · add svivva.com in Search Console (Owner)`
                : gsc.propertyOk
                  ? "Google Search Console connected."
                  : "Google connected — verify svivva.com property in Search Console."
              : gsc.available
                ? "Press the camo orb to connect Google Search Console — AI handles the rest."
                : "Google connect will be available shortly."}
          </p>
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
            <StatusPill
              icon="🔄"
              label="Weekly autopilot: ON"
              ok
              teal
            />
            {result && (
              <StatusPill
                icon="⚡"
                label={`Last run: ${new Date(result.finishedAt ?? "").toLocaleDateString()}`}
                ok
              />
            )}
          </div>
        )}

        {/* Setup — pay once, auto forever */}
        {!running && setupProviders.length > 0 && (
          <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSetup((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-300">Connect paid APIs (Apple Pay in Safari)</span>
              </div>
              {showSetup ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {showSetup && (
              <div className="px-3 pb-3 space-y-2 border-t border-violet-500/15">
                {setupProviders
                  .sort((a, b) => a.priority - b.priority)
                  .map((p) => {
                    const ready = isProviderReady(p);
                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border border-border/40 bg-card/40 px-2.5 py-2 flex flex-col sm:flex-row sm:items-center gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {ready ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-[11px] font-bold text-foreground">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">{p.priceLabel}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{p.purpose}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <a
                            href={p.payUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap"
                            style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
                          >
                            Pay & set up
                          </a>
                          {p.credentialKey && (
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`cred-${p.credentialKey}`);
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-violet-500/40 text-violet-300"
                            >
                              Paste key
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                <p className="text-[9px] text-muted-foreground leading-relaxed pt-1">
                  Open pay links in Safari on iPhone or Mac for Apple Pay. Keys stay server-side only — never exposed to visitors.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Primary launch button */}
        <button
          type="button"
          onClick={run}
          disabled={running}
          data-testid="orbit-one-click-launch"
          className="w-full flex items-center justify-center gap-2.5 py-4 sm:py-5 rounded-xl font-black text-base sm:text-lg text-white transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
        >
          {running ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Working…
            </>
          ) : hasRun ? (
            <>
              <RefreshCw className="w-5 h-5" /> Run autopilot again
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" /> Run all AI marketing
            </>
          )}
        </button>

        {/* Running progress */}
        {running && (
          <div className="rounded-xl bg-black/20 border border-white/10 p-3 space-y-2.5">
            {PHASES.map((p, i) => {
              const st = i < phase ? "done" : i === phase ? "active" : "pending";
              return (
                <div
                  key={p.label}
                  className={`flex items-center gap-2.5 text-xs transition-opacity ${st === "pending" ? "opacity-30" : "opacity-100"}`}
                >
                  {st === "done" ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: TEAL }} />
                  ) : st === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: TEAL }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={st === "active" ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && !running && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && !running && (
        <div className="border-t border-border/50 divide-y divide-border/40">
          {/* Google & search indexing */}
          {result.indexing && (
            <div className="px-4 sm:px-5 py-4">
              <GoogleIndexingCard indexing={result.indexing} />
            </div>
          )}

          {/* ── Automated (AI + APIs + indexing) ── */}
          {(automatedDone.length > 0 || automatedNeedsKey.length > 0 || automatedFailed.length > 0) && (
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
                        {t.message && (
                          <span className="text-muted-foreground"> — {t.message}</span>
                        )}
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
                <span className="text-sm font-black text-amber-400">Manual — paste on these sites</span>
                <span className="text-[11px] rounded-full px-2 py-0.5 font-bold bg-amber-500/15 text-amber-400">
                  {manualPending.length}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                No public API for these platforms. AI wrote the copy — use Copy &amp; Open, paste, publish, Done.
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
          <span>Weekly cron runs every Monday 8am — re-submits all URLs and fills content gaps automatically.</span>
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
    score == null
      ? "#6b7280"
      : score >= 80
        ? "#34d399"
        : score >= 50
          ? "#fbbf24"
          : "#fb7185";
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
        <StatusPill icon="📄" label={`${livePages || total} pages live`} ok={(livePages || total) > 0} />
        <StatusPill icon="🔍" label={indexNowDone ? "IndexNow ✓" : "IndexNow pending"} ok={indexNowDone} />
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

function GoogleIndexingCard({ indexing }: { indexing: MarketingIndexingSummary }) {
  const gscOk = indexing.gscConnected && indexing.googleSitemap.ok;
  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-black text-sky-300">Google &amp; search indexing</p>
        <div className="flex gap-1.5">
          {!indexing.gscConnected && (
            <a
              href="/api/gsc/oauth/start?return=/dashboard/launchpad"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
              style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
            >
              Connect Google
            </a>
          )}
          <a
            href="/dashboard/gsc-connect"
            className="px-2 py-1 rounded-lg text-[10px] font-bold border border-sky-500/40 text-sky-300"
          >
            GSC setup
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <IndexStat
          label="IndexNow"
          ok={indexing.indexNow.ok}
          detail={`${indexing.indexNow.submitted}/${indexing.indexNow.total}`}
        />
        <IndexStat label="Bing ping" ok={indexing.bingPing.ok} detail={indexing.bingPing.ok ? "OK" : "—"} />
        <IndexStat
          label="GSC sitemap"
          ok={gscOk}
          detail={indexing.gscConnected ? (indexing.googleSitemap.ok ? "Submitted" : "Failed") : "Not connected"}
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
              Needs attention: {indexing.health.problems.slice(0, 2).map((p) => `${p.url} (${p.notes})`).join(" · ")}
            </p>
          )}
        </div>
      )}
      {!indexing.gscConnected && (
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Tap <strong className="text-sky-300">Connect Google</strong> — one sign-in. AI picks your Search
          Console property and runs sitemap + indexing automatically.
        </p>
      )}
      {indexing.googleIndexing.errorsSample.length > 0 && (
        <p className="text-[9px] text-amber-400/90">
          Sample: {indexing.googleIndexing.errorsSample.slice(0, 2).join(" · ")}
        </p>
      )}
    </div>
  );
}

function IndexStat({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 px-2 py-1.5 text-center">
      <p className={`text-[9px] font-bold ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>{label}</p>
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
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden" id={meta.credKey ? `cred-${meta.credKey}` : undefined}>
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
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
