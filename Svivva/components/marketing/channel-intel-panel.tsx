"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Copy,
  Download,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Youtube,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  CHANNEL_INTEL_PRESET_QUERIES,
  MAX_CHANNEL_INTEL_VIDEOS,
  type ChannelIntelAnswer,
  type ChannelIntelCadence,
  type ChannelIntelCorpus,
  type ChannelIntelWatchPublic,
} from "@/lib/marketing/channel-intel";
import {
  ADMIN_DEFAULT_YOUTUBE_CHANNEL,
  ADMIN_DEFAULT_YOUTUBE_HANDLE,
  YOUTUBE_QUICK_CHANNELS,
} from "@/lib/marketing/youtube-defaults";
import { OrbitHybridGrowthPanel } from "@/components/orbit-hybrid-growth-panel";

const STORAGE_KEY = "zzai-channel-intel-corpus-v1";
const TEAL = "#5B8DA8";

const CADENCE_LABELS: { value: ChannelIntelCadence; label: string; hint: string }[] = [
  { value: "daily", label: "Daily", hint: "New videos + briefing every day" },
  { value: "every_3_days", label: "Every 3 days", hint: "Light refresh" },
  { value: "weekly", label: "Weekly", hint: "Sunday-style digest" },
];

function loadStoredCorpus(): ChannelIntelCorpus | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChannelIntelCorpus;
  } catch {
    return null;
  }
}

function saveCorpus(corpus: ChannelIntelCorpus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corpus));
  } catch {
    /* quota */
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleString();
}

export function ChannelIntelPanel() {
  const { toast } = useToast();
  const [channelUrl, setChannelUrl] = useState("https://www.youtube.com/@StarterStory");
  const [maxVideos, setMaxVideos] = useState(15);
  const [corpus, setCorpus] = useState<ChannelIntelCorpus | null>(null);
  const [query, setQuery] = useState<string>(CHANNEL_INTEL_PRESET_QUERIES[0]);
  const [answer, setAnswer] = useState<ChannelIntelAnswer | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [watches, setWatches] = useState<ChannelIntelWatchPublic[]>([]);
  const [cadence, setCadence] = useState<ChannelIntelCadence>("daily");
  const [watchQueries, setWatchQueries] = useState<string[]>([CHANNEL_INTEL_PRESET_QUERIES[0]]);
  const [suggestFeatures, setSuggestFeatures] = useState(true);
  const [savingWatch, setSavingWatch] = useState(false);
  const [runningWatchId, setRunningWatchId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [adminWatchReady, setAdminWatchReady] = useState<boolean | null>(null);

  const hydrate = useCallback(() => {
    const stored = loadStoredCorpus();
    if (stored) setCorpus(stored);
  }, []);

  const loadWatches = useCallback(async () => {
    try {
      const res = await authFetch("/api/marketing/channel-intel/watches");
      const data = await res.json();
      if (res.ok && Array.isArray(data.watches)) {
        setWatches(data.watches as ChannelIntelWatchPublic[]);
      }
    } catch {
      /* not signed in / no db */
    }
  }, []);

  useEffect(() => {
    hydrate();
    void loadWatches();
  }, [hydrate, loadWatches]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      try {
        const res = await authFetch("/api/marketing/channel-intel/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingestIfEmpty: true }),
        });
        const data = (await res.json()) as {
          corpus?: ChannelIntelCorpus;
          ranIngest?: boolean;
          watch?: ChannelIntelWatchPublic;
          error?: string;
        };
        if (cancelled) return;
        if (res.status === 403) {
          setAdminWatchReady(false);
          return;
        }
        if (!res.ok) return;
        setAdminWatchReady(true);
        if (data.corpus) {
          setCorpus(data.corpus);
          saveCorpus(data.corpus);
          setChannelUrl(data.corpus.channelUrl);
        } else {
          setChannelUrl(ADMIN_DEFAULT_YOUTUBE_CHANNEL);
        }
        await loadWatches();
        if (data.ranIngest) {
          toast({
            title: `${ADMIN_DEFAULT_YOUTUBE_HANDLE} is live`,
            description:
              "Admin watch auto-started — transcripts loaded and daily refresh scheduled.",
          });
        }
      } catch {
        /* non-admin or offline */
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWatches, toast]);

  const activeWatch = useMemo(() => {
    if (!corpus) return null;
    const key = corpus.channelUrl.replace(/\/+$/, "").toLowerCase();
    return watches.find((w) => w.channelUrl.replace(/\/+$/, "").toLowerCase() === key) ?? null;
  }, [corpus, watches]);

  const ingest = async (urlOverride?: string) => {
    const url = (urlOverride ?? channelUrl).trim();
    setChannelUrl(url);
    setIngesting(true);
    setAnswer(null);
    try {
      const res = await authFetch("/api/marketing/channel-intel/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: url, maxVideos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setCorpus(data.corpus);
      saveCorpus(data.corpus);
      setWatchQueries((prev) => {
        const next = new Set(prev);
        next.add(query.trim() || CHANNEL_INTEL_PRESET_QUERIES[0]);
        return [...next].slice(0, 5);
      });
      toast({
        title: "Channel ingested",
        description: `${data.corpus.stats.withTranscript}/${data.corpus.stats.listed} videos with captions`,
      });
    } catch (e) {
      toast({
        title: "Ingest failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setIngesting(false);
    }
  };

  const ask = async () => {
    if (!corpus) return;
    setAsking(true);
    try {
      const res = await authFetch("/api/marketing/channel-intel/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpus, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setAnswer(data as ChannelIntelAnswer);
      setWatchQueries((prev) => {
        const next = new Set(prev);
        next.add(query.trim());
        return [...next].slice(0, 5);
      });
    } catch (e) {
      toast({
        title: "Query failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setAsking(false);
    }
  };

  const startWatch = async () => {
    if (!corpus) return;
    const queries = watchQueries.map((q) => q.trim()).filter((q) => q.length >= 3);
    if (!queries.length) {
      toast({ title: "Pick at least one question to watch for", variant: "destructive" });
      return;
    }
    setSavingWatch(true);
    try {
      const res = await authFetch("/api/marketing/channel-intel/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelUrl: corpus.channelUrl,
          channelTitle: corpus.channelTitle,
          maxVideos,
          cadence,
          watchQueries: queries.slice(0, 5),
          suggestAppFeatures: suggestFeatures,
          enabled: true,
          corpus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save watch");
      const watchId = data.watch?.id as string | undefined;
      if (watchId) {
        setRunningWatchId(watchId);
        await authFetch("/api/marketing/channel-intel/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchId }),
        });
      }
      await loadWatches();
      toast({
        title: "Continued updates on",
        description: `ZZAI will refresh ${corpus.channelTitle} ${cadence.replace(/_/g, " ")} and re-ask your questions. First briefing is running now.`,
      });
    } catch (e) {
      toast({
        title: "Could not start updates",
        description: e instanceof Error ? e.message : "Database required for scheduled watches",
        variant: "destructive",
      });
    } finally {
      setSavingWatch(false);
      setRunningWatchId(null);
    }
  };

  const patchWatch = async (id: string, body: Record<string, unknown>) => {
    const res = await authFetch("/api/marketing/channel-intel/watches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    await loadWatches();
  };

  const runWatchNow = async (id: string) => {
    setRunningWatchId(id);
    try {
      const res = await authFetch("/api/marketing/channel-intel/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refresh failed");
      await loadWatches();
      const first = data.results?.[0];
      toast({
        title: first?.error ? "Refresh had errors" : "Channel refreshed",
        description: first?.error
          ? first.error
          : `${first?.newVideos ?? 0} new videos · ${first?.suggestionCount ?? 0} app ideas`,
        variant: first?.error ? "destructive" : "default",
      });
    } catch (e) {
      toast({
        title: "Refresh failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setRunningWatchId(null);
    }
  };

  const removeWatch = async (id: string) => {
    const res = await authFetch(
      `/api/marketing/channel-intel/watches?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Delete failed");
    }
    await loadWatches();
  };

  const exportMarkdown = () => {
    if (!corpus || !answer) return;
    const md = [
      `# Channel intel — ${corpus.channelTitle}`,
      "",
      `Channel: ${corpus.channelUrl}`,
      `Ingested: ${corpus.ingestedAt}`,
      "",
      `## Question`,
      answer.query,
      "",
      answer.answer,
      "",
      "## Sources",
      ...answer.sources.map(
        (s) => `- [${s.title}](${s.url})${s.publishedText ? ` (${s.publishedText})` : ""}`,
      ),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `channel-intel-${corpus.channelTitle.replace(/\s+/g, "-").slice(0, 40)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAnswer = async () => {
    if (!answer?.answer) return;
    await navigator.clipboard.writeText(answer.answer);
    toast({ title: "Copied briefing" });
  };

  const toggleWatchQuery = (q: string) => {
    setWatchQueries((prev) => {
      if (prev.includes(q)) return prev.filter((item) => item !== q);
      return [...prev, q].slice(0, 5);
    });
  };

  const videoSummary = useMemo(() => {
    if (!corpus) return null;
    return `${corpus.stats.withTranscript} transcripts · ${corpus.videos.length} videos`;
  }, [corpus]);

  const displayAnswer = answer ?? activeWatch?.lastBriefings[0] ?? null;
  const suggestions = activeWatch?.productSuggestions ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/marketing">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Marketing
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Youtube className="w-7 h-7 text-red-500" />
          Channel intel
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Paste a YouTube channel. ZZAI pulls captions, answers growth questions, then can keep
          watching on a schedule — including ideas for what to add to this app. Admin auto-watches{" "}
          {ADMIN_DEFAULT_YOUTUBE_HANDLE} on first open.
        </p>
        {adminWatchReady && (
          <p className="text-xs text-[#5B8DA8] font-medium">
            {bootstrapping
              ? `Bootstrapping ${ADMIN_DEFAULT_YOUTUBE_HANDLE}…`
              : `Admin: ${ADMIN_DEFAULT_YOUTUBE_HANDLE} watch active · daily refresh`}
          </p>
        )}
      </div>

      <OrbitHybridGrowthPanel compact />

      {watches.length > 0 && !corpus && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Saved channel watches</CardTitle>
            <CardDescription>Scheduled transcription refresh is already running.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {watches.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{w.channelTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.enabled ? "On" : "Paused"} · {w.cadence.replace(/_/g, " ")} · next{" "}
                    {formatWhen(w.nextRunAt)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void ingest(w.channelUrl)}>
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">1. Ingest channel</CardTitle>
          <CardDescription>
            Uses public captions when available (no API key). Up to {MAX_CHANNEL_INTEL_VIDEOS}{" "}
            videos per run. Later refreshes reuse transcripts you already have.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder={`https://www.youtube.com/${ADMIN_DEFAULT_YOUTUBE_HANDLE}`}
          />
          <div className="flex flex-wrap gap-2">
            {YOUTUBE_QUICK_CHANNELS.map((chip) => (
              <Button
                key={chip.url}
                type="button"
                size="sm"
                variant="outline"
                disabled={ingesting}
                title={chip.hint}
                onClick={() => void ingest(chip.url)}
              >
                {chip.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              Max videos
              <Input
                type="number"
                min={3}
                max={MAX_CHANNEL_INTEL_VIDEOS}
                value={maxVideos}
                onChange={(e) =>
                  setMaxVideos(
                    Math.min(MAX_CHANNEL_INTEL_VIDEOS, Math.max(3, Number(e.target.value) || 15)),
                  )
                }
                className="w-20 h-8"
              />
            </label>
            <Button
              onClick={() => void ingest()}
              disabled={ingesting || !channelUrl.trim()}
              className="gap-2"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #6B2C4E)` }}
            >
              {ingesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {ingesting ? "Fetching transcripts…" : "Ingest channel"}
            </Button>
          </div>
          {corpus && (
            <div className="rounded-lg border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{corpus.channelTitle}</Badge>
                <span className="text-xs text-muted-foreground">{videoSummary}</span>
                {activeWatch?.enabled && (
                  <Badge className="bg-emerald-600/90">
                    Watching {activeWatch.cadence.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
              <ul className="text-xs text-muted-foreground max-h-36 overflow-auto space-y-1">
                {corpus.videos.map((v) => (
                  <li key={v.videoId}>
                    {v.hasTranscript ? "✓" : "○"} {v.title}
                    {v.publishedText ? ` · ${v.publishedText}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">2. Ask your question</CardTitle>
          <CardDescription>
            AI synthesizes tactics from the ingested corpus and cites source videos. Questions you
            ask can be added to continued updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CHANNEL_INTEL_PRESET_QUERIES.map((q) => (
              <Button
                key={q}
                type="button"
                size="sm"
                variant={query === q ? "default" : "outline"}
                className="text-xs h-auto py-1.5 whitespace-normal text-left"
                onClick={() => setQuery(q)}
              >
                {q}
              </Button>
            ))}
          </div>
          <Textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What marketing tactics should I use for app traffic?"
          />
          <Button
            onClick={() => void ask()}
            disabled={!corpus || asking || query.trim().length < 3}
            className="gap-2"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze corpus
          </Button>
        </CardContent>
      </Card>

      {corpus && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" /> 3. Continued updates
            </CardTitle>
            <CardDescription>
              After you add a channel, ZZAI can re-pull new captions on a schedule and re-run the
              questions you care about — plus optional ideas for features to add to ZZAI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeWatch?.enabled ? (
              <div className="space-y-3 text-sm">
                <p>
                  Watching <strong>{activeWatch.channelTitle}</strong> ·{" "}
                  {activeWatch.cadence.replace(/_/g, " ")} · next run{" "}
                  {formatWhen(activeWatch.nextRunAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Looking for: {activeWatch.watchQueries.join(" · ")}
                </p>
                {activeWatch.lastError && (
                  <p className="text-xs text-destructive">{activeWatch.lastError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={runningWatchId === activeWatch.id}
                    onClick={() => void runWatchNow(activeWatch.id)}
                  >
                    {runningWatchId === activeWatch.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Run now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() =>
                      void patchWatch(activeWatch.id, { enabled: false }).catch((e) =>
                        toast({
                          title: "Could not pause",
                          description: e instanceof Error ? e.message : "",
                          variant: "destructive",
                        }),
                      )
                    }
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive"
                    onClick={() =>
                      void removeWatch(activeWatch.id).catch((e) =>
                        toast({
                          title: "Could not remove",
                          description: e instanceof Error ? e.message : "",
                          variant: "destructive",
                        }),
                      )
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Stop watching
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-3">
                  {CADENCE_LABELS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCadence(c.value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        cadence === c.value
                          ? "border-[#5B8DA8] bg-[#5B8DA8]/10"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="font-medium">{c.label}</div>
                      <div className="text-xs text-muted-foreground">{c.hint}</div>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Keep looking for
                  </p>
                  {[...new Set([...CHANNEL_INTEL_PRESET_QUERIES, query.trim(), ...watchQueries])]
                    .filter((q) => q.length >= 3)
                    .slice(0, 8)
                    .map((q) => (
                      <label key={q} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={watchQueries.includes(q)}
                          onCheckedChange={() => toggleWatchQuery(q)}
                        />
                        <span>{q}</span>
                      </label>
                    ))}
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={suggestFeatures}
                    onCheckedChange={(v) => setSuggestFeatures(v === true)}
                  />
                  <span>
                    Also suggest what to add to ZZAI from those tactics (product ideas, not just
                    marketing notes)
                  </span>
                </label>
                <Button
                  onClick={() => void startWatch()}
                  disabled={savingWatch || watchQueries.length === 0}
                  className="gap-2"
                >
                  {savingWatch ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {activeWatch ? "Resume continued updates" : "Start continued updates"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Ideas to add to ZZAI</CardTitle>
            <CardDescription>
              Generated from the watched channel and your questions. Last refresh{" "}
              {formatWhen(activeWatch?.lastRunAt ?? null)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.title} className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-sm">{s.title}</p>
                {s.why && <p className="text-xs text-muted-foreground mt-1">{s.why}</p>}
                {s.how && <p className="text-xs mt-1">{s.how}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeWatch && activeWatch.lastBriefings.length > 1 && !answer && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Latest scheduled briefings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeWatch.lastBriefings.map((b) => (
              <div key={b.query} className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">{b.query}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{b.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {displayAnswer && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Briefing</CardTitle>
              <CardDescription>
                {displayAnswer.aiUsed
                  ? "AI synthesis"
                  : "Keyword excerpts (add OpenAI/Gemini for full synthesis)"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void copyAnswer()}
                className="gap-1"
                disabled={!answer}
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportMarkdown}
                className="gap-1"
                disabled={!answer}
              >
                <Download className="w-3.5 h-3.5" /> Markdown
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {displayAnswer.answer}
            </div>
            {displayAnswer.sources.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Source videos
                </p>
                <ul className="text-xs space-y-2">
                  {displayAnswer.sources.slice(0, 10).map((s) => (
                    <li key={s.videoId}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#5B8DA8] hover:underline font-medium"
                      >
                        {s.title}
                      </a>
                      {s.publishedText && (
                        <span className="text-muted-foreground"> · {s.publishedText}</span>
                      )}
                      {s.excerpt && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{s.excerpt}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
