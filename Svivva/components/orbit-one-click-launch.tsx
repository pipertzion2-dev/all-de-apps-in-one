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
import { authFetch } from "@/hooks/use-auth";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  ExternalLink,
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
} from "lucide-react";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "posted" | "done" | "prepared" | "failed" | "needs_credentials" | "skipped";

type Task = {
  id: string;
  label: string;
  group: string;
  status: TaskStatus;
  message: string;
  url?: string;
  at?: string;
};

type RunResult = {
  ok: boolean;
  finishedAt?: string;
  tasks: Task[];
  summary: string;
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
    credKey: "twitterApiKey",
    credLabel: "X / Twitter API key",
    credHint: "developer.twitter.com → Keys and tokens",
    copyLabel: "Copy thread",
  },
  {
    id: "manual-linkedin",
    icon: "💼",
    openUrl: "https://www.linkedin.com/post/new",
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
];

function metaFor(id: string): ActionMeta {
  return ACTION_META.find((a) => a.id === id) ?? { id, icon: "🔗" };
}

// ─── Running phases ───────────────────────────────────────────────────────────

const PHASES = [
  { label: "Building search infrastructure (Index 22)" },
  { label: "Publishing SEO pages, blog, comparisons & AEO" },
  { label: "Submitting all URLs to Google & Bing via IndexNow" },
  { label: "Generating & auto-posting launch content" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onComplete?: () => void;
  /** Live DB status for the live-count bar */
  orbitStatus?: StatusData | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OrbitOneClickLaunch({ onComplete, orbitStatus }: Props) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credInputs, setCredInputs] = useState<Record<string, string>>({});
  const [savingCred, setSavingCred] = useState<string | null>(null);
  const [savedCreds, setSavedCreds] = useState<string[]>([]);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load last run silently on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await authFetch("/api/orbit/marketing-autopilot");
        if (!r.ok || cancelled) return;
        const json = (await r.json()) as { lastRun?: RunResult | null };
        if (json.lastRun && !cancelled) setResult(json.lastRun);
      } catch {
        // non-blocking
      }
    })();
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
    phaseTimers.current = PHASES.map((_, i) => setTimeout(() => setPhase(i), i * 7_000));
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

  // Partition tasks
  const doneTasks = result?.tasks.filter((t) => t.status === "done" || t.status === "posted") ?? [];
  const needsTasks = result?.tasks.filter(
    (t) => t.status === "prepared" || t.status === "needs_credentials",
  ) ?? [];

  // Live counts from DB (before first run, shows real current state)
  const livePages =
    (orbitStatus?.seoPages ?? 0) +
    (orbitStatus?.blogPosts ?? 0) +
    (orbitStatus?.aeoPages ?? 0) +
    (orbitStatus?.comparisons ?? 0) +
    (orbitStatus?.seedMarketing ?? 0);

  const hasRun = !!result;
  const autoCount = result ? result.stats.done + result.stats.posted : 0;

  return (
    <div
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
                ? "Building your traffic…"
                : hasRun
                  ? "Marketing funnel active"
                  : "One-click marketing autopilot"}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {running
                ? "Orbit is running the full engine. You can leave this page."
                : hasRun
                  ? "Orbit handles everything it can automatically. A few channels need a quick tap."
                  : "Press once — Orbit builds all SEO content, submits to Google & Bing, and auto-posts where APIs allow."}
            </p>
          </div>
        </div>

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
              <Rocket className="w-5 h-5" /> Build all my traffic now
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
          {/* ── Zone A: Done for you ── */}
          {doneTasks.length > 0 && (
            <div className="px-4 sm:px-5 py-4">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#34d399" }} />
                  <span className="text-sm font-black text-emerald-400">
                    Done automatically
                  </span>
                  <span className="text-[11px] rounded-full px-2 py-0.5 font-bold bg-emerald-500/15 text-emerald-400">
                    {doneTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground group-hover:text-foreground">
                  <span>{showDone ? "hide" : "see all"}</span>
                  {showDone ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Always show quick summary metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <MiniStat value={autoCount} label="automated" color="#34d399" />
                <MiniStat value={result.stats.posted} label="posted live" color={TEAL} />
                <MiniStat value={needsTasks.length} label="need a tap" color="#fbbf24" />
              </div>

              {showDone && (
                <ul className="mt-3 space-y-1.5">
                  {doneTasks.map((t) => (
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
            </div>
          )}

          {/* ── Zone B: Needs a tap ── */}
          {needsTasks.length > 0 && (
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-amber-400">Finish in {needsTasks.length} taps</span>
                <span className="text-[10px] text-muted-foreground">
                  Copy is already written — open, paste, done.
                </span>
              </div>

              <div className="space-y-2">
                {needsTasks.map((t) => {
                  const meta = metaFor(t.id);
                  const needsKey = t.status === "needs_credentials" && !!meta.credKey;
                  const isCredSaved = meta.credKey ? savedCreds.includes(meta.credKey) : false;
                  return (
                    <ActionCard
                      key={t.id}
                      task={t}
                      meta={meta}
                      needsKey={needsKey}
                      isCredSaved={isCredSaved}
                      credValue={credInputs[meta.credKey ?? ""] ?? ""}
                      onCredChange={(v) =>
                        setCredInputs((prev) => ({ ...prev, [meta.credKey!]: v }))
                      }
                      savingCred={savingCred === meta.credKey}
                      copiedId={copiedId}
                      onCopy={(text) => copyText(text, t.id)}
                      onSaveCred={() => meta.credKey && saveCred(meta.credKey)}
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
  onSaveCred,
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
  onSaveCred: () => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const isCopied = copiedId === task.id;

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Icon */}
        <span className="text-base flex-shrink-0">{meta.icon}</span>

        {/* Label + message */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{task.label}</p>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">{task.message}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Copy content */}
          <button
            type="button"
            onClick={() => onCopy(task.message)}
            title={meta.copyLabel ?? "Copy"}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-border/60 bg-card/60 hover:bg-card transition-colors"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="hidden sm:inline text-muted-foreground">{isCopied ? "Copied" : "Copy"}</span>
          </button>

          {/* Open platform */}
          {meta.openUrl && (
            <a
              href={meta.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-border/60 bg-card/60 hover:bg-card transition-colors text-muted-foreground"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Open</span>
            </a>
          )}

          {/* Add API key toggle */}
          {needsKey && !isCredSaved && meta.credKey && (
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              title="Add API key to auto-post forever"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/15 transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              <span className="hidden sm:inline">Add key</span>
            </button>
          )}

          {/* Saved indicator */}
          {isCredSaved && (
            <span className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Auto
            </span>
          )}
        </div>
      </div>

      {/* Inline credential input */}
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
