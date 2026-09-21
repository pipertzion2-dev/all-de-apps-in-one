"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatPatchRoute,
  getFeaturesByBus,
  MIXING_BUSES,
  OAAS_NAME,
  OAAS_TAGLINE,
  type MixingBusId,
} from "@/lib/platform/feature-graph";
import type { FeatureSuggestionResult } from "@/lib/platform/feature-suggestions";

const CamoThreeOverlay = dynamic(
  () => import("@/components/camo-three-overlay").then((m) => m.CamoThreeOverlay),
  { ssr: false },
);

const PRESET_SCENES = [
  "Turn my PDF into multiple apps and launch them",
  "Transcribe a YouTube video into deployable apps",
  "Get more traffic for my SaaS",
  "Blend Seeds with Protect then hybridize that blend with Play",
  "Build an API and ship with evals",
  "Watch Starter Story and apply their tactics",
  "Protect my education and document a school rights issue",
  "I need help now with a crisis and verified resources",
] as const;

type PlatformFeatureHubProps = {
  variant?: "home" | "compact";
  /** When true, flower/camo background is rendered by a parent wrapper (homepage). */
  hideBackground?: boolean;
  /** Collapse channel strip / subgroup bus grid by default (homepage keeps patch bay primary). */
  hideChannelStrips?: boolean;
};

type BusChannelGroup = {
  bus: (typeof MIXING_BUSES)[number];
  channels: ReturnType<typeof getFeaturesByBus>;
};

type BusFilter = "all" | MixingBusId;

const ChannelLink = memo(function ChannelLink({
  channelLabel,
  shortTitle,
  href,
}: {
  channelLabel: string;
  shortTitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-baseline gap-2 py-1 text-sm text-foreground/90 hover:text-[#5B8DA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8] rounded-sm"
    >
      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
        {channelLabel}
      </span>
      <span>{shortTitle}</span>
    </Link>
  );
});

function BusOverviewFilter({
  value,
  onChange,
  busChannels,
}: {
  value: BusFilter;
  onChange: (next: BusFilter) => void;
  busChannels: BusChannelGroup[];
}) {
  const groupId = useId();
  return (
    <div
      role="tablist"
      aria-label="Filter channels by bus"
      className="flex flex-wrap gap-x-3 gap-y-1 border-b border-border/40 pb-2"
    >
      <button
        type="button"
        role="tab"
        id={`${groupId}-all`}
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={`text-xs tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8] ${
          value === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>
      {busChannels.map(({ bus }) => (
        <button
          key={bus.id}
          type="button"
          role="tab"
          id={`${groupId}-${bus.id}`}
          aria-selected={value === bus.id}
          onClick={() => onChange(bus.id)}
          className={`text-xs tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8] ${
            value === bus.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {bus.label.replace(" Bus", "")}
        </button>
      ))}
    </div>
  );
}

const ChannelStripGrid = memo(function ChannelStripGrid({
  busChannels,
  filter,
}: {
  busChannels: BusChannelGroup[];
  filter: BusFilter;
}) {
  const visible = useMemo(
    () => (filter === "all" ? busChannels : busChannels.filter((g) => g.bus.id === filter)),
    [busChannels, filter],
  );

  return (
    <div className="space-y-6">
      {visible.map(({ bus, channels }) => (
        <div key={bus.id} className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {bus.label}
          </p>
          <ul className="grid gap-1 sm:grid-cols-2" role="list">
            {channels.map((f) => (
              <li key={f.id} role="listitem">
                <ChannelLink
                  channelLabel={f.channelLabel}
                  shortTitle={f.shortTitle}
                  href={f.href}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});

export function PlatformFeatureHub({
  variant = "home",
  hideBackground = false,
  hideChannelStrips = false,
}: PlatformFeatureHubProps) {
  const [goal, setGoal] = useState<string>("");
  const [result, setResult] = useState<FeatureSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busFilter, setBusFilter] = useState<BusFilter>("all");
  const [stripsOpen, setStripsOpen] = useState(!hideChannelStrips);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!result) return;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    resultsRef.current?.focus();
  }, [result]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void suggest();
    },
    [suggest],
  );

  const isCompact = variant === "compact";

  const channelsBlock = (
    <div className="space-y-4">
      <BusOverviewFilter value={busFilter} onChange={setBusFilter} busChannels={busChannels} />
      <ChannelStripGrid busChannels={busChannels} filter={busFilter} />
    </div>
  );

  return (
    <section
      id="oaas"
      aria-labelledby={isCompact ? undefined : "oaas-heading"}
      className={
        isCompact
          ? "space-y-6"
          : hideBackground
            ? "py-16 sm:py-24 relative"
            : "py-16 sm:py-24 relative overflow-hidden min-h-[480px]"
      }
    >
      {!isCompact && !hideBackground && (
        <div
          className="absolute inset-x-0 top-0 h-[100svh] md:inset-0 md:h-full pointer-events-none z-0 overflow-hidden select-none opacity-40"
          aria-hidden
        >
          <CamoThreeOverlay preset="oaas" eagerMount keepMounted />
        </div>
      )}

      <div
        className={
          isCompact ? "space-y-8" : "max-w-2xl mx-auto px-4 sm:px-6 space-y-10 relative z-10"
        }
      >
        {!isCompact && (
          <header className="space-y-3 text-center sm:text-left">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#5B8DA8]">{OAAS_NAME}</p>
            <h2 id="oaas-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Mixing console
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">{OAAS_TAGLINE}</p>
          </header>
        )}

        <form onSubmit={onSubmit} className="space-y-4" aria-label="Patch bay">
          <label htmlFor="oaas-goal" className="sr-only">
            Describe your mix
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Input
              id="oaas-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe what you want to ship…"
              className="flex-1 h-11 border-0 border-b border-border/70 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-[#5B8DA8]"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={loading || goal.trim().length < 3}
              className="h-11 shrink-0 bg-[#5B8DA8] px-6"
              data-testid="button-patch-route"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
              Patch route
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] text-muted-foreground">Try</span>
            {PRESET_SCENES.slice(0, 3).map((scene) => (
              <button
                key={scene}
                type="button"
                onClick={() => setGoal(scene)}
                className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8]"
              >
                {scene.length > 36 ? `${scene.slice(0, 34)}…` : scene}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div
            ref={resultsRef}
            tabIndex={-1}
            className="space-y-4 outline-none"
            aria-live="polite"
            data-testid="patch-route-result"
          >
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            {result.workflow.length > 0 && (
              <p className="text-xs font-mono text-foreground/80">
                {formatPatchRoute(result.workflow)}
              </p>
            )}
            <ol className="space-y-0 divide-y divide-border/40">
              {result.suggestions.map((s, i) => (
                <li key={s.featureId}>
                  <Link
                    href={s.href}
                    className="flex items-start justify-between gap-3 py-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-[#5B8DA8]">
                        <span className="font-mono text-[10px] text-muted-foreground mr-2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 pl-7">{s.reason}</p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground group-hover:text-[#5B8DA8]"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isCompact &&
          (hideChannelStrips ? (
            <Collapsible open={stripsOpen} onOpenChange={setStripsOpen} className="group">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8]"
                  data-testid="toggle-channel-strips"
                >
                  <span className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Channels
                  </span>
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pb-1">{channelsBlock}</CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Channels
              </p>
              {channelsBlock}
            </div>
          ))}
      </div>
    </section>
  );
}
