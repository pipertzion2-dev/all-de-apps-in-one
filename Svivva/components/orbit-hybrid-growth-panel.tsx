"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HYBRID_GTM_STRATEGIES, type HybridGtmMotion } from "@/lib/orbit/hybrid-gtm-strategies";
import { ADMIN_DEFAULT_YOUTUBE_HANDLE } from "@/lib/marketing/youtube-defaults";

const MOTION_LABELS: Record<HybridGtmMotion, string> = {
  plg: "PLG",
  pls: "Hybrid PLS",
  clg: "Community",
  aeo: "AEO / SEO",
  funnel: "Free tools funnel",
};

const MOTION_COLORS: Record<HybridGtmMotion, string> = {
  plg: "#5B8DA8",
  pls: "#6B2C4E",
  clg: "#9c27b0",
  aeo: "#2e7d32",
  funnel: "#e65100",
};

type Props = {
  compact?: boolean;
};

export function OrbitHybridGrowthPanel({ compact = false }: Props) {
  const featured = useMemo(() => HYBRID_GTM_STRATEGIES.slice(0, compact ? 3 : 6), [compact]);

  return (
    <Card className="border-2 border-[#5B8DA8]/30 bg-gradient-to-br from-[#5B8DA8]/5 to-[#6B2C4E]/5">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-[#5B8DA8]" />
              Hybrid growth playbook (2026)
            </CardTitle>
            <CardDescription className="mt-1">
              PLG entry + answer-shaped SEO + {ADMIN_DEFAULT_YOUTUBE_HANDLE} intel — wired into
              Orbit and admin marketing.
            </CardDescription>
          </div>
          {!compact && (
            <Link
              href="/dashboard/marketing/channel-intel"
              className="text-xs font-semibold text-[#5B8DA8] hover:underline flex items-center gap-1 flex-shrink-0"
            >
              Channel Intel
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {featured.map((strategy) => (
            <div
              key={strategy.id}
              className="rounded-xl border border-border/80 bg-card/80 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{strategy.title}</p>
                <Badge
                  variant="outline"
                  className="text-[10px] flex-shrink-0"
                  style={{
                    borderColor: `${MOTION_COLORS[strategy.motion]}55`,
                    color: MOTION_COLORS[strategy.motion],
                  }}
                >
                  {MOTION_LABELS[strategy.motion]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{strategy.summary}</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {strategy.zzaiActions.slice(0, 2).map((action) => (
                  <li key={action} className="flex gap-1.5">
                    <Sparkles
                      className="w-3 h-3 flex-shrink-0 mt-0.5"
                      style={{ color: MOTION_COLORS[strategy.motion] }}
                    />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1 pt-1">
                {strategy.metrics.slice(0, 2).map((m) => (
                  <span
                    key={m}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!compact && (
          <div className="rounded-lg border border-dashed border-[#6B2C4E]/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="w-4 h-4 text-[#6B2C4E]" />
              <span>
                Admin: StarterStory watch auto-bootstraps on Channel Intel. Orbit tasks cover AEO,
                comparisons, and social packs.
              </span>
            </div>
            <Link
              href="/dashboard/launchpad"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
            >
              Open Orbit Launchpad
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
