import { NextRequest } from "next/server";
import { fetchYoutubeFull, parseYoutubeVideoId } from "@/lib/clutety/youtube-fetch";
import { badRequest, ok, serverError, tooManyRequests } from "@/lib/http-response";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const CAPTION_MAX = 3500;
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 8) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return tooManyRequests("Rate limit — 8 previews/minute. Open ZZAI Seeds for the full factory.");
  }

  let url = "";
  try {
    const body = (await req.json()) as { url?: string };
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return badRequest("Invalid JSON");
  }

  const videoId = parseYoutubeVideoId(url);
  if (!videoId) return badRequest("Paste a YouTube watch URL or video ID.");

  try {
    const { metadata, transcript } = await fetchYoutubeFull(videoId);
    const caption = transcript.slice(0, CAPTION_MAX);
    if (!caption && !metadata.description) {
      return badRequest("No public captions or description on that video.");
    }
    return ok({
      videoId,
      title: metadata.title,
      authorName: metadata.authorName,
      caption,
      truncated: transcript.length > CAPTION_MAX,
      nextHref: "/seeds",
      slice: "Captions only. Seeds turns transcripts into apps you can build and deploy.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Caption fetch failed";
    return serverError(message);
  }
}
