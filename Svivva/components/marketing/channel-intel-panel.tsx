"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download, Loader2, Search, Sparkles, Youtube } from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ChannelIntelAnswer, ChannelIntelCorpus } from "@/lib/marketing/channel-intel";
import { MAX_CHANNEL_INTEL_VIDEOS } from "@/lib/marketing/channel-intel";

const STORAGE_KEY = "zzai-channel-intel-corpus-v1";
const TEAL = "#5B8DA8";

const PRESET_QUERIES = [
  "How do I get more traffic for my app?",
  "What SEO tactics do they recommend for SaaS?",
  "Reddit and community marketing strategies",
  "Product Hunt and launch tactics",
  "Content marketing and YouTube growth",
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

export function ChannelIntelPanel() {
  const { toast } = useToast();
  const [channelUrl, setChannelUrl] = useState("https://www.youtube.com/@StarterStory");
  const [maxVideos, setMaxVideos] = useState(15);
  const [corpus, setCorpus] = useState<ChannelIntelCorpus | null>(null);
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [answer, setAnswer] = useState<ChannelIntelAnswer | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [asking, setAsking] = useState(false);

  const hydrate = useCallback(() => {
    const stored = loadStoredCorpus();
    if (stored) setCorpus(stored);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ingest = async () => {
    setIngesting(true);
    setAnswer(null);
    try {
      const res = await authFetch("/api/marketing/channel-intel/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: channelUrl.trim(), maxVideos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setCorpus(data.corpus);
      saveCorpus(data.corpus);
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

  const videoSummary = useMemo(() => {
    if (!corpus) return null;
    return `${corpus.stats.withTranscript} transcripts · ${corpus.videos.length} videos`;
  }, [corpus]);

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
          Paste a YouTube channel (e.g. Starter Story). ZZAI pulls captions from recent videos,
          organizes them, and answers questions like “how do I get more traffic for my app?” —
          without watching every video.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">1. Ingest channel</CardTitle>
          <CardDescription>
            Uses public captions when available (no API key). Up to {MAX_CHANNEL_INTEL_VIDEOS}{" "}
            videos per run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@StarterStory"
          />
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
            AI synthesizes tactics from the ingested corpus and cites source videos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((q) => (
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

      {answer && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Briefing</CardTitle>
              <CardDescription>
                {answer.aiUsed
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
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={exportMarkdown} className="gap-1">
                <Download className="w-3.5 h-3.5" /> Markdown
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {answer.answer}
            </div>
            {answer.sources.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Source videos
                </p>
                <ul className="text-xs space-y-2">
                  {answer.sources.slice(0, 10).map((s) => (
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
