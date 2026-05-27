/** Fetch public YouTube metadata + captions (no API key). */

export type YoutubeMetadata = {
  videoId: string;
  title: string;
  authorName: string;
  description: string;
  thumbnailUrl?: string;
};

export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchYoutubeOEmbed(videoId: string): Promise<YoutubeMetadata | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };
  return {
    videoId,
    title: data.title ?? "",
    authorName: data.author_name ?? "",
    description: "",
    thumbnailUrl: data.thumbnail_url,
  };
}

/** Pull description + caption track list from watch page HTML. */
async function fetchWatchPagePayload(videoId: string): Promise<{
  description: string;
  captionTracks: { baseUrl: string; languageCode: string }[];
}> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 300 },
  });
  const html = await res.text();
  let description = "";
  let captionTracks: { baseUrl: string; languageCode: string }[] = [];

  const descMatch = html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
  if (descMatch) {
    try {
      description = JSON.parse(`"${descMatch[1]}"`) as string;
    } catch {
      description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  const captionsMatch = html.match(/"captionTracks":(\[[\s\S]*?\])\s*,\s*"videoDetails"/);
  if (captionsMatch) {
    try {
      const tracks = JSON.parse(captionsMatch[1]) as {
        baseUrl?: string;
        languageCode?: string;
      }[];
      captionTracks = tracks
        .filter((t) => t.baseUrl)
        .map((t) => ({
          baseUrl: t.baseUrl!,
          languageCode: t.languageCode ?? "en",
        }));
    } catch {
      /* ignore */
    }
  }

  return { description, captionTracks };
}

async function fetchCaptionText(baseUrl: string): Promise<string> {
  const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 ClutetyFeedShield/1.0" },
    next: { revalidate: 300 },
  });
  const raw = await res.text();
  if (raw.trim().startsWith("{")) {
    try {
      const j = JSON.parse(raw) as {
        events?: { segs?: { utf8?: string }[] }[];
      };
      return (
        j.events
          ?.flatMap((e) => e.segs?.map((s) => s.utf8 ?? "") ?? [])
          .join(" ")
          .replace(/\s+/g, " ")
          .trim() ?? ""
      );
    } catch {
      return "";
    }
  }
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchYoutubeTranscript(videoId: string, maxChars = 12000): Promise<string> {
  const { captionTracks } = await fetchWatchPagePayload(videoId);
  const preferred = captionTracks.find((t) => t.languageCode.startsWith("en")) ?? captionTracks[0];
  if (!preferred?.baseUrl) return "";
  const text = await fetchCaptionText(preferred.baseUrl);
  return text.slice(0, maxChars);
}

export async function fetchYoutubeFull(videoId: string): Promise<{
  metadata: YoutubeMetadata;
  transcript: string;
  tags: string[];
}> {
  const [oembed, page] = await Promise.all([
    fetchYoutubeOEmbed(videoId),
    fetchWatchPagePayload(videoId),
  ]);
  const metadata: YoutubeMetadata = {
    videoId,
    title: oembed?.title ?? "",
    authorName: oembed?.authorName ?? "",
    description: page.description || oembed?.description || "",
    thumbnailUrl: oembed?.thumbnailUrl,
  };
  let transcript = "";
  if (page.captionTracks.length) {
    const preferred =
      page.captionTracks.find((t) => t.languageCode.startsWith("en")) ?? page.captionTracks[0];
    if (preferred) transcript = await fetchCaptionText(preferred.baseUrl);
  }
  const tags: string[] = [];
  if (metadata.authorName) tags.push(metadata.authorName);
  return { metadata, transcript: transcript.slice(0, 12000), tags };
}
