"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Radio, SlidersHorizontal, Sparkles, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CREST_BUS,
  formatPatchRoute,
  getFeaturesByBus,
  MASTER_BUS,
  MIXING_BUSES,
  OAAS_FULL_NAME,
  OAAS_NAME,
  OAAS_TAGLINE,
  OAAS_TECHNICAL_BLURB,
  PATCH_BAY,
  SIGNAL_BUS,
} from "@/lib/platform/feature-graph";
import type { FeatureSuggestionResult } from "@/lib/platform/feature-suggestions";

const PRESET_SCENES = [
  "Turn my PDF into multiple apps and launch them",
  "Get more traffic for my SaaS",
  "Protect sketches as a group patent",
  "Build an API and ship with evals",
  "Watch Starter Story and apply their tactics",
];

type PlatformFeatureHubProps = {
  variant?: "home" | "compact";
};

function ChannelStrip({
  channelLabel,
  shortTitle,
  href,
  mainBus,
  isSeeds,
}: {
  channelLabel: string;
  shortTitle: string;
  href: string;
  mainBus: "signal" | "crest" | "both";
  isSeeds?: boolean;
}) {
  const busTint =
    mainBus === "crest"
      ? "border-[#D94F9C]/40"
      : mainBus === "both"
        ? "border-[#5B8DA8]/50"
        : "border-[#5B8DA8]/30";

  return (
    <Link
      href={href}
      className={`group flex flex-col items-center gap-1 rounded-lg border bg-card/80 px-2 py-3 min-w-[4.5rem] hover:bg-muted/50 transition-colors ${busTint}`}
    >
      <span className="text-[9px] font-mono text-muted-foreground tracking-wider">
        {channelLabel}
      </span>
      <div className="w-1.5 h-10 rounded-full bg-gradient-to-t from-[#5B8DA8]/20 to-[#5B8DA8]/70 group-hover:from-[#5B8DA8]/40 group-hover:to-[#5B8DA8]" />
      <span className="text-[10px] font-semibold text-center leading-tight flex items-center gap-0.5">
        {isSeeds && <Sprout className="w-3 h-3 text-[#5B8DA8]" />}
        {shortTitle}
      </span>
      <span className="text-[8px] uppercase tracking-widest text-muted-foreground">
        {mainBus === "both" ? "L/R" : mainBus === "crest" ? "Crest" : "Signal"}
      </span>
    </Link>
  );
}

export function PlatformFeatureHub({ variant = "home" }: PlatformFeatureHubProps) {
  const [goal, setGoal] = useState(PRESET_SCENES[0]);
  const [result, setResult] = useState<FeatureSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busChannels = useMemo(
    () =>
      MIXING_BUSES.map((bus) => ({
        bus,
        channels: getFeaturesByBus(bus.id),
      })).filter((g) => g.channels.length > 0),
    [],
  );

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
      if (!res.ok) throw new Error(data.error || "Could not patch route");
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
      id="oaas"
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
              {OAAS_NAME} · {OAAS_FULL_NAME}
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
              <SlidersHorizontal className="w-8 h-8 text-[#5B8DA8]" />
              The mixing board for your stack.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">{OAAS_TAGLINE}</p>
            <p className="text-xs sm:text-sm text-[#5B8DA8] font-medium">{OAAS_TECHNICAL_BLURB}</p>
          </div>
        )}

        {!isCompact && (
          <div className="grid sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg border border-[#5B8DA8]/30 bg-card/60 p-3">
              <p className="font-bold text-[#5B8DA8]">{SIGNAL_BUS.consoleName}</p>
              <p className="text-muted-foreground mt-1">{SIGNAL_BUS.description}</p>
            </div>
            <div className="rounded-lg border border-[#D94F9C]/30 bg-card/60 p-3">
              <p className="font-bold text-[#D94F9C]">{CREST_BUS.consoleName}</p>
              <p className="text-muted-foreground mt-1">{CREST_BUS.description}</p>
            </div>
            <div className="rounded-lg border border-amber-500/40 bg-card/60 p-3">
              <p className="font-bold text-amber-600 dark:text-amber-400">
                {MASTER_BUS.consoleName}
              </p>
              <p className="text-muted-foreground mt-1">{MASTER_BUS.description}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Out: {MASTER_BUS.outputs.join(" · ")}
              </p>
            </div>
          </div>
        )}

        <Card className="border-[#5B8DA8]/30 bg-card/90 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Radio className="w-4 h-4 text-[#5B8DA8]" />
              {PATCH_BAY.label} — AI patch routing
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your mix — <strong>OaaS</strong> patches channel order and bus sends. Often
              unmutes <strong>CH 01 · Seeds</strong> when you need many apps from one document, then
              sends to <strong>Master</strong> via Launch.
            </p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Scene recall
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENES.map((g) => (
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
                placeholder="What channels should be in the mix?"
                className="flex-1 font-mono text-sm"
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
                Patch route
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {result && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <p className="text-sm">{result.summary}</p>
                {result.workflow.length > 0 && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Patch: {formatPatchRoute(result.workflow)}
                  </p>
                )}
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={s.featureId}>
                      <Link
                        href={s.href}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/60 p-3 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-[#5B8DA8]">
                            <span className="font-mono text-[10px] text-muted-foreground mr-2">
                              Step {i + 1}
                            </span>
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
                  <p className="text-[10px] text-muted-foreground font-mono">AI patch matrix</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!isCompact && (
          <div className="space-y-6">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
              Channel strips · subgroup buses
            </p>
            {busChannels.map(({ bus, channels }) => (
              <div key={bus.id} className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-2 px-1">
                  <span className="text-xs font-bold text-[#5B8DA8]">{bus.consoleName}</span>
                  <span className="text-[10px] text-muted-foreground">{bus.description}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {channels.map((f) => (
                    <ChannelStrip
                      key={f.id}
                      channelLabel={f.channelLabel}
                      shortTitle={f.shortTitle}
                      href={f.href}
                      mainBus={f.mainBus}
                      isSeeds={f.id === "seeds"}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-card/80 to-amber-500/5 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {MASTER_BUS.consoleName} — {MASTER_BUS.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{MASTER_BUS.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MASTER_BUS.outputs.map((out) => (
                    <Badge key={out} variant="outline" className="text-[10px] border-amber-500/40">
                      {out}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
