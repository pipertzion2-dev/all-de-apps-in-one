import {
  diffNewVideoIds,
  ingestChannelIntel,
  queryChannelIntel,
  suggestZzaiFeaturesFromIntel,
  type ChannelIntelAnswer,
  type ChannelIntelProductSuggestion,
} from "@/lib/marketing/channel-intel";
import {
  getChannelIntelWatch,
  listDueChannelIntelWatches,
  markChannelIntelWatchError,
  saveChannelIntelWatchRun,
  type ChannelIntelWatch,
} from "@/lib/marketing/channel-intel-store";

export const MAX_WATCHES_PER_TICK = 2;

export type ChannelIntelTickResult = {
  ran: number;
  skipped: number;
  results: Array<{
    watchId: string;
    channelTitle: string;
    newVideos: number;
    queries: number;
    suggestionCount: number;
    error?: string;
  }>;
};

export async function runChannelIntelWatch(watch: ChannelIntelWatch): Promise<{
  watchId: string;
  channelTitle: string;
  newVideos: number;
  queries: number;
  suggestionCount: number;
  error?: string;
}> {
  try {
    const corpus = await ingestChannelIntel({
      channelUrl: watch.channelUrl,
      maxVideos: watch.maxVideos,
      previousCorpus: watch.corpus,
    });
    const newVideoIds = diffNewVideoIds(
      watch.seenVideoIds,
      corpus.videos.map((v) => v.videoId),
    );
    const queries = watch.watchQueries.slice(0, 5);
    const briefings: ChannelIntelAnswer[] = [];
    for (const query of queries) {
      briefings.push(await queryChannelIntel(corpus, query));
    }

    let productSuggestions: ChannelIntelProductSuggestion[] = watch.productSuggestions;
    if (watch.suggestAppFeatures && briefings.length) {
      const suggested = await suggestZzaiFeaturesFromIntel({
        channelTitle: corpus.channelTitle,
        briefings,
        newVideoTitles: corpus.videos
          .filter((v) => newVideoIds.includes(v.videoId))
          .map((v) => v.title),
      });
      productSuggestions = suggested.suggestions;
    }

    await saveChannelIntelWatchRun({
      watch,
      corpus,
      briefings,
      productSuggestions,
      newVideoIds,
    });

    return {
      watchId: watch.id,
      channelTitle: corpus.channelTitle,
      newVideos: newVideoIds.length,
      queries: briefings.length,
      suggestionCount: productSuggestions.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Watch run failed";
    try {
      await markChannelIntelWatchError(watch, message);
    } catch {
      /* persist failure is secondary */
    }
    return {
      watchId: watch.id,
      channelTitle: watch.channelTitle,
      newVideos: 0,
      queries: 0,
      suggestionCount: 0,
      error: message,
    };
  }
}

export async function runDueChannelIntelWatches(
  limit = MAX_WATCHES_PER_TICK,
): Promise<ChannelIntelTickResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ran: 0, skipped: 0, results: [] };
  }
  const due = await listDueChannelIntelWatches(limit);
  const results = [];
  for (const watch of due) {
    results.push(await runChannelIntelWatch(watch));
  }
  return {
    ran: results.filter((r) => !r.error).length,
    skipped: results.filter((r) => r.error).length,
    results,
  };
}

export async function runChannelIntelWatchById(id: string): Promise<ChannelIntelTickResult> {
  const watch = await getChannelIntelWatch(id);
  if (!watch) {
    return {
      ran: 0,
      skipped: 1,
      results: [
        {
          watchId: id,
          channelTitle: "",
          newVideos: 0,
          queries: 0,
          suggestionCount: 0,
          error: "Watch not found.",
        },
      ],
    };
  }
  const result = await runChannelIntelWatch(watch);
  return {
    ran: result.error ? 0 : 1,
    skipped: result.error ? 1 : 0,
    results: [result],
  };
}
