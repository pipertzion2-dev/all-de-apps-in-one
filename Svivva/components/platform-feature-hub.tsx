"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, Sprout, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  HAAS_FULL_NAME,
  HAAS_NAME,
  HAAS_TAGLINE,
  HAAS_TECHNICAL_BLURB,
  PLATFORM_FEATURES,
} from "@/lib/platform/feature-graph";
import type { FeatureSuggestionResult } from "@/lib/platform/feature-suggestions";

const PRESET_GOALS = [
  "Turn my PDF into multiple apps and launch them",
  "Get more traffic for my SaaS",
  "Protect sketches as a group patent",
  "Build an API and ship with evals",
  "Watch Starter Story and apply their tactics",
];

type PlatformFeatureHubProps = {
  variant?: "home" | "compact";
};

export function PlatformFeatureHub({ variant = "home" }: PlatformFeatureHubProps) {
  const [goal, setGoal] = useState(PRESET_GOALS[0]);
  const [result, setResult] = useState<FeatureSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layers = useMemo(() => {
    const order = ["seed", "build", "hybrid", "grow", "protect", "play"] as const;
    return order.map((layer) => ({
      layer,
      features: PLATFORM_FEATURES.filter((f) => f.layer === layer && !f.adminOnly),
    }));
  }, []);

  const suggest = useCallback(async () => {
    const trimmed = goal.trim();
    if (trimmed.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not suggest features");
      setResult(data as FeatureSuggestionResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [goal]);

  const isCompact = variant === "compact";

  return (
    <section
      id="haas"
      className={
        isCompact
          ? "space-y-4"
          : "py-14 sm:py-20 border-b border-[#5B8DA8]/20 bg-gradient-to-b from-background via-[#5B8DA8]/5 to-background"
      }
    >
      <div className={isCompact ? "" : "max-w-6xl mx-auto px-4 sm:px-6 space-y-10"}>
        {!isCompact && (
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge className="bg-[#5B8DA8]/15 text-[#5B8DA8] border-[#5B8DA8]/30">
              {HAAS_NAME} · {HAAS_FULL_NAME}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
              <Network className="w-8 h-8 text-[#5B8DA8]" />
              Hybridization connects everything.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">{HAAS_TAGLINE}</p>
            <p className="text-xs sm:text-sm text-[#5B8DA8] font-medium">{HAAS_TECHNICAL_BLURB}</p>
          </div>
        )}

        <Card className="border-[#5B8DA8]/30 bg-card/90 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-[#5B8DA8]" />
              AI-powered feature routing
            </div>
            <p className="text-xs text-muted-foreground">
              Describe what you want — <strong>HaaS</strong> suggests which ZZAI features to open and
              in what order. Often starts with <strong>ZZAI Seeds</strong> when you need many apps
              from one document.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_GOALS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={goal === g ? "default" : "outline"}
                  className="text-xs h-auto py-1.5 whitespace-normal text-left max-w-full"
                  onClick={() => setGoal(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want to build, launch, or protect?"
                className="flex-1"
              />
              <Button
                onClick={() => void suggest()}
                disabled={loading || goal.trim().length < 3}
                className="gap-2 bg-[#5B8DA8] shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Suggest path
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {result && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <p className="text-sm">{result.summary}</p>
                {result.workflow.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Suggested flow: {result.workflow.join(" → ")}
                  </p>
                )}
                <ul className="space-y-2">
                  {result.suggestions.map((s) => (
                    <li key={s.featureId}>
                      <Link
                        href={s.href}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/60 p-3 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-[#5B8DA8]">
                            {s.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-[#5B8DA8]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {result.aiUsed && (
                  <p className="text-[10px] text-muted-foreground">AI-routed workflow</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!isCompact && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {layers.map(({ layer, features }) =>
              features.length ? (
                <div
                  key={layer}
                  className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {layer}
                  </p>
                  <ul className="space-y-1.5">
                    {features.map((f) => (
                      <li key={f.id}>
                        <Link
                          href={f.href}
                          className="text-sm hover:text-[#5B8DA8] flex items-center gap-1.5"
                        >
                          {f.id === "seeds" && <Sprout className="w-3.5 h-3.5" />}
                          {f.shortTitle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    </section>
  );
}
