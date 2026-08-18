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
} from "@/lib/marketing/channel-intel-store";
import { runChannelIntelWatch } from "@/lib/marketing/channel-intel-watch";
import { ADMIN_DEFAULT_YOUTUBE_CHANNEL } from "@/lib/marketing/youtube-defaults";

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
