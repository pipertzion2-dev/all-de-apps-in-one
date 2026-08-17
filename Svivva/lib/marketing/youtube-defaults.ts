import { normalizeChannelVideosUrl } from "@/lib/clutety/youtube-channel";
import {
  CHANNEL_INTEL_PRESET_QUERIES,
  ingestChannelIntel,
  type ChannelIntelCorpus,
} from "@/lib/marketing/channel-intel";
import {
  getChannelIntelWatchByUrl,
  toPublicWatch,
  upsertChannelIntelWatch,
  type ChannelIntelWatch,
} from "@/lib/marketing/channel-intel-store";
import { runChannelIntelWatch } from "@/lib/marketing/channel-intel-watch";

/** Default competitive-intel channel for admin Orbit + marketing autopilot. */
export const ADMIN_DEFAULT_YOUTUBE_CHANNEL = "https://www.youtube.com/@StarterStory";

export const ADMIN_DEFAULT_YOUTUBE_HANDLE = "@StarterStory";

export const YOUTUBE_QUICK_CHANNELS = [
  {
    label: "@StarterStory",
    url: ADMIN_DEFAULT_YOUTUBE_CHANNEL,
    hint: "SaaS growth & indie founder playbooks",
  },
  {
    label: "Starter Story videos",
    url: "https://www.youtube.com/@StarterStory/videos",
    hint: "Full channel listing",
  },
] as const;

export type AdminChannelBootstrapResult = {
  watch: ReturnType<typeof toPublicWatch>;
  corpus: ChannelIntelCorpus | null;
  ranIngest: boolean;
  ranWatch: boolean;
};

/**
 * Ensures the admin StarterStory watch exists (daily cadence, feature suggestions on).
 * Optionally ingests transcripts and runs the first briefing when corpus is empty.
 */
export async function ensureAdminStarterStoryWatch(options?: {
  ingestIfEmpty?: boolean;
  runBriefing?: boolean;
}): Promise<AdminChannelBootstrapResult> {
  const channelUrl = normalizeChannelVideosUrl(ADMIN_DEFAULT_YOUTUBE_CHANNEL);
  let watch = await getChannelIntelWatchByUrl(channelUrl);

  if (!watch) {
    watch = await upsertChannelIntelWatch({
      channelUrl,
      channelTitle: "Starter Story",
      maxVideos: 15,
      cadence: "daily",
      watchQueries: CHANNEL_INTEL_PRESET_QUERIES.slice(0, 3),
      suggestAppFeatures: true,
      enabled: true,
    });
  } else if (!watch.enabled) {
    watch =
      (await upsertChannelIntelWatch({
        channelUrl,
        channelTitle: watch.channelTitle || "Starter Story",
        maxVideos: watch.maxVideos,
        cadence: watch.cadence,
        watchQueries: watch.watchQueries.length
          ? watch.watchQueries
          : CHANNEL_INTEL_PRESET_QUERIES.slice(0, 3),
        suggestAppFeatures: watch.suggestAppFeatures,
        enabled: true,
        corpus: watch.corpus,
      })) ?? watch;
  }

  let corpus = watch.corpus;
  let ranIngest = false;
  let ranWatch = false;

  if (options?.ingestIfEmpty !== false && !corpus?.videos?.length) {
    corpus = await ingestChannelIntel({
      channelUrl,
      maxVideos: watch.maxVideos,
    });
    watch = await upsertChannelIntelWatch({
      channelUrl,
      channelTitle: corpus.channelTitle,
      maxVideos: watch.maxVideos,
      cadence: watch.cadence,
      watchQueries: watch.watchQueries,
      suggestAppFeatures: watch.suggestAppFeatures,
      enabled: true,
      corpus,
    });
    ranIngest = true;
  }

  if (options?.runBriefing && watch) {
    await runChannelIntelWatch(watch);
    const refreshed = await getChannelIntelWatchByUrl(channelUrl);
    if (refreshed) watch = refreshed;
    ranWatch = true;
  }

  return {
    watch: toPublicWatch(watch),
    corpus: watch.corpus ?? corpus ?? null,
    ranIngest,
    ranWatch,
  };
}

export function isStarterStoryChannelUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase().replace(/\/+$/, "");
  return (
    normalized.includes("@starterstory") ||
    normalized.includes("/starterstory") ||
    normalized === ADMIN_DEFAULT_YOUTUBE_CHANNEL.toLowerCase()
  );
}
