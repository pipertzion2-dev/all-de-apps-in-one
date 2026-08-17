import { fetchYoutubeFull, parseYoutubeVideoId } from "@/lib/clutety/youtube-fetch";
import { ingestChannelIntel } from "@/lib/marketing/channel-intel";

export const SEEDS_YOUTUBE_MAX_VIDEOS = 6;
export const SEEDS_YOUTUBE_TRANSCRIPT_CHARS = 6000;

export type YoutubeSeedSourceKind = "video" | "channel";

export type YoutubeSeedClip = {
  title: string;
  url: string;
  transcript: string;
  description?: string;
};

export function classifyYoutubeSeedUrl(input: string): {
  kind: YoutubeSeedSourceKind;
  value: string;
} {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Paste a YouTube video or channel URL.");
  const videoId = parseYoutubeVideoId(trimmed);
  if (videoId) return { kind: "video", value: videoId };

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Paste a YouTube video or channel URL.");
  }
  if (url.hostname.includes("youtu.be")) {
    throw new Error("Could not read that video URL.");
  }
  if (!url.hostname.includes("youtube.com")) {
    throw new Error("Paste a YouTube video or channel URL.");
  }
  return { kind: "channel", value: trimmed };
}

export function buildYoutubeSeedDocument(options: {
  sourceLabel: string;
  sourceUrl: string;
  clips: YoutubeSeedClip[];
}): string {
  const clips = options.clips.filter((c) => c.transcript.trim() || c.description?.trim());
  const body = clips
    .map((clip, i) => {
      const transcript = clip.transcript.trim() || "(no captions — using description)";
      const desc = clip.description?.trim() ? `Description: ${clip.description.trim()}\n` : "";
      return `### App source ${i + 1}: ${clip.title}\nURL: ${clip.url}\n${desc}Transcript:\n${transcript}`;
    })
    .join("\n\n---\n\n");

  return `YouTube transcript briefing for ZZAI Seeds.
Source: ${options.sourceLabel}
URL: ${options.sourceUrl}

Extract 2–6 shippable application specs inspired by the products, tactics, and workflows in these transcripts. Each spec must be concrete enough to build and deploy (problem, users, features, APIs, UI).

${body}`;
}

export async function collectYoutubeClipsForSeeds(rawUrl: string): Promise<{
  sourceLabel: string;
  sourceUrl: string;
  clips: YoutubeSeedClip[];
}> {
  const classified = classifyYoutubeSeedUrl(rawUrl);

  if (classified.kind === "video") {
    const { metadata, transcript } = await fetchYoutubeFull(classified.value);
    const url = `https://www.youtube.com/watch?v=${classified.value}`;
    const clip: YoutubeSeedClip = {
      title: metadata.title || classified.value,
      url,
      transcript: transcript.slice(0, SEEDS_YOUTUBE_TRANSCRIPT_CHARS),
      description: metadata.description,
    };
    if (!clip.transcript.trim() && !clip.description?.trim()) {
      throw new Error("No captions or description found for that video.");
    }
    return {
      sourceLabel: metadata.authorName ? `${metadata.authorName} — ${clip.title}` : clip.title,
      sourceUrl: url,
      clips: [clip],
    };
  }

  const corpus = await ingestChannelIntel({
    channelUrl: classified.value,
    maxVideos: SEEDS_YOUTUBE_MAX_VIDEOS,
    transcriptMaxChars: SEEDS_YOUTUBE_TRANSCRIPT_CHARS,
  });
  const clips: YoutubeSeedClip[] = corpus.videos
    .filter((v) => v.transcript.trim() || v.description.trim())
    .map((v) => ({
      title: v.title,
      url: v.url,
      transcript: v.transcript,
      description: v.description,
    }));
  if (clips.length === 0) {
    throw new Error("No transcripts found on that channel. Try a video URL with captions.");
  }
  return {
    sourceLabel: corpus.channelTitle,
    sourceUrl: corpus.channelUrl,
    clips,
  };
}
