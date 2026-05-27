import { NextRequest, NextResponse } from "next/server";
import { analyzeFeedItem } from "@/lib/clutety/feed-shield-engine";
import type { FeedShieldRules } from "@/lib/clutety/feed-shield-types";
import { fetchYoutubeFull, parseYoutubeVideoId } from "@/lib/clutety/youtube-fetch";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  url: string;
  rules?: FeedShieldRules;
  includeAnalysis?: boolean;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoId = parseYoutubeVideoId(body.url ?? "");
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL or video ID" }, { status: 400 });
  }

  try {
    const { metadata, transcript, tags } = await fetchYoutubeFull(videoId);
    const item = {
      platform: "youtube" as const,
      title: metadata.title,
      description: metadata.description,
      channel: metadata.authorName,
      transcript,
      tags,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };

    const payload: Record<string, unknown> = {
      videoId,
      item,
      metadata,
      transcriptLength: transcript.length,
      hasTranscript: transcript.length > 0,
    };

    if (body.rules && body.includeAnalysis !== false) {
      payload.analysis = analyzeFeedItem(item, body.rules);
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch YouTube data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
