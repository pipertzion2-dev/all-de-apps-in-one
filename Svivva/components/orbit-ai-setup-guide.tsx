"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, ExternalLink, Sparkles } from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import {
  ORBIT_AI_SETUP_FOOTNOTE,
  ORBIT_AI_SETUP_HEADLINE,
  ORBIT_AI_SETUP_STEPS,
} from "@/lib/orbit/orbit-ai-setup-guide";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

type AiStatus = {
  configured?: boolean;
  provider?: string;
  providerLabel?: string;
};

type Props = {
  /** Start expanded when AI is not configured */
  defaultExpanded?: boolean;
  className?: string;
};

export function OrbitAiSetupGuide({ defaultExpanded = true, className = "" }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [ai, setAi] = useState<AiStatus | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await authFetch("/api/orbit/marketing-autopilot");
        if (!r.ok || !alive) return;
        const json = (await r.json()) as { ai?: AiStatus };
        if (json.ai) setAi(json.ai);
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ready = !!ai?.configured;
  const label = ai?.providerLabel || (ready ? "Connected" : "Not connected");

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden ${className}`}
      style={{
        borderColor: ready ? `${TEAL}55` : `${BURG}44`,
        background: ready
          ? `linear-gradient(135deg, ${TEAL}0c, ${BURG}06)`
          : `linear-gradient(135deg, ${BURG}0a, ${TEAL}05)`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: TEAL }} />
          <div className="min-w-0">
            <p className="text-xs font-black text-foreground leading-tight">
              {ORBIT_AI_SETUP_HEADLINE}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Marketing AI:{" "}
              <strong
                className={
                  ready
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-300"
                }
              >
                {label}
              </strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {ready ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground" />
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50">
          <ol className="space-y-2 pt-2">
            {ORBIT_AI_SETUP_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-lg border border-border/50 bg-card/50 px-2.5 py-2"
              >
                <p className="text-[11px] font-bold text-foreground">
                  {i + 1}. {step.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {step.body}
                </p>
                {"links" in step && step.links?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {step.links.map((link) =>
                      link.href.startsWith("/") ? (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#5B8DA8]/40 text-[#5B8DA8]"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border text-muted-foreground hover:text-foreground"
                        >
                          {link.label}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ),
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {ORBIT_AI_SETUP_FOOTNOTE}
          </p>
        </div>
      )}
    </div>
  );
}
