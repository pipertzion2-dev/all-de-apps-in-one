import { fetchYoutubeFull } from "@/lib/clutety/youtube-fetch";
import { listChannelVideos } from "@/lib/clutety/youtube-channel";
import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { getDefaultModel, openai } from "@/lib/llm/openai";
import { getSvivvaProductProfile } from "@/lib/orbit/product-profile";

export const MAX_CHANNEL_INTEL_VIDEOS = 24;
export const DEFAULT_TRANSCRIPT_CHARS = 8000;

export const CHANNEL_INTEL_PRESET_QUERIES = [
  "How do I get more traffic for my app?",
  "What SEO tactics do they recommend for SaaS?",
  "Reddit and community marketing strategies",
  "Product Hunt and launch tactics",
  "Content marketing and YouTube growth",
] as const;

export type ChannelIntelCadence = "daily" | "every_3_days" | "weekly";

export const CHANNEL_INTEL_CADENCE_MS: Record<ChannelIntelCadence, number> = {
  daily: 24 * 60 * 60 * 1000,
  every_3_days: 3 * 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export function computeNextRunAt(cadence: ChannelIntelCadence, from: Date = new Date()): string {
  return new Date(from.getTime() + CHANNEL_INTEL_CADENCE_MS[cadence]).toISOString();
}

export function isWatchDue(nextRunAt: string, enabled: boolean, now: Date = new Date()): boolean {
  if (!enabled) return false;
  const t = Date.parse(nextRunAt);
  if (Number.isNaN(t)) return true;
  return t <= now.getTime();
}

export function diffNewVideoIds(previousIds: string[], currentIds: string[]): string[] {
  const seen = new Set(previousIds);
  return currentIds.filter((id) => !seen.has(id));
}

export type ChannelIntelVideo = {
  videoId: string;
  title: string;
  url: string;
  channel: string;
  description: string;
  transcript: string;
  publishedText?: string;
  transcriptLength: number;
  hasTranscript: boolean;
};

export type ChannelIntelCorpus = {
  channelTitle: string;
  channelUrl: string;
  ingestedAt: string;
  videos: ChannelIntelVideo[];
  stats: {
    listed: number;
    withTranscript: number;
    failed: number;
  };
};

export type ChannelIntelSource = {
  videoId: string;
  title: string;
  url: string;
  publishedText?: string;
  relevanceScore: number;
  excerpt: string;
};

export type ChannelIntelAnswer = {
  answer: string;
  sources: ChannelIntelSource[];
  aiUsed: boolean;
  query: string;
};

export type ChannelIntelProductSuggestion = {
  title: string;
  why: string;
  how: string;
};

export type ChannelIntelWatchPublic = {
  id: string;
  userId: string | null;
  channelUrl: string;
  channelTitle: string;
  maxVideos: number;
  cadence: ChannelIntelCadence;
  watchQueries: string[];
  suggestAppFeatures: boolean;
  enabled: boolean;
  seenVideoIds: string[];
  lastBriefings: ChannelIntelAnswer[];
  productSuggestions: ChannelIntelProductSuggestion[];
  lastNewVideoIds: string[];
  lastError: string | null;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
  videoCount: number;
  transcriptCount: number;
};

function canUseAi(): boolean {
  return !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim() || getOpenAIApiKey()?.trim());
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function ingestChannelIntel(options: {
  channelUrl: string;
  maxVideos?: number;
  transcriptMaxChars?: number;
  previousCorpus?: ChannelIntelCorpus | null;
  onProgress?: (done: number, total: number, title: string) => void;
}): Promise<ChannelIntelCorpus> {
  const maxVideos = Math.min(options.maxVideos ?? 20, MAX_CHANNEL_INTEL_VIDEOS);
  const transcriptMaxChars = options.transcriptMaxChars ?? DEFAULT_TRANSCRIPT_CHARS;
  const listing = await listChannelVideos(options.channelUrl, maxVideos);
  const stubs = listing.videos.slice(0, maxVideos);
  const previousById = new Map(
    (options.previousCorpus?.videos ?? []).map((video) => [video.videoId, video]),
  );

  let failed = 0;
  const videos = await mapPool(stubs, 4, async (stub, index) => {
    options.onProgress?.(index, stubs.length, stub.title);
    const prior = previousById.get(stub.videoId);
    if (prior?.hasTranscript && prior.transcript.length > 0) {
      return {
        ...prior,
        title: stub.title || prior.title,
        publishedText: stub.publishedText || prior.publishedText,
      } satisfies ChannelIntelVideo;
    }
    try {
      const { metadata, transcript } = await fetchYoutubeFull(stub.videoId);
      const clipped = transcript.slice(0, transcriptMaxChars);
      return {
        videoId: stub.videoId,
        title: metadata.title || stub.title,
        url: `https://www.youtube.com/watch?v=${stub.videoId}`,
        channel: metadata.authorName || listing.channelTitle,
        description: metadata.description || "",
        transcript: clipped,
        publishedText: stub.publishedText,
        transcriptLength: clipped.length,
        hasTranscript: clipped.length > 0,
      } satisfies ChannelIntelVideo;
    } catch {
      failed++;
      if (prior) return prior;
      return {
        videoId: stub.videoId,
        title: stub.title,
        url: `https://www.youtube.com/watch?v=${stub.videoId}`,
        channel: listing.channelTitle,
        description: "",
        transcript: "",
        publishedText: stub.publishedText,
        transcriptLength: 0,
        hasTranscript: false,
      } satisfies ChannelIntelVideo;
    }
  });

  options.onProgress?.(stubs.length, stubs.length, "done");

  return {
    channelTitle: listing.channelTitle,
    channelUrl: listing.channelUrl,
    ingestedAt: new Date().toISOString(),
    videos,
    stats: {
      listed: stubs.length,
      withTranscript: videos.filter((v) => v.hasTranscript).length,
      failed,
    },
  };
}

function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

export function scoreVideoForQuery(video: ChannelIntelVideo, query: string): number {
  const terms = queryTerms(query);
  if (!terms.length) return 0;
  const title = video.title.toLowerCase();
  const desc = video.description.toLowerCase();
  const transcript = video.transcript.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 8;
    if (desc.includes(term)) score += 4;
    const hits = transcript.split(term).length - 1;
    score += Math.min(hits, 12);
  }
  return score;
}

function excerptForTerm(text: string, query: string, maxLen = 320): string {
  const lower = text.toLowerCase();
  const terms = queryTerms(query);
  let idx = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  if (idx < 0) return text.slice(0, maxLen).trim();
  const start = Math.max(0, idx - 80);
  return text
    .slice(start, start + maxLen)
    .replace(/\s+/g, " ")
    .trim();
}

export function rankVideosForQuery(
  corpus: ChannelIntelCorpus,
  query: string,
  topK = 12,
): ChannelIntelSource[] {
  return corpus.videos
    .map((video) => {
      const relevanceScore = scoreVideoForQuery(video, query);
      const blob = [video.description, video.transcript].filter(Boolean).join(" ");
      return {
        videoId: video.videoId,
        title: video.title,
        url: video.url,
        publishedText: video.publishedText,
        relevanceScore,
        excerpt: excerptForTerm(blob || video.title, query),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

function fallbackAnswer(query: string, sources: ChannelIntelSource[]): string {
  const hits = sources.filter((s) => s.relevanceScore > 0);
  if (!hits.length) {
    return `No strong keyword matches for “${query}” in this corpus. Try broader terms (traffic, SEO, Reddit, Product Hunt, content) or ingest more videos.`;
  }
  const lines = hits
    .slice(0, 8)
    .map((s) => `• **${s.title}** — ${s.excerpt}${s.excerpt.length >= 300 ? "…" : ""}\n  ${s.url}`);
  return `Keyword matches for “${query}” (no AI configured — showing excerpts only):\n\n${lines.join("\n\n")}`;
}

export async function queryChannelIntel(
  corpus: ChannelIntelCorpus,
  query: string,
): Promise<ChannelIntelAnswer> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      answer: "Ask a question about tactics in the ingested videos.",
      sources: [],
      aiUsed: false,
      query: "",
    };
  }

  const sources = rankVideosForQuery(corpus, trimmed, 12);
  const topForLlm = sources.filter((s) => s.relevanceScore > 0).slice(0, 10);
  const contextVideos =
    topForLlm.length >= 3
      ? topForLlm
      : sources.slice(0, Math.min(8, corpus.videos.length)).map((s) => ({
          ...s,
          relevanceScore: Math.max(s.relevanceScore, 1),
        }));

  if (!canUseAi()) {
    return {
      answer: fallbackAnswer(trimmed, sources),
      sources,
      aiUsed: false,
      query: trimmed,
    };
  }

  const context = contextVideos
    .map((s) => {
      const full = corpus.videos.find((v) => v.videoId === s.videoId);
      const body = [
        `Title: ${s.title}`,
        s.publishedText ? `Published: ${s.publishedText}` : "",
        full?.description ? `Description: ${full.description.slice(0, 1200)}` : "",
        full?.transcript ? `Transcript: ${full.transcript.slice(0, 6000)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return `--- VIDEO ${s.videoId} ---\n${body}`;
    })
    .join("\n\n");

  const prompt = `You are a marketing research assistant. The user ingested YouTube videos from “${corpus.channelTitle}”.

User question: ${trimmed}

Extract ONLY actionable marketing / growth tactics that answer the question. Ignore founder fluff, revenue bragging, and generic motivation unless it includes a repeatable traffic step.

Format markdown:
## Summary
2-4 sentences.

## Tactics
Numbered list. Each item: tactic name, 1-2 sentence how-to, **Source:** [video title](url)

## What's newer or less common
Bullets for tactics that sound less generic (if any).

## Gaps
What the corpus did NOT cover for this question.

VIDEO CORPUS:
${context.slice(0, 90000)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
    });
    const answer =
      completion.choices[0]?.message?.content?.trim() || fallbackAnswer(trimmed, sources);
    return { answer, sources, aiUsed: true, query: trimmed };
  } catch {
    return {
      answer: fallbackAnswer(trimmed, sources),
      sources,
      aiUsed: false,
      query: trimmed,
    };
  }
}

function parseSuggestionJson(raw: string): ChannelIntelProductSuggestion[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const rec = item as Record<string, unknown>;
        const title = typeof rec.title === "string" ? rec.title.trim() : "";
        if (!title) return null;
        return {
          title: title.slice(0, 120),
          why: typeof rec.why === "string" ? rec.why.trim().slice(0, 400) : "",
          how: typeof rec.how === "string" ? rec.how.trim().slice(0, 400) : "",
        } satisfies ChannelIntelProductSuggestion;
      })
      .filter((item): item is ChannelIntelProductSuggestion => !!item)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function fallbackProductSuggestions(
  briefings: ChannelIntelAnswer[],
): ChannelIntelProductSuggestion[] {
  const titles = briefings
    .flatMap((b) => b.answer.split("\n"))
    .map((line) => line.replace(/^[\s*#\d.)-]+/, "").trim())
    .filter((line) => line.length > 18 && line.length < 90)
    .slice(0, 4);
  if (!titles.length) {
    return [
      {
        title: "Auto-apply traffic tactics from watched channels",
        why: "The corpus has growth ideas that currently sit in a briefing instead of shipping in ZZAI.",
        how: "Turn repeated tactics (SEO pages, Reddit posts, launch checklists) into one-click Orbit tasks.",
      },
    ];
  }
  return titles.map((title) => ({
    title: `Add: ${title.slice(0, 80)}`,
    why: "Repeated in the watched YouTube briefings.",
    how: "Ship a small ZZAI tool or Orbit task that performs this tactic for the signed-in user.",
  }));
}

/** Turn channel briefings into concrete ZZAI product ideas. */
export async function suggestZzaiFeaturesFromIntel(options: {
  channelTitle: string;
  briefings: ChannelIntelAnswer[];
  newVideoTitles?: string[];
}): Promise<{ suggestions: ChannelIntelProductSuggestion[]; aiUsed: boolean }> {
  const briefings = options.briefings.filter((b) => b.answer.trim());
  if (!briefings.length) {
    return { suggestions: [], aiUsed: false };
  }
  if (!canUseAi()) {
    return { suggestions: fallbackProductSuggestions(briefings), aiUsed: false };
  }

  const product = getSvivvaProductProfile();
  const briefingText = briefings
    .map((b) => `Q: ${b.query}\n${b.answer.slice(0, 4000)}`)
    .join("\n\n")
    .slice(0, 24000);
  const newVideos = (options.newVideoTitles ?? []).slice(0, 12).join("; ");

  const prompt = `You help decide what to ADD to the ZZAI product.

Product: ${product.name} — ${product.tagline}
${product.description}
Audience: ${product.audience}
Site: ${product.url}
Existing surfaces: Marketing dashboard, Orbit SEO automation, Poor Man Protection (group patents), Channel Intel (YouTube transcripts), Clutety, Play, AI Tools Hub.

Channel watched: ${options.channelTitle}
${newVideos ? `New videos this run: ${newVideos}` : ""}

Briefings from auto-transcribed videos:
${briefingText}

Return ONLY a JSON array of 3-6 objects:
[{"title":"short feature name","why":"why this belongs in ZZAI","how":"smallest shippable version"}]

Rules:
- Features must be things ZZAI can build (tools, automations, dashboards, generators) — not generic life advice.
- Prefer ideas that reuse Channel Intel, Orbit, marketing, or patent flows already in the app.
- Do not suggest rebuilding YouTube.`;

  try {
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const suggestions = parseSuggestionJson(raw);
    if (suggestions.length) return { suggestions, aiUsed: true };
    return { suggestions: fallbackProductSuggestions(briefings), aiUsed: true };
  } catch {
    return { suggestions: fallbackProductSuggestions(briefings), aiUsed: false };
  }
}
