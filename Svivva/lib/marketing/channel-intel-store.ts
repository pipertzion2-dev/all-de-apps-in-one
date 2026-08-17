import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  computeNextRunAt,
  type ChannelIntelAnswer,
  type ChannelIntelCadence,
  type ChannelIntelCorpus,
  type ChannelIntelProductSuggestion,
  type ChannelIntelWatchPublic,
} from "@/lib/marketing/channel-intel";

export type ChannelIntelWatch = {
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
  corpus: ChannelIntelCorpus | null;
  lastBriefings: ChannelIntelAnswer[];
  productSuggestions: ChannelIntelProductSuggestion[];
  lastNewVideoIds: string[];
  lastError: string | null;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
};

let tablesReady = false;

export async function ensureChannelIntelTables(): Promise<void> {
  if (tablesReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS channel_intel_watches (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      channel_url TEXT NOT NULL UNIQUE,
      channel_title TEXT NOT NULL DEFAULT '',
      max_videos INTEGER NOT NULL DEFAULT 15,
      cadence TEXT NOT NULL DEFAULT 'daily',
      watch_queries JSONB NOT NULL DEFAULT '[]',
      suggest_app_features BOOLEAN NOT NULL DEFAULT TRUE,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      seen_video_ids JSONB NOT NULL DEFAULT '[]',
      corpus JSONB,
      last_briefings JSONB NOT NULL DEFAULT '[]',
      product_suggestions JSONB NOT NULL DEFAULT '[]',
      last_new_video_ids JSONB NOT NULL DEFAULT '[]',
      last_error TEXT,
      last_run_at TIMESTAMPTZ,
      next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS channel_intel_runs (
      id TEXT PRIMARY KEY,
      watch_id TEXT NOT NULL,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      new_video_count INTEGER NOT NULL DEFAULT 0,
      briefings JSONB NOT NULL DEFAULT '[]',
      product_suggestions JSONB NOT NULL DEFAULT '[]',
      error TEXT
    )
  `);
  tablesReady = true;
}

function asCadence(value: unknown): ChannelIntelCadence {
  if (value === "every_3_days" || value === "weekly" || value === "daily") return value;
  return "daily";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

function mapWatch(row: Record<string, unknown>): ChannelIntelWatch {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    channelUrl: String(row.channel_url ?? ""),
    channelTitle: String(row.channel_title ?? ""),
    maxVideos: Number(row.max_videos ?? 15),
    cadence: asCadence(row.cadence),
    watchQueries: asStringArray(row.watch_queries),
    suggestAppFeatures: row.suggest_app_features !== false,
    enabled: row.enabled !== false,
    seenVideoIds: asStringArray(row.seen_video_ids),
    corpus: (row.corpus as ChannelIntelCorpus | null) ?? null,
    lastBriefings: Array.isArray(row.last_briefings)
      ? (row.last_briefings as ChannelIntelAnswer[])
      : [],
    productSuggestions: Array.isArray(row.product_suggestions)
      ? (row.product_suggestions as ChannelIntelProductSuggestion[])
      : [],
    lastNewVideoIds: asStringArray(row.last_new_video_ids),
    lastError: row.last_error ? String(row.last_error) : null,
    lastRunAt: asIso(row.last_run_at),
    nextRunAt: asIso(row.next_run_at) || new Date().toISOString(),
    createdAt: asIso(row.created_at) || new Date().toISOString(),
    updatedAt: asIso(row.updated_at) || new Date().toISOString(),
  };
}

export function toPublicWatch(watch: ChannelIntelWatch): ChannelIntelWatchPublic {
  const { corpus, ...rest } = watch;
  return {
    ...rest,
    videoCount: corpus?.videos.length ?? 0,
    transcriptCount: corpus?.stats.withTranscript ?? 0,
  };
}

export async function listChannelIntelWatches(): Promise<ChannelIntelWatch[]> {
  await ensureChannelIntelTables();
  const res = await db.execute(sql`
    SELECT * FROM channel_intel_watches
    ORDER BY updated_at DESC
  `);
  return ((res.rows || []) as Record<string, unknown>[]).map(mapWatch);
}

export async function getChannelIntelWatch(id: string): Promise<ChannelIntelWatch | null> {
  await ensureChannelIntelTables();
  const res = await db.execute(sql`
    SELECT * FROM channel_intel_watches WHERE id = ${id} LIMIT 1
  `);
  const row = (res.rows || [])[0] as Record<string, unknown> | undefined;
  return row ? mapWatch(row) : null;
}

export async function getChannelIntelWatchByUrl(
  channelUrl: string,
): Promise<ChannelIntelWatch | null> {
  await ensureChannelIntelTables();
  const res = await db.execute(sql`
    SELECT * FROM channel_intel_watches WHERE channel_url = ${channelUrl} LIMIT 1
  `);
  const row = (res.rows || [])[0] as Record<string, unknown> | undefined;
  return row ? mapWatch(row) : null;
}

export async function listDueChannelIntelWatches(limit = 2): Promise<ChannelIntelWatch[]> {
  await ensureChannelIntelTables();
  const res = await db.execute(sql`
    SELECT * FROM channel_intel_watches
    WHERE enabled = TRUE AND next_run_at <= NOW()
    ORDER BY next_run_at ASC
    LIMIT ${limit}
  `);
  return ((res.rows || []) as Record<string, unknown>[]).map(mapWatch);
}

export async function upsertChannelIntelWatch(input: {
  userId?: string | null;
  channelUrl: string;
  channelTitle: string;
  maxVideos: number;
  cadence: ChannelIntelCadence;
  watchQueries: string[];
  suggestAppFeatures: boolean;
  enabled?: boolean;
  corpus?: ChannelIntelCorpus | null;
}): Promise<ChannelIntelWatch> {
  await ensureChannelIntelTables();
  const id = crypto.randomUUID();
  const queries = input.watchQueries.map((q) => q.trim()).filter((q) => q.length >= 3);
  const seen = input.corpus?.videos.map((v) => v.videoId) ?? [];
  const nextRunAt = new Date().toISOString();
  const enabled = input.enabled ?? true;

  await db.execute(sql`
    INSERT INTO channel_intel_watches (
      id, user_id, channel_url, channel_title, max_videos, cadence, watch_queries,
      suggest_app_features, enabled, seen_video_ids, corpus, next_run_at, updated_at
    ) VALUES (
      ${id}, ${input.userId ?? null}, ${input.channelUrl}, ${input.channelTitle},
      ${input.maxVideos}, ${input.cadence}, ${JSON.stringify(queries)},
      ${input.suggestAppFeatures}, ${enabled}, ${JSON.stringify(seen)},
      ${input.corpus ? JSON.stringify(input.corpus) : null}, ${nextRunAt}, NOW()
    )
    ON CONFLICT (channel_url) DO UPDATE SET
      channel_title = EXCLUDED.channel_title,
      max_videos = EXCLUDED.max_videos,
      cadence = EXCLUDED.cadence,
      watch_queries = EXCLUDED.watch_queries,
      suggest_app_features = EXCLUDED.suggest_app_features,
      enabled = EXCLUDED.enabled,
      seen_video_ids = CASE
        WHEN EXCLUDED.corpus IS NULL THEN channel_intel_watches.seen_video_ids
        ELSE EXCLUDED.seen_video_ids
      END,
      corpus = COALESCE(EXCLUDED.corpus, channel_intel_watches.corpus),
      next_run_at = EXCLUDED.next_run_at,
      last_error = NULL,
      updated_at = NOW()
  `);

  const res = await db.execute(sql`
    SELECT * FROM channel_intel_watches WHERE channel_url = ${input.channelUrl} LIMIT 1
  `);
  const row = (res.rows || [])[0] as Record<string, unknown>;
  return mapWatch(row);
}

export async function updateChannelIntelWatch(
  id: string,
  patch: Partial<{
    cadence: ChannelIntelCadence;
    watchQueries: string[];
    suggestAppFeatures: boolean;
    enabled: boolean;
    maxVideos: number;
  }>,
): Promise<ChannelIntelWatch | null> {
  const existing = await getChannelIntelWatch(id);
  if (!existing) return null;
  const cadence = patch.cadence ?? existing.cadence;
  const queries = patch.watchQueries ?? existing.watchQueries;
  const suggest = patch.suggestAppFeatures ?? existing.suggestAppFeatures;
  const enabled = patch.enabled ?? existing.enabled;
  const maxVideos = patch.maxVideos ?? existing.maxVideos;
  const nextRunAt =
    patch.cadence && patch.cadence !== existing.cadence
      ? computeNextRunAt(cadence)
      : existing.nextRunAt;

  await db.execute(sql`
    UPDATE channel_intel_watches SET
      cadence = ${cadence},
      watch_queries = ${JSON.stringify(queries)},
      suggest_app_features = ${suggest},
      enabled = ${enabled},
      max_videos = ${maxVideos},
      next_run_at = ${nextRunAt},
      updated_at = NOW()
    WHERE id = ${id}
  `);
  return getChannelIntelWatch(id);
}

export async function deleteChannelIntelWatch(id: string): Promise<boolean> {
  await ensureChannelIntelTables();
  await db.execute(sql`DELETE FROM channel_intel_runs WHERE watch_id = ${id}`);
  const res = await db.execute(sql`DELETE FROM channel_intel_watches WHERE id = ${id}`);
  return (res.rowCount ?? 0) > 0;
}

export async function markChannelIntelWatchError(
  watch: ChannelIntelWatch,
  error: string,
): Promise<void> {
  await ensureChannelIntelTables();
  const nextRunAt = computeNextRunAt(watch.cadence);
  await db.execute(sql`
    UPDATE channel_intel_watches SET
      last_error = ${error},
      last_run_at = NOW(),
      next_run_at = ${nextRunAt},
      updated_at = NOW()
    WHERE id = ${watch.id}
  `);
}

export async function saveChannelIntelWatchRun(options: {
  watch: ChannelIntelWatch;
  corpus: ChannelIntelCorpus;
  briefings: ChannelIntelAnswer[];
  productSuggestions: ChannelIntelProductSuggestion[];
  newVideoIds: string[];
  error?: string | null;
}): Promise<void> {
  await ensureChannelIntelTables();
  const now = new Date();
  const nextRunAt = computeNextRunAt(options.watch.cadence, now);
  const seen = options.corpus.videos.map((v) => v.videoId);

  await db.execute(sql`
    UPDATE channel_intel_watches SET
      channel_title = ${options.corpus.channelTitle},
      channel_url = ${options.corpus.channelUrl},
      seen_video_ids = ${JSON.stringify(seen)},
      corpus = ${JSON.stringify(options.corpus)},
      last_briefings = ${JSON.stringify(options.briefings)},
      product_suggestions = ${JSON.stringify(options.productSuggestions)},
      last_new_video_ids = ${JSON.stringify(options.newVideoIds)},
      last_error = ${options.error ?? null},
      last_run_at = ${now.toISOString()},
      next_run_at = ${nextRunAt},
      updated_at = NOW()
    WHERE id = ${options.watch.id}
  `);

  await db.execute(sql`
    INSERT INTO channel_intel_runs (
      id, watch_id, new_video_count, briefings, product_suggestions, error
    ) VALUES (
      ${crypto.randomUUID()}, ${options.watch.id}, ${options.newVideoIds.length},
      ${JSON.stringify(options.briefings)}, ${JSON.stringify(options.productSuggestions)},
      ${options.error ?? null}
    )
  `);

  await db.execute(sql`
    DELETE FROM channel_intel_runs
    WHERE watch_id = ${options.watch.id}
      AND id IN (
        SELECT id FROM (
          SELECT id FROM channel_intel_runs
          WHERE watch_id = ${options.watch.id}
          ORDER BY run_at DESC
          OFFSET 10
        ) old_runs
      )
  `);
}
