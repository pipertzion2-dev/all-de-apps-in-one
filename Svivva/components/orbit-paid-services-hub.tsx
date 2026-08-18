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
  ORBIT_FREE_FALLBACK_SERVICES,
  ORBIT_INDEXING_SERVICES,
  ORBIT_PAID_SERVICES,
  ORBIT_SERVICE_CATEGORY_LABELS,
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
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.purpose}</p>
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
    if (item.envKey === "OPENAI_API_KEY") return aiConfigured;
    if (item.envKey === "GEMINI_API_KEY") return aiConfigured && !configuredKeys.openai;
    if (item.credentialKey) return !!configuredKeys[item.credentialKey];
    return false;
  };

  const paidReadyCount = ORBIT_PAID_SERVICES.filter((s) => isReady(s)).length;
  const indexingReadyCount = ORBIT_INDEXING_SERVICES.filter((s) => isReady(s)).length;

  const paidByCategory = useMemo(() => {
    const groups: Record<string, OrbitServiceItem[]> = {};
    for (const s of ORBIT_PAID_SERVICES) {
      (groups[s.category] ??= []).push(s);
    }
    return groups;
  }, []);

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
              Services checklist — paid &amp; Google indexing
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Google indexing: {indexingReadyCount}/{ORBIT_INDEXING_SERVICES.length} · Paid:{" "}
              {paidReadyCount}/{ORBIT_PAID_SERVICES.length}
              {aiProviderLabel ? ` · AI: ${aiProviderLabel}` : ""}
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

          {/* Paid services */}
          {(["ai-marketing", "distribution"] as const).map((cat) => (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                {cat === "ai-marketing" ? (
                  <Sparkles className="w-4 h-4 text-violet-400" />
                ) : (
                  <CreditCard className="w-4 h-4 text-violet-400" />
                )}
                <p className="text-[11px] font-black text-foreground">
                  {ORBIT_SERVICE_CATEGORY_LABELS[cat]}
                </p>
              </div>
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

          {showFreeFallback && (
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
            Pay links work with Apple Pay in Safari. Keys live server-side only. After each paid
            service, redeploy if you used Vercel env vars.
          </p>
        </div>
      )}
    </div>
  );
}
