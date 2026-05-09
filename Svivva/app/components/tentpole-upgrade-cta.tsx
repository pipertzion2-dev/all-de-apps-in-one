"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X, Zap, Sparkles } from "lucide-react";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

interface TentpoleStickyBarProps {
  toolName: string;
  triggerAfterMs?: number;
  savingsLine?: string;
}

export function TentpoleStickyBar({
  toolName,
  triggerAfterMs = 20000,
  savingsLine,
}: TentpoleStickyBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `tentpole_dismissed_${toolName}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setVisible(true), triggerAfterMs);
    return () => clearTimeout(t);
  }, [toolName, triggerAfterMs]);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`tentpole_dismissed_${toolName}`, "1");
  };

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
      style={{ boxShadow: "0 -4px 32px rgba(91,168,160,0.15)" }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 md:px-8"
        style={{
          background: `linear-gradient(135deg, hsl(240 10% 6%), hsl(240 10% 8%))`,
          borderTop: `1px solid ${TEAL}30`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}
          >
            <Zap className="w-4 h-4" style={{ color: TEAL }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {savingsLine || `${toolName} is Step 1.`}
            </p>
            <p className="text-xs text-white/50 truncate">
              Step 2: Deploy it as a live API in Svivva — free to start.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${BURG})` }}
            data-testid="link-tentpole-sticky-cta"
          >
            Try Svivva Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            data-testid="button-tentpole-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface TentpoleBannerProps {
  headline: string;
  body: string;
  ctaText?: string;
  href?: string;
  context?: string;
}

export function TentpoleBanner({
  headline,
  body,
  ctaText = "Try Svivva Free",
  href = "/dashboard",
  context,
}: TentpoleBannerProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${TEAL}18, ${BURG}18)`,
        border: `1px solid ${TEAL}30`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, ${TEAL}, ${BURG})` }}
      />
      <div className="p-6 md:flex md:items-center md:gap-6">
        <div
          className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center mb-4 md:mb-0"
          style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}
        >
          <Sparkles className="w-6 h-6" style={{ color: TEAL }} />
        </div>
        <div className="flex-1 min-w-0">
          {context && (
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: TEAL }}
            >
              Step 1 complete · Next →
            </p>
          )}
          <h3 className="font-bold text-base text-foreground">{headline}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
        </div>
        <Link
          href={href}
          className="mt-4 md:mt-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${TEAL}, ${BURG})` }}
          data-testid="link-tentpole-banner-cta"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

interface TentpoleStepIndicatorProps {
  step: number;
  total: number;
  currentLabel: string;
  nextLabel: string;
}

export function TentpoleStepIndicator({
  step,
  total,
  currentLabel,
  nextLabel,
}: TentpoleStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
            style={
              i < step
                ? { background: `${TEAL}15`, color: TEAL, border: `1px solid ${TEAL}40` }
                : i === step
                  ? {
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }
                  : { opacity: 0.4, color: "hsl(var(--muted-foreground))" }
            }
          >
            <span>{i + 1}</span>
            <span>{i === 0 ? currentLabel : nextLabel}</span>
          </div>
          {i < total - 1 && <ArrowRight className="w-3 h-3 opacity-30" />}
        </div>
      ))}
    </div>
  );
}
