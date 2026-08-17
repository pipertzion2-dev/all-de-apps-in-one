import { fetchYoutubeFull } from "@/lib/clutety/youtube-fetch";
import { listChannelVideos } from "@/lib/clutety/youtube-channel";
import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { getDefaultModel, openai } from "@/lib/llm/openai";

export const MAX_CHANNEL_INTEL_VIDEOS = 24;
export const DEFAULT_TRANSCRIPT_CHARS = 8000;

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
  onProgress?: (done: number, total: number, title: string) => void;
}): Promise<ChannelIntelCorpus> {
  const maxVideos = Math.min(options.maxVideos ?? 20, MAX_CHANNEL_INTEL_VIDEOS);
  const transcriptMaxChars = options.transcriptMaxChars ?? DEFAULT_TRANSCRIPT_CHARS;
  const listing = await listChannelVideos(options.channelUrl, maxVideos);
  const stubs = listing.videos.slice(0, maxVideos);

  let failed = 0;
  const videos = await mapPool(stubs, 4, async (stub, index) => {
    options.onProgress?.(index, stubs.length, stub.title);
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
