/** List public videos on a YouTube channel (no API key). */

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type ChannelVideoStub = {
  videoId: string;
  title: string;
  publishedText?: string;
};

export type ChannelListing = {
  channelUrl: string;
  channelTitle: string;
  videos: ChannelVideoStub[];
};

/** Normalize input to a channel /videos tab URL. */
export function normalizeChannelVideosUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Channel URL is required.");
  const withProto = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new Error("Invalid channel URL.");
  }
  if (!url.hostname.includes("youtube.com")) {
    throw new Error("Only youtube.com channel URLs are supported.");
  }
  if (url.pathname.includes("/watch") || url.pathname.includes("/shorts/")) {
    throw new Error("Paste a channel URL (e.g. youtube.com/@StarterStory), not a single video.");
  }
  if (url.pathname.includes("/playlist")) {
    return url.toString();
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/videos") || path.endsWith("/streams") || path.endsWith("/shorts")) {
    return url.toString();
  }
  url.pathname = `${path}/videos`;
  return url.toString();
}

/** Extract `ytInitialData` JSON embedded in YouTube HTML. */
export function extractYtInitialData(html: string): unknown | null {
  const markers = ["var ytInitialData = ", 'window["ytInitialData"] = ', "ytInitialData = "];
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx < 0) continue;
    const start = idx + marker.length;
    if (html[start] !== "{") continue;
    let depth = 0;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  return null;
}

function channelTitleFromData(data: unknown): string {
  if (!data || typeof data !== "object") return "YouTube channel";
  const root = data as Record<string, unknown>;
  const meta = root.metadata as Record<string, unknown> | undefined;
  const channelMeta = meta?.channelMetadataRenderer as Record<string, unknown> | undefined;
  if (typeof channelMeta?.title === "string" && channelMeta.title.trim()) {
    return channelMeta.title.trim();
  }
  const header = root.header as Record<string, unknown> | undefined;
  const pageHeader = header?.pageHeaderRenderer as Record<string, unknown> | undefined;
  const content = pageHeader?.content as Record<string, unknown> | undefined;
  const pageTitle = content?.pageTitleViewModel as Record<string, unknown> | undefined;
  const titleText = pageTitle?.title as Record<string, unknown> | undefined;
  const runs = titleText?.content as string | undefined;
  if (typeof runs === "string" && runs.trim()) return runs.trim();
  return "YouTube channel";
}

function collectVideoRenderers(
  node: unknown,
  out: Map<string, ChannelVideoStub>,
  limit: number,
): void {
  if (!node || out.size >= limit) return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, out, limit);
    return;
  }
  if (typeof node !== "object") return;

  const obj = node as Record<string, unknown>;
  const vr = obj.videoRenderer as Record<string, unknown> | undefined;
  if (vr && typeof vr.videoId === "string" && vr.videoId.length === 11) {
    const titleRuns = (vr.title as Record<string, unknown> | undefined)?.runs as
      | { text?: string }[]
      | undefined;
    const title =
      titleRuns?.map((r) => r.text ?? "").join("") ||
      (typeof (vr.title as Record<string, unknown> | undefined)?.simpleText === "string"
        ? ((vr.title as Record<string, unknown>).simpleText as string)
        : "") ||
      vr.videoId;
    const publishedText = (vr.publishedTimeText as Record<string, unknown> | undefined)
      ?.simpleText as string | undefined;
    if (!out.has(vr.videoId)) {
      out.set(vr.videoId, {
        videoId: vr.videoId,
        title: title.trim() || vr.videoId,
        publishedText: publishedText?.trim(),
      });
    }
  }

  for (const value of Object.values(obj)) {
    if (out.size >= limit) break;
    collectVideoRenderers(value, out, limit);
  }
}

export async function listChannelVideos(
  channelInput: string,
  maxVideos = 24,
): Promise<ChannelListing> {
  const channelUrl = normalizeChannelVideosUrl(channelInput);
  const res = await fetch(channelUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    throw new Error(`Could not load channel page (${res.status}).`);
  }
  const html = await res.text();
  const data = extractYtInitialData(html);
  if (!data) {
    throw new Error("Could not parse channel video list from YouTube.");
  }
  const videos = new Map<string, ChannelVideoStub>();
  collectVideoRenderers(data, videos, maxVideos);
  const list = [...videos.values()].slice(0, maxVideos);
  if (!list.length) {
    throw new Error("No videos found on this channel page. Try the /videos tab URL.");
  }
  return {
    channelUrl,
    channelTitle: channelTitleFromData(data),
    videos: list,
  };
}
