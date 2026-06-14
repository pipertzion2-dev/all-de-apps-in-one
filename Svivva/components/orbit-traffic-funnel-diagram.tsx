"use client";

/**
 * Visual traffic funnel — mini apps → SEO → Svivva → iOS (coming soon).
 * Used on Orbit admin and Seeds marketing sections.
 */

import Link from "next/link";
import { ArrowRight, Globe, Package, Rocket, Smartphone, Sparkles } from "lucide-react";

type Props = {
  compact?: boolean;
  showIos?: boolean;
  className?: string;
};

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

export function OrbitTrafficFunnelDiagram({
  compact = false,
  showIos = true,
  className = "",
}: Props) {
  const nodes = [
    {
      id: "tools",
      icon: Package,
      title: "Free mini-apps",
      desc: "Scanners, calculators, security tools",
      color: TEAL,
    },
    {
      id: "seo",
      icon: Globe,
      title: "SEO landing pages",
      desc: "IndexNow · sitemaps · comparisons · blog",
      color: "#0ea5e9",
    },
    {
      id: "svivva",
      icon: Sparkles,
      title: "Svivva signup",
      desc: "Seeds deploy · API builder · Play",
      color: BURG,
    },
    ...(showIos
      ? [
          {
            id: "ios",
            icon: Smartphone,
            title: "Svivva iOS",
            desc: "Coming soon — same account, native app",
            color: "#a78bfa",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden ${className}`}
    >
      <div
        className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: `linear-gradient(135deg, ${BURG}12, ${TEAL}12)` }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Orbit traffic funnel
          </p>
          <p className="text-sm font-semibold text-foreground">
            How free tools become paying Svivva users
          </p>
        </div>
        <Link
          href="/dashboard/orbit"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
        >
          Open Orbit <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className={`p-4 ${compact ? "space-y-3" : "p-5 sm:p-6 space-y-4"}`}>
        {/* Desktop flow */}
        <div className="hidden md:flex items-stretch gap-2">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="flex items-center flex-1 min-w-0 gap-2">
                <div
                  className="flex-1 min-w-0 rounded-xl border-2 p-3 text-center"
                  style={{ borderColor: `${node.color}44`, background: `${node.color}0a` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center"
                    style={{ background: `${node.color}22` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: node.color }} />
                  </div>
                  <p className="text-xs font-bold text-foreground leading-tight">{node.title}</p>
                  {!compact && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                      {node.desc}
                    </p>
                  )}
                </div>
                {i < nodes.length - 1 && (
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile stack */}
        <div className="md:hidden space-y-2">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id}>
                <div
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: `${node.color}44`, background: `${node.color}0a` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${node.color}22` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: node.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{node.title}</p>
                    <p className="text-xs text-muted-foreground">{node.desc}</p>
                  </div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="w-4 h-4 rotate-90 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Orbit automation rail */}
        <div
          className="rounded-xl border border-dashed px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: `${TEAL}55`, background: `${TEAL}08` }}
        >
          <Rocket className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Orbit automates every step</strong> — credentials,
            Index 22 SEO, social packs, directory submissions, and mini-app page generation. One
            admin surface for svivva.com + all connected apps.
          </p>
        </div>
      </div>
    </div>
  );
}
