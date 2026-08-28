"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, KeyRound } from "lucide-react";
import { ORBIT_SETUP_PROVIDERS } from "@/lib/orbit/orbit-setup-providers";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

/**
 * Best-pick services — one-tap sign-up next to the Run button. Every bestPick
 * provider is on a free tier, so this strip never sends you to a paywall.
 */
const SUBSCRIBE_PROVIDERS = ORBIT_SETUP_PROVIDERS.filter(
  (p) => p.bestPick && p.id !== "clarity",
).sort((a, b) => a.priority - b.priority);

type Props = {
  configuredKeys?: Record<string, boolean>;
  aiConfigured?: boolean;
  onPasteKey?: (credentialKey: string) => void;
  className?: string;
};

function isProviderReady(
  p: (typeof SUBSCRIBE_PROVIDERS)[number],
  configuredKeys: Record<string, boolean>,
  aiConfigured: boolean,
): boolean {
  if (p.envKey === "OPENAI_API_KEY") return aiConfigured;
  if (p.credentialKey) return !!configuredKeys[p.credentialKey];
  return false;
}

export function OrbitSubscribeQuickStrip({
  configuredKeys = {},
  aiConfigured = false,
  onPasteKey,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-2 ${className}`}
      aria-label="Set up free marketing services"
    >
      <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-200 leading-tight">
        Free setup — no card needed
      </p>
      <p className="text-[9px] text-muted-foreground leading-snug">
        Each of these has a permanent free tier. Paste keys below or in Platform Secrets.
      </p>

      <ul className="space-y-1.5">
        {SUBSCRIBE_PROVIDERS.map((p) => {
          const ready = isProviderReady(p, configuredKeys, aiConfigured);
          return (
            <li key={p.id}>
              <div className="flex items-center gap-1.5 min-w-0">
                {ready ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-violet-400/40 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-foreground truncate">{p.name}</p>
                  <p className="text-[8px] text-muted-foreground truncate">{p.priceLabel}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1 pl-[18px]">
                <a
                  href={p.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg,${TEAL},${BURG})` }}
                >
                  {p.id === "openai" ? "Add billing" : "Get free key"}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {p.credentialKey && onPasteKey && (
                  <button
                    type="button"
                    onClick={() => onPasteKey(p.credentialKey!)}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-semibold border border-violet-500/40 text-violet-300"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    Paste key
                  </button>
                )}
                {p.envKey === "OPENAI_API_KEY" && (
                  <Link
                    href="/dashboard/settings/runtime-keys"
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-semibold border border-[#5B8DA8]/40 text-[#5B8DA8]"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    Secrets
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/dashboard/settings/runtime-keys"
        className="block text-center text-[9px] font-semibold text-[#5B8DA8] hover:underline pt-0.5"
      >
        Platform Secrets — paste all API keys →
      </Link>
    </div>
  );
}
