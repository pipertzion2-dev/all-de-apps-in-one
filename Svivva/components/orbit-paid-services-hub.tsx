"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import {
  ORBIT_ANALYTICS_SERVICES,
  ORBIT_BEST_STACK,
  ORBIT_FREE_FALLBACK_SERVICES,
  ORBIT_FREE_STACK_SERVICES,
  ORBIT_INDEXING_SERVICES,
  ORBIT_PAID_SERVICES,
  ORBIT_SERVICE_CATEGORY_LABELS,
  isOrbitFreeTierService,
  orbitFreeStackServices,
  orbitServiceById,
  type OrbitServiceItem,
} from "@/lib/orbit/orbit-services-catalog";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

type Props = {
  configuredKeys?: Record<string, boolean>;
  aiConfigured?: boolean;
  aiProviderLabel?: string | null;
  gscConnected?: boolean;
  gscPropertyOk?: boolean;
  indexNowActive?: boolean;
  showFreeFallback?: boolean;
  defaultExpanded?: boolean;
  /** Scroll to cred-* anchor in one-click launch panel */
  onPasteKey?: (credentialKey: string) => void;
  /** When true, hide Ayrshare/Resend/n8n setup — indexing + GPT only */
  copyOnlyMode?: boolean;
  className?: string;
};

function billingBadge(billing: OrbitServiceItem["billing"]): string {
  if (billing === "paid") return "Paid";
  if (billing === "free-tier-paid-upgrade") return "Free tier";
  return "Free";
}

function ServiceRow({
  item,
  ready,
  onPasteKey,
}: {
  item: OrbitServiceItem;
  ready: boolean;
  onPasteKey?: (key: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 px-2.5 py-2 space-y-1.5">
      <div className="flex items-start gap-2">
        {ready ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-foreground">{item.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
              {item.priceLabel}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                item.billing === "paid"
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                  : item.billing === "free-tier-paid-upgrade"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
              }`}
            >
              {billingBadge(item.billing)}
            </span>
            {item.bestPick && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-teal-500/15 text-teal-300 border border-teal-500/35">
                Best pick
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.purpose}</p>
          {item.freeTier && (
            <p className="text-[10px] mt-1 leading-relaxed text-emerald-700 dark:text-emerald-300">
              <strong>Free tier:</strong> {item.freeTier}
            </p>
          )}
          <ol className="mt-1.5 space-y-0.5 list-decimal list-inside">
            {item.steps.map((step) => (
              <li key={step} className="text-[10px] text-muted-foreground leading-snug">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-5">
        {item.payUrl && item.billing !== "free" && (
          <a
            href={item.payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-bold text-white"
            style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
          >
            Pay &amp; sign up
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
        {item.setupHref && (
          <Link
            href={item.setupHref}
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold border border-[#5B8DA8]/40 text-[#5B8DA8]"
          >
            {item.setupLabel || "Set up"}
          </Link>
        )}
        {item.credentialKey && onPasteKey && (
          <button
            type="button"
            onClick={() => onPasteKey(item.credentialKey!)}
            className="px-2 py-1 rounded-md text-[10px] font-semibold border border-violet-500/40 text-violet-300"
          >
            Paste key below
          </button>
        )}
        {item.docsUrl && (
          <a
            href={item.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground border border-border hover:text-foreground"
          >
            Docs
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function OrbitPaidServicesHub({
  configuredKeys: configuredKeysProp,
  aiConfigured: aiConfiguredProp,
  aiProviderLabel: aiProviderLabelProp,
  gscConnected: gscConnectedProp,
  gscPropertyOk: gscPropertyOkProp,
  indexNowActive: indexNowActiveProp,
  showFreeFallback = false,
  defaultExpanded = true,
  onPasteKey,
  copyOnlyMode = false,
  className = "",
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [configuredKeys, setConfiguredKeys] = useState<Record<string, boolean>>(
    configuredKeysProp ?? {},
  );
  const [aiConfigured, setAiConfigured] = useState(aiConfiguredProp ?? false);
  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(
    aiProviderLabelProp ?? null,
  );
  const [gscConnected, setGscConnected] = useState(gscConnectedProp ?? false);
  const [gscPropertyOk, setGscPropertyOk] = useState(gscPropertyOkProp ?? false);
  const [hasServiceAccount, setHasServiceAccount] = useState(false);
  const [indexNowActive, setIndexNowActive] = useState(indexNowActiveProp ?? false);
  // Default to the $0 path — paid services are opt-in, not the starting point.
  const [freeOnly, setFreeOnly] = useState(true);

  useEffect(() => {
    if (configuredKeysProp) setConfiguredKeys(configuredKeysProp);
    if (aiConfiguredProp !== undefined) setAiConfigured(aiConfiguredProp);
    if (aiProviderLabelProp !== undefined) setAiProviderLabel(aiProviderLabelProp);
    if (gscConnectedProp !== undefined) setGscConnected(gscConnectedProp);
    if (gscPropertyOkProp !== undefined) setGscPropertyOk(gscPropertyOkProp);
    if (indexNowActiveProp !== undefined) setIndexNowActive(indexNowActiveProp);
  }, [
    configuredKeysProp,
    aiConfiguredProp,
    aiProviderLabelProp,
    gscConnectedProp,
    gscPropertyOkProp,
    indexNowActiveProp,
  ]);

  useEffect(() => {
    if (configuredKeysProp && aiConfiguredProp !== undefined && gscConnectedProp !== undefined) {
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const [autoR, gscR, statusR] = await Promise.all([
          authFetch("/api/orbit/marketing-autopilot"),
          authFetch("/api/gsc/diagnose"),
          authFetch("/api/orbit/status"),
        ]);
        if (!alive) return;
        if (autoR.ok) {
          const j = (await autoR.json()) as {
            ai?: { configured?: boolean; providerLabel?: string };
            status?: { configured?: Record<string, boolean> };
          };
          if (j.ai?.configured) setAiConfigured(true);
          if (j.ai?.providerLabel) setAiProviderLabel(j.ai.providerLabel);
          if (j.status?.configured) setConfiguredKeys(j.status.configured);
        }
        if (gscR.ok) {
          const g = (await gscR.json()) as {
            oauthConnected?: boolean;
            gscPropertyOk?: boolean;
            serviceAccountEmail?: string | null;
          };
          setGscConnected(!!g.oauthConnected);
          setGscPropertyOk(!!g.gscPropertyOk);
          setHasServiceAccount(!!g.serviceAccountEmail);
        }
        if (statusR.ok) {
          const s = (await statusR.json()) as { indexNowKey?: boolean };
          if (s.indexNowKey) setIndexNowActive(true);
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      alive = false;
    };
  }, [configuredKeysProp, aiConfiguredProp, gscConnectedProp]);

  const isReady = (item: OrbitServiceItem): boolean => {
    if (item.id === "gsc-oauth") return gscConnected && gscPropertyOk;
    if (item.id === "gsc-service-account")
      return hasServiceAccount || (gscConnected && gscPropertyOk);
    if (item.id === "indexnow") return indexNowActive;
    if (item.id === "bing-webmaster") return indexNowActive;
    if (item.envKey === "OPENAI_API_KEY") return aiConfigured;
    if (item.envKey === "GEMINI_API_KEY") return aiConfigured && !configuredKeys.openai;
    if (item.envKey === "NEXT_PUBLIC_CLARITY_ID") {
      return !!(
        typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_CLARITY_ID?.trim() &&
        process.env.NEXT_PUBLIC_CLARITY_ID !== "undefined"
      );
    }
    if (item.credentialKey) return !!configuredKeys[item.credentialKey];
    return false;
  };

  const paidServices = useMemo(() => {
    // Free-tier options live alongside the paid ones in each category so the
    // cheaper route is visible at the point of decision.
    const all = [...ORBIT_PAID_SERVICES, ...ORBIT_FREE_STACK_SERVICES];
    const base = copyOnlyMode
      ? all.filter((s) => !new Set(["n8n", "ayrshare", "resend", "omnisocials"]).has(s.id))
      : all;
    return freeOnly ? base.filter(isOrbitFreeTierService) : base;
  }, [copyOnlyMode, freeOnly]);

  const freeStackSteps = useMemo(() => orbitFreeStackServices(), []);
  const freeStackReady = freeStackSteps.filter((s) => isReady(s.item)).length;

  const bestStackSteps = useMemo(() => {
    if (!copyOnlyMode) return ORBIT_BEST_STACK;
    const keep = new Set(["gsc-oauth", "openai", "clarity"]);
    return ORBIT_BEST_STACK.filter((s) => keep.has(s.id));
  }, [copyOnlyMode]);

  const bestStackReady = bestStackSteps.filter((s) => {
    const item = orbitServiceById(s.id);
    return item ? isReady(item) : false;
  }).length;

  const paidReadyCount = paidServices.filter((s) => isReady(s)).length;
  const indexingReadyCount = ORBIT_INDEXING_SERVICES.filter((s) => isReady(s)).length;
  const analyticsReadyCount = ORBIT_ANALYTICS_SERVICES.filter((s) => isReady(s)).length;

  const paidByCategory = useMemo(() => {
    const groups: Record<string, OrbitServiceItem[]> = {};
    for (const s of paidServices) {
      (groups[s.category] ??= []).push(s);
    }
    return groups;
  }, [paidServices]);

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden ${className}`}
      style={{
        borderColor: `${TEAL}44`,
        background: `linear-gradient(135deg, ${TEAL}08, ${BURG}05)`,
      }}
      id="orbit-paid-services"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: TEAL }} />
          <div>
            <p className="text-sm font-black text-foreground leading-tight">
              {copyOnlyMode
                ? "Automated stack — GPT + Google indexing"
                : "Service setup — free $0 path, paid picks & indexing"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              $0 path: {freeStackReady}/{freeStackSteps.length} · Best picks: {bestStackReady}/
              {bestStackSteps.length} · Google: {indexingReadyCount}/
              {ORBIT_INDEXING_SERVICES.length} · Services: {paidReadyCount}/{paidServices.length}
              {aiProviderLabel ? ` · AI: ${aiProviderLabel}` : ""}
              {copyOnlyMode ? " · Auto-post off" : ""}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40">
          {/* $0 path — complete Orbit + SEO on permanent free tiers only */}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/8 p-2.5 space-y-2 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-200">
                Complete Orbit + SEO for $0 ({freeStackReady}/{freeStackSteps.length})
              </p>
              <button
                type="button"
                onClick={() => setFreeOnly((v) => !v)}
                aria-pressed={freeOnly}
                className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                  freeOnly
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-200"
                    : "border-border text-muted-foreground"
                }`}
                data-testid="button-orbit-free-only"
              >
                {freeOnly ? "Show paid options" : "Hide paid services"}
              </button>
            </div>
            <p className="text-[10px] text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed">
              Every step below is a permanent free tier, a free Google/Bing API, or open-source
              software you self-host — no trials and no card. Follow it in order and Orbit runs end
              to end, including auto-posting, at no subscription cost.
            </p>
            <ol className="space-y-1.5">
              {freeStackSteps.map((entry) => {
                const ready = isReady(entry.item);
                return (
                  <li key={entry.item.id} className="flex items-start gap-2 text-[10px]">
                    {ready ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-center font-black text-emerald-500/80">
                        {entry.step}
                      </span>
                    )}
                    <span className="text-muted-foreground leading-snug">
                      <strong className="text-foreground">{entry.item.name}</strong>
                      {" — "}
                      {entry.why}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Best stack roadmap — hidden while the $0 path is the focus */}
          {!freeOnly && (
            <div className="rounded-xl border border-teal-500/35 bg-teal-500/8 p-2.5 space-y-2 pt-3">
              <p className="text-[11px] font-black text-teal-200">
                Recommended stack (best results, paid)
              </p>
              <ol className="space-y-1.5">
                {bestStackSteps.map((entry) => {
                  const item = orbitServiceById(entry.id);
                  const ready = item ? isReady(item) : false;
                  return (
                    <li key={entry.id} className="flex items-start gap-2 text-[10px]">
                      {ready ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-center font-black text-teal-400/80">
                          {entry.step}
                        </span>
                      )}
                      <span className="text-muted-foreground leading-snug">
                        <strong className="text-foreground">{item?.name ?? entry.id}</strong>
                        {" — "}
                        {entry.why}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Google indexing — NOT AI */}
          <div className="rounded-xl border border-sky-500/35 bg-sky-500/8 p-2.5 space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <p className="text-[11px] font-black text-sky-200">
                {ORBIT_SERVICE_CATEGORY_LABELS.indexing}
              </p>
            </div>
            <p className="text-[10px] text-sky-100/80 leading-relaxed">
              <strong>No AI service indexes Google.</strong> OpenAI, Gemini, and OmniSocials do not
              submit URLs to Google. Use free Google Search Console + optional service account
              below. IndexNow only covers Bing/Yandex.
            </p>
            <div className="space-y-2">
              {ORBIT_INDEXING_SERVICES.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  ready={isReady(item)}
                  onPasteKey={onPasteKey}
                />
              ))}
            </div>
          </div>

          {/* Service categories — a category with nothing left after filtering
              would otherwise render as a bare heading. */}
          {(["automation", "ai-marketing", "distribution"] as const)
            .filter((cat) => (paidByCategory[cat] ?? []).length > 0)
            .map((cat) => (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  {cat === "ai-marketing" ? (
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  ) : cat === "automation" ? (
                    <CreditCard className="w-4 h-4 text-teal-400" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-violet-400" />
                  )}
                  <p className="text-[11px] font-black text-foreground">
                    {ORBIT_SERVICE_CATEGORY_LABELS[cat]}
                  </p>
                </div>
                {cat === "automation" && (
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Orbit sends a JSON payload to your n8n webhook after each autopilot run — social
                    posts, outreach pitches, directories, and indexing stats. Wire OmniSocials,
                    Resend, Slack, or CRM nodes inside n8n instead of pasting keys here.
                  </p>
                )}
                <div className="space-y-2">
                  {(paidByCategory[cat] ?? []).map((item) => (
                    <ServiceRow
                      key={item.id}
                      item={item}
                      ready={isReady(item)}
                      onPasteKey={onPasteKey}
                    />
                  ))}
                </div>
              </div>
            ))}

          {/* Analytics */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-foreground">
              {ORBIT_SERVICE_CATEGORY_LABELS.analytics}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {analyticsReadyCount}/{ORBIT_ANALYTICS_SERVICES.length} ready — measure what converts
              after Orbit drives traffic.
            </p>
            <div className="space-y-2">
              {ORBIT_ANALYTICS_SERVICES.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  ready={isReady(item)}
                  onPasteKey={onPasteKey}
                />
              ))}
            </div>
          </div>

          {/* Gemini is step 4 of the $0 path, so its setup must be reachable there. */}
          {(showFreeFallback || freeOnly) && (
            <div className="space-y-2 opacity-90">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {ORBIT_SERVICE_CATEGORY_LABELS["free-fallback"]}
              </p>
              {ORBIT_FREE_FALLBACK_SERVICES.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  ready={isReady(item)}
                  onPasteKey={onPasteKey}
                />
              ))}
            </div>
          )}

          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {freeOnly
              ? "Free tiers only — nothing here needs a card. Keys live server-side only; redeploy if you set one as a Vercel env var."
              : "Pay links work with Apple Pay in Safari. Keys live server-side only. After each paid service, redeploy if you used Vercel env vars."}
          </p>
        </div>
      )}
    </div>
  );
}
