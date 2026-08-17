import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { queryChannelIntel, type ChannelIntelCorpus } from "@/lib/marketing/channel-intel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

const bodySchema = z.object({
  corpus: corpusSchema,
  query: z.string().min(3).max(2000),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await queryChannelIntel(
      parsed.data.corpus as ChannelIntelCorpus,
      parsed.data.query,
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
