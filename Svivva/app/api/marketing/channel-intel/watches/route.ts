import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { MAX_CHANNEL_INTEL_VIDEOS, type ChannelIntelCorpus } from "@/lib/marketing/channel-intel";
import {
  deleteChannelIntelWatch,
  listChannelIntelWatches,
  toPublicWatch,
  updateChannelIntelWatch,
  upsertChannelIntelWatch,
} from "@/lib/marketing/channel-intel-store";
import { normalizeChannelVideosUrl } from "@/lib/clutety/youtube-channel";

export const dynamic = "force-dynamic";

const videoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  url: z.string(),
  channel: z.string(),
  description: z.string(),
  transcript: z.string(),
  publishedText: z.string().optional(),
  transcriptLength: z.number(),
  hasTranscript: z.boolean(),
});

const corpusSchema = z.object({
  channelTitle: z.string(),
  channelUrl: z.string(),
  ingestedAt: z.string(),
  videos: z.array(videoSchema).min(1).max(24),
  stats: z.object({
    listed: z.number(),
    withTranscript: z.number(),
    failed: z.number(),
  }),
});

const upsertSchema = z.object({
  channelUrl: z.string().min(3).max(500),
  channelTitle: z.string().min(1).max(200).optional(),
  maxVideos: z.number().int().min(3).max(MAX_CHANNEL_INTEL_VIDEOS).optional(),
  cadence: z.enum(["daily", "every_3_days", "weekly"]),
  watchQueries: z.array(z.string().min(3).max(2000)).min(1).max(5),
  suggestAppFeatures: z.boolean().optional(),
  enabled: z.boolean().optional(),
  corpus: corpusSchema.optional(),
});

const patchSchema = z.object({
  id: z.string().min(8),
  cadence: z.enum(["daily", "every_3_days", "weekly"]).optional(),
  watchQueries: z.array(z.string().min(3).max(2000)).min(1).max(5).optional(),
  suggestAppFeatures: z.boolean().optional(),
  enabled: z.boolean().optional(),
  maxVideos: z.number().int().min(3).max(MAX_CHANNEL_INTEL_VIDEOS).optional(),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!(await hasAdminAccess())) {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  try {
    const watches = await listChannelIntelWatches();
    return NextResponse.json({ watches: watches.map(toPublicWatch) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not load watches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const parsed = upsertSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid watch.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const channelUrl = normalizeChannelVideosUrl(parsed.data.channelUrl);
    const corpus = parsed.data.corpus as ChannelIntelCorpus | undefined;
    const watch = await upsertChannelIntelWatch({
      userId: auth.user?.id ?? null,
      channelUrl,
      channelTitle: parsed.data.channelTitle || corpus?.channelTitle || "YouTube channel",
      maxVideos: parsed.data.maxVideos ?? corpus?.videos.length ?? 15,
      cadence: parsed.data.cadence,
      watchQueries: parsed.data.watchQueries,
      suggestAppFeatures: parsed.data.suggestAppFeatures ?? true,
      enabled: parsed.data.enabled,
      corpus: corpus ?? null,
    });
    return NextResponse.json({ watch: toPublicWatch(watch) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not save watch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  try {
    const watch = await updateChannelIntelWatch(parsed.data.id, parsed.data);
    if (!watch) return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    return NextResponse.json({ watch: toPublicWatch(watch) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not update watch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const ok = await deleteChannelIntelWatch(id);
    if (!ok) return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not delete watch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
